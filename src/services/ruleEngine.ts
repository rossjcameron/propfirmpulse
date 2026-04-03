import { Account, RuleHealth, Trade } from '../types';

// ─── Alert Types ───────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface Alert {
  id: string;
  accountId: string;
  severity: AlertSeverity;
  message: string;
}

// ─── Best Path Types ───────────────────────────────
export interface BestPath {
  steps: number[];
  totalR: number;
}

// ─── Daily P&L Helpers ─────────────────────────────

/**
 * Get today's date string in YYYY-MM-DD format.
 */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Sum P&L for a given account on a given day.
 */
function dailyPnL(
  accountId: string,
  trades: Trade[],
  dateKey: string
): number {
  return trades
    .filter(
      (t) =>
        t.accountIds.includes(accountId) &&
        t.createdAt.slice(0, 10) === dateKey
    )
    .reduce((sum, t) => sum + t.pnl, 0);
}

/**
 * Get the single best trading day's P&L for an account.
 */
function bestDayPnL(accountId: string, trades: Trade[]): number {
  const dailyTotals = new Map<string, number>();

  for (const t of trades) {
    if (!t.accountIds.includes(accountId)) continue;
    const key = t.createdAt.slice(0, 10);
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + t.pnl);
  }

  let best = 0;
  for (const total of dailyTotals.values()) {
    if (total > best) best = total;
  }
  return best;
}

// ─── Core Rule Checks ──────────────────────────────

/**
 * Calculate the new trailing drawdown floor after a balance change.
 * The floor only ever moves UP — it never decreases.
 */
export function calcTrailingDrawdown(
  currentFloor: number,
  newBalance: number,
  maxDrawdown: number
): number {
  return Math.max(currentFloor, newBalance - maxDrawdown);
}

/**
 * Check if adding a trade's P&L would breach the daily loss limit.
 * Returns true if the trade is SAFE to take.
 */
export function isDailyLossSafe(
  account: Account,
  trades: Trade[],
  incomingPnl: number
): boolean {
  if (account.dailyLossLimit == null) return true;

  const todayTotal = dailyPnL(account.id, trades, todayKey());
  const projectedTotal = todayTotal + incomingPnl;

  // Daily loss limit is expressed as a positive number; losses are negative
  return projectedTotal > -account.dailyLossLimit;
}

/**
 * Check if the consistency rule is currently passing.
 * Rule: no single day's profit may exceed consistencyPercent of total profit.
 * Only relevant when total profit is positive.
 */
export function isConsistencyPassing(
  account: Account,
  trades: Trade[]
): boolean {
  if (account.consistencyPercent == null) return true;
  if (account.currentProfit <= 0) return true;

  const best = bestDayPnL(account.id, trades);
  if (best <= 0) return true;

  const maxAllowed = account.currentProfit * (account.consistencyPercent / 100);
  return best <= maxAllowed;
}

/**
 * Calculate how much remaining R is needed to hit the profit target.
 * 1R is fixed at 1% of the starting balance (not riskPerTrade).
 * Remaining $ = profitTarget - currentProfit, then divide by 1R.
 */
export function remainingR(account: Account): number {
  const remaining = account.profitTarget - account.currentProfit;
  if (remaining <= 0) return 0;
  const oneR = account.startingBalance * 0.01;
  if (oneR === 0) return 0;
  return remaining / oneR;
}

export type PathStyle = 'aggressive' | 'normal' | 'conservative';

/**
 * Generate a "best path to funded" sequence based on the chosen style.
 *
 * Uses the exact remaining R (with decimals) so the final step
 * captures any fractional remainder.
 *
 * Aggressive:  big steps (3R), finish with remainder
 * Normal:      medium steps (2R), finish with remainder
 * Conservative: one 2R step then 1R steps, finish with remainder
 */
