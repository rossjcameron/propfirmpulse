import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../src/constants/styles';
import { theme } from '../../src/constants/theme';
import { typography } from '../../src/constants/typography';
import { useApp } from '../../src/context/AppContext';

export default function LogTradeScreen() {
  const { accounts, addCopytrade, getDayPnL } = useApp();

  const activeAccounts = accounts.filter(
    (a) => a.status !== 'Failed'
  );

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [strategy, setStrategy] = useState('NY ORB');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [rInput, setRInput] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const allSelected =
    activeAccounts.length > 0 &&
    selectedAccountIds.length === activeAccounts.length;

  const isCopytrade = selectedAccountIds.length > 1;

  // ── Toggle account selection ──────────────────
  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(activeAccounts.map((a) => a.id));
    }
  };

  // ── Scaled P&L preview per account ────────────
  const rValue = Number(rInput) || 0;

  const scaledPnLs = useMemo(() => {
    if (rValue === 0) return [];
    return selectedAccountIds
      .map((id) => {
        const account = accounts.find((a) => a.id === id);
        if (!account) return null;
        const oneR = account.startingBalance * 0.01;
        const pnl = rValue * oneR;
        return { id: account.id, name: account.name, pnl, oneR, balance: account.balance };
      })
      .filter(Boolean) as { id: string; name: string; pnl: number; oneR: number; balance: number }[];
  }, [rValue, selectedAccountIds, accounts]);

  const totalScaledPnL = scaledPnLs.reduce((sum, s) => sum + s.pnl, 0);

  // ── Daily P&L breakdown ───────────────────────
  const dailyBreakdown = useMemo(() => {
    if (selectedAccountIds.length === 0) return [];
    return selectedAccountIds
      .map((id) => {
        const account = accounts.find((a) => a.id === id);
        if (!account) return null;
        const dayPnl = getDayPnL(id);
        return { id: account.id, name: account.name, dayPnl };
      })
      .filter(Boolean) as { id: string; name: string; dayPnl: number }[];
  }, [selectedAccountIds, accounts, getDayPnL]);

  const totalDayPnL = dailyBreakdown.reduce((sum, d) => sum + d.dayPnl, 0);

  // ── Validation ────────────────────────────────
  const isValid = selectedAccountIds.length > 0 && rValue !== 0;

  // ── Submit ────────────────────────────────────
  const submitTrade = () => {
    if (!isValid) return;

    addCopytrade({
      accountIds: selectedAccountIds,
      strategy,
      direction,
      r: rValue,
      entryTime: new Date().toISOString(),
      exitTime: new Date().toISOString(),
    });

    setRInput('');
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[globalStyles.title, styles.title]}>Log Trade</Text>

        {/* ── Account Selection ────────────────────── */}
        <Text style={[globalStyles.label, styles.fieldLabel]}>Accounts</Text>

        {/* Select All toggle */}
        {activeAccounts.length > 1 && (
          <Pressable
            style={[styles.allToggle, allSelected && styles.allToggleActive]}
            onPress={toggleAll}
          >
            <Ionicons
              name={allSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={18}
              color={allSelected ? theme.colors.primary : theme.colors.textDim}
            />
            <Text style={[styles.allToggleText, allSelected && { color: theme.colors.primary }]}>
              All accounts {isCopytrade ? '(copytrade)' : ''}
            </Text>
          </Pressable>
        )}

        <View style={styles.chipWrap}>
          {activeAccounts.map((account) => {
            const active = selectedAccountIds.includes(account.id);
            return (
              <Pressable
                key={account.id}
                onPress={() => toggleAccount(account.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Ionicons
                  name={active ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={active ? theme.colors.primary : theme.colors.textDim}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {account.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeAccounts.length === 0 && (
          <Text style={styles.noAccountsHint}>
            Add an account first to start logging trades.
          </Text>
        )}

        {/* ── Direction Toggle ─────────────────────── */}
        <Text style={[globalStyles.label, styles.fieldLabel]}>Direction</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, direction === 'Long' && styles.toggleLongActive]}
            onPress={() => setDirection('Long')}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={direction === 'Long' ? theme.colors.profit : theme.colors.textDim}
            />
            <Text
              style={[
                styles.toggleText,
                direction === 'Long' && { color: theme.colors.profit },
              ]}
            >
              Long
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggle, direction === 'Short' && styles.toggleShortActive]}
            onPress={() => setDirection('Short')}
          >
            <Ionicons
              name="trending-down"
              size={16}
              color={direction === 'Short' ? theme.colors.loss : theme.colors.textDim}
            />
            <Text
              style={[
                styles.toggleText,
                direction === 'Short' && { color: theme.colors.loss },
              ]}
            >
              Short
            </Text>
          </Pressable>
        </View>

        {/* ── Strategy ─────────────────────────────── */}
        <Text style={[globalStyles.label, styles.fieldLabel]}>Strategy</Text>
        <TextInput
          value={strategy}
          onChangeText={setStrategy}
          style={[
            globalStyles.input,
            focusedField === 'strategy' && globalStyles.inputFocused,
          ]}
          placeholder="e.g. NY ORB"
          placeholderTextColor={theme.colors.textDim}
          onFocus={() => setFocusedField('strategy')}
          onBlur={() => setFocusedField(null)}
        />

        {/* ── R Input ──────────────────────────────── */}
        <Text style={[globalStyles.label, styles.fieldLabel]}>Trade Result (R)</Text>
        <TextInput
          value={rInput}
          onChangeText={setRInput}
          style={[
            globalStyles.input,
            focusedField === 'r' && globalStyles.inputFocused,
          ]}
          keyboardType="numeric"
          placeholder="e.g. 2 for a win, -1 for a loss"
          placeholderTextColor={theme.colors.textDim}
          onFocus={() => setFocusedField('r')}
          onBlur={() => setFocusedField(null)}
        />

        {/* ── Scaled P&L Preview ───────────────────── */}
        {scaledPnLs.length > 0 && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {isCopytrade ? 'Copytrade Preview' : 'Trade Preview'}
              </Text>
              <Text
                style={[
                  styles.previewTotalValue,
                  { color: totalScaledPnL >= 0 ? theme.colors.profit : theme.colors.loss },
                ]}
              >
                {totalScaledPnL >= 0 ? '+' : ''}${totalScaledPnL.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </Text>
            </View>

            {scaledPnLs.map((item) => {
              const isPositive = item.pnl >= 0;
              return (
                <View key={item.id} style={styles.previewRow}>
                  <View style={styles.previewRowLeft}>
                    <Text style={styles.previewAccountName}>{item.name}</Text>
                    <Text style={styles.previewMeta}>1R = ${item.oneR.toLocaleString()}</Text>
                  </View>
                  <Text
                    style={[
                      styles.previewPnl,
                      { color: isPositive ? theme.colors.profit : theme.colors.loss },
                    ]}
                  >
                    {isPositive ? '+' : ''}${item.pnl.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Daily Group P&L ──────────────────────── */}
        {selectedAccountIds.length > 0 && (
          <View style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>Today&apos;s P&amp;L</Text>
              <Text
                style={[
                  styles.dayTotal,
                  { color: totalDayPnL >= 0 ? theme.colors.profit : theme.colors.loss },
                ]}
              >
                {totalDayPnL >= 0 ? '+' : ''}${totalDayPnL.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </Text>
            </View>

            {dailyBreakdown.map((item) => {
              const isPositive = item.dayPnl >= 0;
              return (
                <View key={item.id} style={styles.dayRow}>
                  <Text style={styles.dayAccountName}>{item.name}</Text>
                  <Text
                    style={[
                      styles.dayAccountPnl,
                      { color: item.dayPnl === 0 ? theme.colors.textDim : (isPositive ? theme.colors.profit : theme.colors.loss) },
                    ]}
                  >
                    {item.dayPnl === 0 ? '$0' : `${isPositive ? '+' : ''}$${item.dayPnl.toLocaleString()}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Submit ───────────────────────────────── */}
        <Pressable
          onPress={submitTrade}
          style={[globalStyles.buttonPrimary, styles.button, !isValid && styles.buttonDisabled]}
          disabled={!isValid}
        >
          <Ionicons name="checkmark-circle" size={18} color="#050507" />
          <Text style={globalStyles.buttonPrimaryText}>
            {isCopytrade ? `Save to ${selectedAccountIds.length} Accounts` : 'Save Trade'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 18,
  },

  // All toggle
  allToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  allToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryGlow,
  },
  allToggleText: {
    color: theme.colors.textMuted,
    ...typography.bodyMedium,
  },

  // Account chips
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryGlow,
  },
  chipText: {
    color: theme.colors.textMuted,
    ...typography.bodyMedium,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },

  noAccountsHint: {
    color: theme.colors.textDim,
    ...typography.body,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Direction toggles
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 14,
  },
  toggleLongActive: {
    borderColor: theme.colors.profit,
    backgroundColor: 'rgba(57, 255, 136, 0.06)',
  },
  toggleShortActive: {
    borderColor: theme.colors.loss,
    backgroundColor: 'rgba(255, 68, 102, 0.06)',
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },

  // Scaled P&L preview
  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    ...theme.shadows.card,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  previewTitle: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  previewTotalValue: {
    ...typography.mono,
    fontSize: 16,
    fontWeight: '700',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  previewRowLeft: {
    flex: 1,
    gap: 2,
  },
  previewAccountName: {
    color: theme.colors.text,
    ...typography.bodyMedium,
  },
  previewMeta: {
    color: theme.colors.textDim,
    ...typography.caption,
  },
  previewPnl: {
    ...typography.mono,
    fontSize: 15,
    fontWeight: '700',
  },

  // Daily P&L card
  dayCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.card,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayTitle: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  dayTotal: {
    ...typography.mono,
    fontSize: 16,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dayAccountName: {
    color: theme.colors.textMuted,
    ...typography.body,
  },
  dayAccountPnl: {
    ...typography.mono,
    fontSize: 13,
    fontWeight: '600',
  },

  // Submit button
  button: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});