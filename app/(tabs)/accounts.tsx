import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountCard from '../../src/components/AccountCard';
import { globalStyles } from '../../src/constants/styles';
import { theme } from '../../src/constants/theme';
import { typography } from '../../src/constants/typography';
import { useApp } from '../../src/context/AppContext';

// ─── Types ─────────────────────────────────────────
type AccountMode = 'new' | 'in-progress';

type FormData = {
  name: string;
  startingBalance: string;
  profitTarget: string;
  maxDrawdown: string;
  dailyLossLimit: string;
  consistencyPercent: string;
  riskPerTrade: string;
  // In-progress only
  currentBalance: string;
  currentDrawdownLevel: string;
};

const emptyForm: FormData = {
  name: '',
  startingBalance: '',
  profitTarget: '',
  maxDrawdown: '',
  dailyLossLimit: '',
  consistencyPercent: '',
  riskPerTrade: '',
  currentBalance: '',
  currentDrawdownLevel: '',
};

export default function AccountsScreen() {
  const { accounts, addAccount, removeAccount } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<AccountMode>('new');
  const [form, setForm] = useState<FormData>(emptyForm);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const funded = accounts.filter((a) => a.status === 'Funded');
  const evaluation = accounts.filter((a) => a.status === 'Evaluation');
  const failed = accounts.filter((a) => a.status === 'Failed');

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openForm = () => {
    setForm(emptyForm);
    setMode('new');
    setShowForm(true);
  };

  // ── Validation ────────────────────────────────
  const baseValid =
    form.name.trim() !== '' &&
    Number(form.startingBalance) > 0 &&
    Number(form.profitTarget) > 0 &&
    Number(form.maxDrawdown) > 0 &&
    Number(form.riskPerTrade) > 0;

  const inProgressValid =
    mode === 'in-progress'
      ? Number(form.currentBalance) > 0 && Number(form.currentDrawdownLevel) > 0
      : true;

  const isValid = baseValid && inProgressValid;

  // ── Submit ────────────────────────────────────
  const handleSubmit = () => {
    if (!isValid) return;

    const startingBalance = Number(form.startingBalance);
    const maxDrawdown = Number(form.maxDrawdown);

    if (mode === 'new') {
      addAccount({
        name: form.name.trim(),
        balance: startingBalance,
        startingBalance,
        profitTarget: Number(form.profitTarget),
        maxDrawdown,
        trailingDrawdown: startingBalance - maxDrawdown,
        dailyLossLimit: form.dailyLossLimit ? Number(form.dailyLossLimit) : undefined,
        consistencyPercent: form.consistencyPercent ? Number(form.consistencyPercent) : undefined,
        status: 'Evaluation',
        ruleHealth: 'green',
        riskPerTrade: Number(form.riskPerTrade),
        currentProfit: 0,
      });
    } else {
      const currentBalance = Number(form.currentBalance);
      const currentProfit = currentBalance - startingBalance;
      const currentDrawdownLevel = Number(form.currentDrawdownLevel);

      // Trailing drawdown floor: the highest it's ever been is
      // reflected by the current drawdown level the user provides
      const trailingDrawdown = currentDrawdownLevel;

      // Determine initial health
      const cushion = currentBalance - trailingDrawdown;
      const oneR = Number(form.riskPerTrade);
      let ruleHealth: 'green' | 'amber' | 'red' = 'green';
      let ruleHealthReason: string | undefined;

      if (cushion <= oneR) {
        ruleHealth = 'red';
        ruleHealthReason = `Only $${cushion.toFixed(0)} cushion — 1 loss away from failing`;
      } else if (cushion <= oneR * 2) {
        ruleHealth = 'amber';
        ruleHealthReason = `$${cushion.toFixed(0)} drawdown cushion — ${Math.floor(cushion / oneR)}R remaining`;
      }

      let status: 'Evaluation' | 'Funded' | 'Failed' = 'Evaluation';
      if (currentBalance <= trailingDrawdown) {
        status = 'Failed';
        ruleHealth = 'red';
        ruleHealthReason = 'Drawdown limit breached';
      } else if (currentProfit >= Number(form.profitTarget)) {
        status = 'Funded';
      }

      addAccount({
        name: form.name.trim(),
        balance: currentBalance,
        startingBalance,
        profitTarget: Number(form.profitTarget),
        maxDrawdown,
        trailingDrawdown,
        dailyLossLimit: form.dailyLossLimit ? Number(form.dailyLossLimit) : undefined,
        consistencyPercent: form.consistencyPercent ? Number(form.consistencyPercent) : undefined,
        status,
        ruleHealth,
        ruleHealthReason,
        riskPerTrade: oneR,
        currentProfit,
      });
    }

    setForm(emptyForm);
    setShowForm(false);
  };

  // ── Preview values ────────────────────────────
  const previewBalance =
    mode === 'in-progress' && Number(form.currentBalance) > 0
      ? Number(form.currentBalance)
      : Number(form.startingBalance);
  const previewProfit = previewBalance - Number(form.startingBalance);
  const oneRPreview = Number(form.startingBalance) * 0.01;
  const rToFunded =
    oneRPreview > 0
      ? (Number(form.profitTarget) - Math.max(previewProfit, 0)) / oneRPreview
      : 0;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────── */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Accounts</Text>
          <Pressable style={styles.addButton} onPress={openForm}>
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

        {/* ── Summary pills ──────────────────────── */}
        {accounts.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, { backgroundColor: theme.colors.statusFundedBg }]}>
              <View style={[styles.dot, { backgroundColor: theme.colors.statusFunded }]} />
              <Text style={[styles.summaryText, { color: theme.colors.statusFunded }]}>
                {funded.length} Funded
              </Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: theme.colors.statusEvalBg }]}>
              <View style={[styles.dot, { backgroundColor: theme.colors.statusEval }]} />
              <Text style={[styles.summaryText, { color: theme.colors.statusEval }]}>
                {evaluation.length} Eval
              </Text>
            </View>
            {failed.length > 0 && (
              <View style={[styles.summaryPill, { backgroundColor: theme.colors.statusFailedBg }]}>
                <View style={[styles.dot, { backgroundColor: theme.colors.statusFailed }]} />
                <Text style={[styles.summaryText, { color: theme.colors.statusFailed }]}>
                  {failed.length} Failed
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Account groups ─────────────────────── */}
        {funded.length > 0 && (
          <>
            <Text style={styles.groupTitle}>Funded</Text>
            {funded.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </>
        )}

        {evaluation.length > 0 && (
          <>
            <Text style={styles.groupTitle}>In Evaluation</Text>
            {evaluation.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </>
        )}

        {failed.length > 0 && (
          <>
            <Text style={styles.groupTitle}>Failed</Text>
            {failed.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </>
        )}

        {/* ── Empty state ─────────────────────────── */}
        {accounts.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={40} color={theme.colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyBody}>
              Tap the + button to add your first prop firm account.
            </Text>
            <Pressable
              style={[globalStyles.buttonPrimary, { marginTop: 20, paddingHorizontal: 32 }]}
              onPress={openForm}
            >
              <Text style={globalStyles.buttonPrimaryText}>Add Account</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ── Add Account Modal ─────────────────────── */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowForm(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>New Account</Text>
              <Pressable onPress={handleSubmit} disabled={!isValid}>
                <Text
                  style={[
                    styles.modalSave,
                    { opacity: isValid ? 1 : 0.3 },
                  ]}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── New vs In Progress toggle ──────── */}
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Account Status</Text>
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeOption, mode === 'new' && styles.modeActive]}
                  onPress={() => setMode('new')}
                >
                  <Ionicons
                    name="sparkles"
                    size={16}
                    color={mode === 'new' ? theme.colors.primary : theme.colors.textDim}
                  />
                  <Text
                    style={[
                      styles.modeText,
                      mode === 'new' && styles.modeTextActive,
                    ]}
                  >
                    Brand New
                  </Text>
                  <Text style={styles.modeSubtext}>Starting fresh</Text>
                </Pressable>

                <Pressable
                  style={[styles.modeOption, mode === 'in-progress' && styles.modeActive]}
                  onPress={() => setMode('in-progress')}
                >
                  <Ionicons
                    name="play-circle"
                    size={16}
                    color={mode === 'in-progress' ? theme.colors.primary : theme.colors.textDim}
                  />
                  <Text
                    style={[
                      styles.modeText,
                      mode === 'in-progress' && styles.modeTextActive,
                    ]}
                  >
                    In Progress
                  </Text>
                  <Text style={styles.modeSubtext}>Already trading</Text>
                </Pressable>
              </View>

              {/* ── Core fields ────────────────────── */}
              <FormField
                label="Account Name"
                placeholder="e.g. Alpha Futures 150K"
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                focused={focusedField === 'name'}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />

              <FormField
                label="Starting Balance ($)"
                placeholder="e.g. 150000"
                value={form.startingBalance}
                onChangeText={(v) => updateField('startingBalance', v)}
                keyboard="numeric"
                focused={focusedField === 'startingBalance'}
                onFocus={() => setFocusedField('startingBalance')}
                onBlur={() => setFocusedField(null)}
              />

              <FormField
                label="Profit Target ($)"
                placeholder="e.g. 9000"
                value={form.profitTarget}
                onChangeText={(v) => updateField('profitTarget', v)}
                keyboard="numeric"
                focused={focusedField === 'profitTarget'}
                onFocus={() => setFocusedField('profitTarget')}
                onBlur={() => setFocusedField(null)}
              />

              <FormField
                label="Max Drawdown ($)"
                placeholder="e.g. 6000"
                value={form.maxDrawdown}
                onChangeText={(v) => updateField('maxDrawdown', v)}
                keyboard="numeric"
                focused={focusedField === 'maxDrawdown'}
                onFocus={() => setFocusedField('maxDrawdown')}
                onBlur={() => setFocusedField(null)}
              />

              <FormField
                label="Daily Loss Limit ($)"
                placeholder="e.g. 2000"
                value={form.dailyLossLimit}
                onChangeText={(v) => updateField('dailyLossLimit', v)}
                keyboard="numeric"
                optional
                focused={focusedField === 'dailyLossLimit'}
                onFocus={() => setFocusedField('dailyLossLimit')}
                onBlur={() => setFocusedField(null)}
              />

              <FormField
                label="Consistency Rule (%)"
                placeholder="e.g. 50"
                value={form.consistencyPercent}
                onChangeText={(v) => updateField('consistencyPercent', v)}
                keyboard="numeric"
                optional
                focused={focusedField === 'consistencyPercent'}
                onFocus={() => setFocusedField('consistencyPercent')}
                onBlur={() => setFocusedField(null)}
              />

              <FormField
                label="Risk Per Trade ($)"
                placeholder="e.g. 500"
                value={form.riskPerTrade}
                onChangeText={(v) => updateField('riskPerTrade', v)}
                keyboard="numeric"
                focused={focusedField === 'riskPerTrade'}
                onFocus={() => setFocusedField('riskPerTrade')}
                onBlur={() => setFocusedField(null)}
              />

              {/* ── In-progress fields ─────────────── */}
              {mode === 'in-progress' && (
                <>
                  <View style={styles.inProgressDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>Current State</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <FormField
                    label="Current Balance ($)"
                    placeholder="e.g. 152300"
                    value={form.currentBalance}
                    onChangeText={(v) => updateField('currentBalance', v)}
                    keyboard="numeric"
                    focused={focusedField === 'currentBalance'}
                    onFocus={() => setFocusedField('currentBalance')}
                    onBlur={() => setFocusedField(null)}
                    hint="Your account balance right now"
                  />

                  <FormField
                    label="Trailing Drawdown Level ($)"
                    placeholder="e.g. 146000"
                    value={form.currentDrawdownLevel}
                    onChangeText={(v) => updateField('currentDrawdownLevel', v)}
                    keyboard="numeric"
                    focused={focusedField === 'currentDrawdownLevel'}
                    onFocus={() => setFocusedField('currentDrawdownLevel')}
                    onBlur={() => setFocusedField(null)}
                    hint="The level your balance cannot drop below"
                  />
                </>
              )}

              {/* ── Preview card ───────────────────── */}
              {isValid && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>Preview</Text>
                  <View style={styles.previewCard}>
                    {mode === 'in-progress' && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Current profit</Text>
                        <Text
                          style={[
                            styles.previewValue,
                            {
                              color:
                                previewProfit >= 0
                                  ? theme.colors.profit
                                  : theme.colors.loss,
                            },
                          ]}
                        >
                          {previewProfit >= 0 ? '+' : ''}${previewProfit.toLocaleString()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>1R (1% of balance)</Text>
                      <Text style={styles.previewValue}>
                        ${oneRPreview.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>R to funded</Text>
                      <Text style={styles.previewValue}>
                        {rToFunded > 0 ? `${rToFunded.toFixed(1)}R` : 'Target reached'}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Max loss trades</Text>
                      <Text style={styles.previewValue}>
                        {Math.floor(Number(form.maxDrawdown) / Number(form.riskPerTrade))}
                      </Text>
                    </View>
                    {mode === 'in-progress' && Number(form.currentDrawdownLevel) > 0 && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Cushion to drawdown</Text>
                        <Text style={styles.previewValue}>
                          ${(Number(form.currentBalance) - Number(form.currentDrawdownLevel)).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Reusable form field ───────────────────────────
function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboard = 'default',
  optional = false,
  focused = false,
  onFocus,
  onBlur,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboard?: 'default' | 'numeric';
  optional?: boolean;
  focused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional && <Text style={styles.optionalTag}>Optional</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, focused && styles.inputFocused]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textDim}
        keyboardType={keyboard}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {hint && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryGlow,
    borderWidth: 1,
    borderColor: theme.colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groupTitle: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.textSecondary,
    ...typography.sectionTitle,
  },
  emptyBody: {
    color: theme.colors.textDim,
    ...typography.body,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },

  // ── Modal ────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCancel: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  modalTitle: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  modalSave: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },

  // ── Mode toggle ──────────────────────────────
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  modeOption: {
    flex: 1,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 4,
  },
  modeActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryGlow,
  },
  modeText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  modeTextActive: {
    color: theme.colors.primary,
  },
  modeSubtext: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontWeight: '400',
  },

  // ── In-progress divider ──────────────────────
  inProgressDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
  },

  // ── Form fields ──────────────────────────────
  fieldWrap: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
  },
  optionalTag: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: theme.colors.cardAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.cardHighlight,
  },
  hintText: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontWeight: '400',
    marginTop: 6,
    paddingLeft: 2,
  },

  // ── Preview ──────────────────────────────────
  previewSection: {
    marginTop: 8,
  },
  previewTitle: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: theme.spacing.sm,
  },
  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderFocus,
    padding: theme.spacing.md,
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    color: theme.colors.textMuted,
    ...typography.body,
  },
  previewValue: {
    color: theme.colors.primary,
    ...typography.mono,
    fontWeight: '700',
  },
});