export function bestPathToFunded(
  account: Account,
  style: PathStyle = 'normal'
): BestPath | null {
  const rRemaining = remainingR(account);
  if (rRemaining <= 0) return null;

  const steps: number[] = [];
  const stepSize = style === 'aggressive' ? 3 : 2;

  if (style === 'conservative') {
    // One 2R step if possible, then 1R steps, remainder on final step
    let left = rRemaining;

    if (left >= 2) {
      steps.push(2);
      left -= 2;
    }

    while (left > 1) {
      steps.push(1);
      left -= 1;
    }

    if (left > 0) {
      // Round to 1 decimal to keep it clean
      steps.push(Math.round(left * 10) / 10);
    }
  } else {
    // Aggressive (3R) or Normal (2R) steps, remainder on final step
    let left = rRemaining;

    while (left > stepSize) {
      steps.push(stepSize);
      left -= stepSize;
    }

    if (left > 0) {
      steps.push(Math.round(left * 10) / 10);
    }
  }

  return { steps, totalR: Math.round(rRemaining * 10) / 10 };
}

// ─── Account State After Trade ─────────────────────

export interface AccountUpdate {
  balance: number;
  currentProfit: number;
  trailingDrawdown: number;
  ruleHealth: RuleHealth;
  ruleHealthReason?: string;
  status: Account['status'];
}

/**
 * Calculate the full updated account state after a trade.
 * This is the central function — call it from AppContext when logging a trade.
 */
export function applyTradeToAccount(
  account: Account,
  tradePnl: number,
  allTrades: Trade[]
): AccountUpdate {
  const newBalance = account.balance + tradePnl;
  const newProfit = newBalance - account.startingBalance;

  const newFloor = calcTrailingDrawdown(
    account.trailingDrawdown,
    newBalance,
    account.maxDrawdown
  );

  // ── Determine status ────────────────────────
  let status: Account['status'] = account.status;

  // Already failed/funded? Don't change.
  if (status !== 'Failed' && status !== 'Funded') {
    if (newBalance <= newFloor) {
      status = 'Failed';
    } else if (newProfit >= account.profitTarget) {
      status = 'Funded';
    }
  }

  // ── Determine rule health ───────────────────
  let ruleHealth: RuleHealth = 'green';
  let ruleHealthReason: string | undefined;

  if (status === 'Failed') {
    ruleHealth = 'red';
    ruleHealthReason = 'Drawdown limit breached';
  } else {
    const cushion = newBalance - newFloor;
    const oneR = account.riskPerTrade;

    // Check drawdown proximity
    if (cushion <= oneR) {
      ruleHealth = 'red';
      ruleHealthReason = `Only $${cushion.toFixed(0)} cushion — 1 loss away from failing`;
    } else if (cushion <= oneR * 2) {
      ruleHealth = 'amber';
      ruleHealthReason = `$${cushion.toFixed(0)} drawdown cushion — ${Math.floor(cushion / oneR)}R remaining`;
    }

    // Check daily loss limit proximity
    if (account.dailyLossLimit != null && ruleHealth !== 'red') {
      const todayTotal = dailyPnL(account.id, allTrades, todayKey());
      const dailyRemaining = account.dailyLossLimit + todayTotal;

      if (dailyRemaining <= oneR) {
        ruleHealth = 'red';
        ruleHealthReason = `Daily loss limit nearly reached — $${dailyRemaining.toFixed(0)} left today`;
      } else if (dailyRemaining <= oneR * 2) {
        ruleHealth = 'amber';
        ruleHealthReason = `Approaching daily loss limit — $${dailyRemaining.toFixed(0)} left today`;
      }
    }

    // Check consistency rule
    if (!isConsistencyPassing(
      { ...account, currentProfit: newProfit },
      allTrades
    )) {
      if (ruleHealth === 'green') {
        ruleHealth = 'amber';
        ruleHealthReason = `Best day exceeds ${account.consistencyPercent}% of total profit`;
      } else if (ruleHealth === 'amber' && !ruleHealthReason?.includes('consistency')) {
        ruleHealthReason += ` · Best day exceeds ${account.consistencyPercent}% consistency rule`;
      }
    }
  }

  return {
    balance: newBalance,
    currentProfit: newProfit,
    trailingDrawdown: newFloor,
    ruleHealth,
    ruleHealthReason,
    status,
  };
}

