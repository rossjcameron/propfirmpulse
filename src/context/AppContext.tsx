import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Alert,
  applyTradeToAccount,
  BestPath,
  bestPathToFunded,
  generateAlerts,
  isDailyLossSafe,
  PathStyle,
  remainingR,
} from '../services/ruleEngine';
import { Account, Trade } from '../types';

// ─── Copytrade Input ───────────────────────────────

export type CopytradeInput = {
  accountIds: string[];
  strategy: string;
  direction: 'Long' | 'Short';
  r: number;
  entryTime: string;
  exitTime: string;
};

// ─── Context Type ──────────────────────────────────

type AppContextType = {
  accounts: Account[];
  trades: Trade[];
  alerts: Alert[];
  pathStyle: PathStyle;
  setPathStyle: (style: PathStyle) => void;
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => void;
  addCopytrade: (input: CopytradeInput) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  removeAccount: (accountId: string) => void;
  getRemainingR: (account: Account) => number;
  getBestPath: (account: Account) => BestPath | null;
  canTradeSafely: (account: Account, proposedPnl: number) => boolean;
  getDayPnL: (accountId: string) => number;
  getTotalDayPnL: () => number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Helpers ───────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayPnLForAccount(accountId: string, trades: Trade[]): number {
  const today = todayKey();
  return trades
    .filter(
      (t) =>
        t.accountIds.includes(accountId) &&
        t.createdAt.slice(0, 10) === today
    )
    .reduce((sum, t) => sum + t.pnl, 0);
}

// ─── Provider ──────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pathStyle, setPathStyle] = useState<PathStyle>('normal');

  // ── Add trade (with rule engine) ────────────
  const addTrade = (trade: Omit<Trade, 'id' | 'createdAt'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTrades = [newTrade, ...trades];

    setTrades(updatedTrades);

    setAccounts((prev) =>
      prev.map((account) => {
        if (!trade.accountIds.includes(account.id)) return account;

        if (account.status === 'Failed' || account.status === 'Funded') {
          return account;
        }

        const update = applyTradeToAccount(account, trade.pnl, updatedTrades);

        return {
          ...account,
          ...update,
        };
      })
    );
  };

  // ── Add copytrade (scaled by account size) ───
  const addCopytrade = (input: CopytradeInput) => {
    const { accountIds, strategy, direction, r, entryTime, exitTime } = input;
    const timestamp = Date.now();
    const newTrades: Trade[] = [];
    const outcome: Trade['outcome'] = r >= 0 ? 'Win' : 'Loss';

    accountIds.forEach((accountId, index) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;

      const oneR = account.startingBalance * 0.01;
      const scaledPnl = r * oneR;

      newTrades.push({
        id: `${timestamp}-${index}`,
        accountIds: [accountId],
        strategy,
        direction,
        outcome,
        entryTime,
        exitTime,
        pnl: scaledPnl,
        r,
        createdAt: new Date().toISOString(),
      });
    });

    if (newTrades.length === 0) return;

    const updatedTrades = [...newTrades, ...trades];
    setTrades(updatedTrades);

    setAccounts((prev) =>
      prev.map((account) => {
        const trade = newTrades.find((t) => t.accountIds.includes(account.id));
        if (!trade) return account;

        if (account.status === 'Failed' || account.status === 'Funded') {
          return account;
        }

        const update = applyTradeToAccount(account, trade.pnl, updatedTrades);

        return {
          ...account,
          ...update,
        };
      })
    );
  };

  // ── Add account ─────────────────────────────
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  // ── Remove account ──────────────────────────
  const removeAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  };

  // ── Derived: alerts across all accounts ─────
  const alerts = useMemo(() => {
    return accounts.flatMap((account) => generateAlerts(account, trades));
  }, [accounts, trades]);

  // ── Helpers exposed to screens ──────────────
  const getRemainingR = (account: Account): number => {
    return remainingR(account);
  };

  const getBestPath = (account: Account): BestPath | null => {
    return bestPathToFunded(account, pathStyle);
  };

  const canTradeSafely = (account: Account, proposedPnl: number): boolean => {
    if (account.status === 'Failed' || account.status === 'Funded') return false;
    return isDailyLossSafe(account, trades, proposedPnl);
  };

  const getDayPnL = (accountId: string): number => {
    return dayPnLForAccount(accountId, trades);
  };

  const getTotalDayPnL = (): number => {
    return accounts.reduce(
      (sum, account) => sum + dayPnLForAccount(account.id, trades),
      0
    );
  };

  // ── Context value ───────────────────────────
  const value = useMemo(
    () => ({
      accounts,
      trades,
      alerts,
      pathStyle,
      setPathStyle,
      addTrade,
      addCopytrade,
      addAccount,
      removeAccount,
      getRemainingR,
      getBestPath,
      canTradeSafely,
      getDayPnL,
      getTotalDayPnL,
    }),
    [accounts, trades, alerts, pathStyle]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}