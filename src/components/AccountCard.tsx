import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { typography } from '../constants/typography';

// ─── Types ─────────────────────────────────────────
// Import Account (and its RuleHealth) from the project's own type definitions
import { Account } from '../types';

type RuleHealth = 'green' | 'amber' | 'red';

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
}

// ─── Helpers ───────────────────────────────────────
const statusConfig: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  Evaluation: {
    bg: theme.colors.statusEvalBg,
    text: theme.colors.statusEval,
    icon: 'flask',
  },
  Funded: {
    bg: theme.colors.statusFundedBg,
    text: theme.colors.statusFunded,
    icon: 'checkmark-circle',
  },
  Failed: {
    bg: theme.colors.statusFailedBg,
    text: theme.colors.statusFailed,
    icon: 'close-circle',
  },
};

const healthConfig: Record<
  RuleHealth,
  { colour: string; bg: string; label: string; icon: string }
> = {
  green: {
    colour: theme.colors.profit,
    bg: theme.colors.statusFundedBg,
    label: 'Rules OK',
    icon: 'shield-checkmark',
  },
  amber: {
    colour: theme.colors.warning,
    bg: theme.colors.warningDim,
    label: 'Caution',
    icon: 'warning',
  },
  red: {
    colour: theme.colors.loss,
    bg: theme.colors.lossDim,
    label: 'At Risk',
    icon: 'alert-circle',
  },
};

const formatCurrency = (value: number): string =>
  `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Component ─────────────────────────────────────
export default function AccountCard({ account, onPress }: AccountCardProps) {
  const {
    name,
    balance,
    currentProfit,
    status,
    maxDrawdown,
    trailingDrawdown,
    profitTarget,
    ruleHealth,
    ruleHealthReason,
  } = account;

  const isProfitPositive = currentProfit >= 0;
  const statusCfg = statusConfig[status];
  const healthCfg = ruleHealth ? healthConfig[ruleHealth] : null;
  const [showReason, setShowReason] = useState(false);

  // Drawdown progress (0–1, where 1 = max drawdown hit)
  const drawdownRatio =
    maxDrawdown && trailingDrawdown != null
      ? Math.min(trailingDrawdown / maxDrawdown, 1)
      : null;

  // Profit progress towards target (0–1)
  const profitRatio =
    profitTarget && currentProfit > 0
      ? Math.min(currentProfit / profitTarget, 1)
      : null;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      style={styles.card}
      {...(onPress ? { onPress } : {})}
    >
      {/* ── Top row: name + status badge ─────────── */}
      <View style={styles.topRow}>
        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Ionicons
            name={statusCfg.icon as any}
            size={12}
            color={statusCfg.text}
          />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>
            {status}
          </Text>
        </View>
      </View>

      {/* ── Balance + P&L row ────────────────────── */}
      <View style={styles.dataRow}>
        <View style={styles.dataCell}>
          <Text style={styles.dataLabel}>Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
        </View>

        <View style={[styles.dataCell, { alignItems: 'flex-end' }]}>
          <Text style={styles.dataLabel}>Profit</Text>
          <Text
            style={[
              styles.profitValue,
              { color: isProfitPositive ? theme.colors.profit : theme.colors.loss },
            ]}
          >
            {isProfitPositive ? '+' : '-'}
            {formatCurrency(currentProfit)}
          </Text>
        </View>
      </View>

      {/* ── Drawdown bar (if data exists) ────────── */}
      {drawdownRatio != null && (
        <View style={styles.barSection}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Drawdown</Text>
            <Text style={styles.barMeta}>
              {formatCurrency(trailingDrawdown)} / {formatCurrency(maxDrawdown)}
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${drawdownRatio * 100}%`,
                  backgroundColor:
                    drawdownRatio < 0.5
                      ? theme.colors.profit
                      : drawdownRatio < 0.8
                      ? theme.colors.warning
                      : theme.colors.loss,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* ── Profit target bar (if in eval) ────────── */}
      {profitRatio != null && status === 'Evaluation' && (
        <View style={styles.barSection}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Target</Text>
            <Text style={styles.barMeta}>
              {formatCurrency(currentProfit)} / {formatCurrency(profitTarget!)}
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${profitRatio * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* ── Rule health pill ─────────────────────── */}
      {healthCfg && (
        <View style={styles.healthWrap}>
          {ruleHealthReason && ruleHealth !== 'green' ? (
            <Pressable
              style={[styles.healthPill, { backgroundColor: healthCfg.bg }]}
              onPress={() => setShowReason(true)}
            >
              <Ionicons
                name={healthCfg.icon as any}
                size={13}
                color={healthCfg.colour}
              />
              <Text style={[styles.healthText, { color: healthCfg.colour }]}>
                {healthCfg.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={healthCfg.colour}
              />
            </Pressable>
          ) : (
            <View style={[styles.healthPill, { backgroundColor: healthCfg.bg }]}>
              <Ionicons
                name={healthCfg.icon as any}
                size={13}
                color={healthCfg.colour}
              />
              <Text style={[styles.healthText, { color: healthCfg.colour }]}>
                {healthCfg.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Reason modal ──────────────────────────── */}
      {healthCfg && ruleHealthReason && ruleHealth !== 'green' && (
        <Modal
          visible={showReason}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReason(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowReason(false)}
          >
            <View style={styles.modalCard}>
              <View style={[styles.modalIconWrap, { backgroundColor: healthCfg.bg }]}>
                <Ionicons
                  name={healthCfg.icon as any}
                  size={24}
                  color={healthCfg.colour}
                />
              </View>
              <Text style={styles.modalTitle}>
                {ruleHealth === 'amber' ? 'Caution' : 'At Risk'} — {name}
              </Text>
              <Text style={[styles.modalReason, { color: healthCfg.colour }]}>
                {ruleHealthReason}
              </Text>
              <Pressable
                style={styles.modalDismiss}
                onPress={() => setShowReason(false)}
              >
                <Text style={styles.modalDismissText}>Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </Wrapper>
  );
}

// ─── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nameWrap: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Data row
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataCell: {
    gap: 4,
  },
  dataLabel: {
    color: theme.colors.textDim,
    ...typography.label,
  },
  balanceValue: {
    color: theme.colors.text,
    ...typography.mono,
    fontSize: 18,
    fontWeight: '700',
  },
  profitValue: {
    ...typography.mono,
    fontSize: 16,
    fontWeight: '700',
  },

  // Progress bars
  barSection: {
    marginTop: 14,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
  },
  barMeta: {
    color: theme.colors.textDim,
    ...typography.caption,
    fontFamily: 'monospace',
  },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.cardHighlight,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Health pill
  healthWrap: {
    marginTop: 14,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  healthText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Reason modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: theme.colors.text,
    ...typography.cardTitle,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalReason: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDismiss: {
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalDismissText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});