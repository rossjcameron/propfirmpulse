import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountCard from '../../src/components/AccountCard';
import { globalStyles } from '../../src/constants/styles';
import { theme } from '../../src/constants/theme';
import { typography } from '../../src/constants/typography';
import { useApp } from '../../src/context/AppContext';

export default function DashboardScreen() {
  const { accounts, trades, getTotalDayPnL, getRemainingR, getBestPath } =
    useApp();

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalPnL = accounts.reduce((sum, acc) => sum + acc.currentProfit, 0);
  const isPnLPositive = totalPnL >= 0;
  const totalR = trades.reduce((sum, t) => sum + t.r, 0);
  const dayPnL = getTotalDayPnL();
  const isDayPositive = dayPnL >= 0;

  const fundedCount = accounts.filter((a) => a.status === 'Funded').length;
  const evalCount = accounts.filter((a) => a.status === 'Evaluation').length;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.brandName}>PropFirmPulse</Text>
          <Text style={styles.brandTagline}>Control panel</Text>
        </View>

        {/* ── Hero Stat: Total Balance ────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlowBar} />
          <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
          <Text style={styles.heroValue}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.heroMeta}>
            <View
              style={[
                styles.heroPill,
                {
                  backgroundColor: isPnLPositive
                    ? theme.colors.primaryGlow
                    : theme.colors.lossDim,
                },
              ]}
            >
              <Text
                style={[
                  styles.heroPillText,
                  { color: isPnLPositive ? theme.colors.profit : theme.colors.loss },
                ]}
              >
                {isPnLPositive ? '+' : ''}
                ${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <Text style={styles.heroSubtext}>All accounts</Text>
          </View>
        </View>

        {/* ── Quick Stats Row ─────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[globalStyles.card, styles.statCell]}>
            <Text style={globalStyles.label}>Day P&amp;L</Text>
            <Text
              style={[
                styles.statValue,
                { color: isDayPositive ? theme.colors.profit : theme.colors.loss },
              ]}
            >
              {isDayPositive ? '+' : ''}${dayPnL.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
          </View>

          <View style={[globalStyles.card, styles.statCell]}>
            <Text style={globalStyles.label}>Total R</Text>
            <Text
              style={[
                styles.statValue,
                { color: totalR >= 0 ? theme.colors.profit : theme.colors.loss },
              ]}
            >
              {totalR >= 0 ? '+' : ''}
              {totalR.toFixed(1)}R
            </Text>
          </View>

          <View style={[globalStyles.card, styles.statCell]}>
            <Text style={globalStyles.label}>Funded</Text>
            <Text style={[styles.statValue, { color: theme.colors.profit }]}>
              {fundedCount}
            </Text>
          </View>

          <View style={[globalStyles.card, styles.statCell]}>
            <Text style={globalStyles.label}>In Eval</Text>
            <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
              {evalCount}
            </Text>
          </View>
        </View>

        {/* ── Best Path (for eval accounts) ───────────── */}
        {accounts
          .filter((a) => a.status === 'Evaluation' && a.currentProfit < a.profitTarget)
          .map((account) => {
            const path = getBestPath(account);
            const rLeft = getRemainingR(account);
            if (!path) return null;

            return (
              <View key={`path-${account.id}`} style={styles.pathCard}>
                <View style={styles.pathHeader}>
                  <Text style={styles.pathAccountName}>{account.name}</Text>
                  <Text style={styles.pathRemaining}>{rLeft.toFixed(1)}R to go</Text>
                </View>
                <View style={styles.pathSteps}>
                  {path.steps.map((step, i) => (
                    <React.Fragment key={i}>
                      <View style={styles.pathStep}>
                        <Text style={styles.pathStepText}>{step}R</Text>
                      </View>
                      {i < path.steps.length - 1 && (
                        <Ionicons
                          name="chevron-forward"
                          size={12}
                          color={theme.colors.textDim}
                        />
                      )}
                    </React.Fragment>
                  ))}
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.colors.profit}
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </View>
            );
          })}

        {/* ── Accounts Section ────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={globalStyles.sectionTitle}>Accounts</Text>
          <Text style={styles.sectionCount}>{accounts.length}</Text>
        </View>

        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.lg,
  },
  brandName: {
    color: theme.colors.text,
    ...typography.title,
  },
  brandTagline: {
    color: theme.colors.textDim,
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },

  // Hero stat card
  heroCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  heroGlowBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    opacity: 0.8,
  },
  heroLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: 8,
  },
  heroValue: {
    color: theme.colors.text,
    ...typography.heroStat,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  heroPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroSubtext: {
    color: theme.colors.textDim,
    ...typography.caption,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'flex-start',
  },
  statValue: {
    color: theme.colors.text,
    ...typography.monoLarge,
    marginTop: 6,
  },

  // Best path
  pathCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pathAccountName: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  pathRemaining: {
    color: theme.colors.textMuted,
    ...typography.caption,
    fontWeight: '600',
  },
  pathSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pathStep: {
    backgroundColor: theme.colors.primaryGlow,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pathStepText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sectionCount: {
    color: theme.colors.textDim,
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
});