// ─── Alert Generation ──────────────────────────────

/**
 * Generate alerts for an account based on its current state.
 * Call this after updating account state to populate the dashboard.
 */
export function generateAlerts(
  account: Account,
  trades: Trade[]
): Alert[] {
  const alerts: Alert[] = [];
  const oneR = account.riskPerTrade;

  // Skip alerts for terminal states
  if (account.status === 'Failed') {
    alerts.push({
      id: `${account.id}-failed`,
      accountId: account.id,
      severity: 'danger',
      message: `${account.name} has failed. Drawdown limit breached.`,
    });
    return alerts;
  }

  if (account.status === 'Funded') {
    alerts.push({
      id: `${account.id}-funded`,
      accountId: account.id,
      severity: 'info',
      message: `${account.name} has passed! Profit target reached.`,
    });
    return alerts;
  }

  // ── Drawdown proximity ─────────────────────
  const cushion = account.balance - account.trailingDrawdown;

  if (cushion <= oneR) {
    alerts.push({
      id: `${account.id}-dd-critical`,
      accountId: account.id,
      severity: 'danger',
      message: `1 more loss will fail ${account.name}. Only $${cushion.toFixed(0)} cushion remaining.`,
    });
  } else if (cushion <= oneR * 2) {
    alerts.push({
      id: `${account.id}-dd-warning`,
      accountId: account.id,
      severity: 'warning',
      message: `${account.name} is ${Math.floor(cushion / oneR)}R from drawdown limit.`,
    });
  }

  // ── Daily loss limit ───────────────────────
  if (account.dailyLossLimit != null) {
    const todayTotal = dailyPnL(account.id, trades, todayKey());
    const dailyRemaining = account.dailyLossLimit + todayTotal;

    if (dailyRemaining <= 0) {
      alerts.push({
        id: `${account.id}-daily-breached`,
        accountId: account.id,
        severity: 'danger',
        message: `Daily loss limit breached on ${account.name}. Stop trading this account today.`,
      });
    } else if (dailyRemaining <= oneR) {
      alerts.push({
        id: `${account.id}-daily-critical`,
        accountId: account.id,
        severity: 'danger',
        message: `Next trade must be ≤ $${dailyRemaining.toFixed(0)} risk on ${account.name} (daily limit).`,
      });
    } else if (dailyRemaining <= oneR * 2) {
      alerts.push({
        id: `${account.id}-daily-warning`,
        accountId: account.id,
        severity: 'warning',
        message: `$${dailyRemaining.toFixed(0)} left on daily loss limit for ${account.name}.`,
      });
    }
  }

  // ── Consistency rule ───────────────────────
  if (!isConsistencyPassing(account, trades)) {
    const best = bestDayPnL(account.id, trades);
    const maxAllowed =
      account.currentProfit * ((account.consistencyPercent ?? 0) / 100);

    alerts.push({
      id: `${account.id}-consistency`,
      accountId: account.id,
      severity: 'warning',
      message: `Consistency warning: best day ($${best.toFixed(0)}) exceeds ${account.consistencyPercent}% of total profit ($${maxAllowed.toFixed(0)} max).`,
    });
  }

  // ── Close to funded ────────────────────────
  const rLeft = remainingR(account);
  if (rLeft > 0 && rLeft <= 2) {
    alerts.push({
      id: `${account.id}-nearly-funded`,
      accountId: account.id,
      severity: 'info',
      message: `${account.name} is ${rLeft.toFixed(1)}R away from funded!`,
    });
  }

  return alerts;
}