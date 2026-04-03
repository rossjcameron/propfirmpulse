import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
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
import type { PropFirm, PropFirmAccountType, PropFirmSize } from '../../src/data/propFirms';
import { firmLogos, propFirms } from '../../src/data/propFirms';

// ─── Types ─────────────────────────────────────────
type AccountMode = 'new' | 'in-progress';
type EntryMethod = 'firm' | 'manual';

type FormData = {
  name: string;
  startingBalance: string;
  profitTarget: string;
  maxDrawdown: string;
  dailyLossLimit: string;
  consistencyPercent: string;
  riskPerTrade: string;
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

// ─── Helpers ───────────────────────────────────────
function numOrEmpty(val: number | string): string {
  if (typeof val === 'number') return val.toString();
  return '';
}

function applyFirmSize(size: PropFirmSize, firmName: string, typeName: string): FormData {
  return {
    name: `${firmName} ${size.label}`,
    startingBalance: numOrEmpty(size.startingBalance),
    profitTarget: numOrEmpty(size.profitTarget),
    maxDrawdown: numOrEmpty(size.maxDrawdown),
    dailyLossLimit: size.dailyLossLimit === 'none' || size.dailyLossLimit === 'unspecified' ? '' : size.dailyLossLimit.toString(),
    consistencyPercent: size.consistencyPercent === 'none' || size.consistencyPercent === 'unspecified' ? '' : size.consistencyPercent.toString(),
    riskPerTrade: numOrEmpty(size.riskPerTrade),
    currentBalance: '',
    currentDrawdownLevel: '',
  };
}

// ─── Main Component ────────────────────────────────
export default function AccountsScreen() {
  const { accounts, addAccount } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<AccountMode>('new');
  const [entryMethod, setEntryMethod] = useState<EntryMethod>('firm');
  const [form, setForm] = useState<FormData>(emptyForm);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Firm selection state
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  const selectedFirm = useMemo(
    () => propFirms.find((f) => f.id === selectedFirmId) ?? null,
    [selectedFirmId]
  );
  const selectedType = useMemo(
    () => selectedFirm?.accountTypes.find((t) => t.id === selectedTypeId) ?? null,
    [selectedFirm, selectedTypeId]
  );
  const selectedSize = useMemo(
    () => selectedType?.sizes.find((s) => s.id === selectedSizeId) ?? null,
    [selectedType, selectedSizeId]
  );

  const funded = accounts.filter((a) => a.status === 'Funded');
  const evaluation = accounts.filter((a) => a.status === 'Evaluation');
  const failed = accounts.filter((a) => a.status === 'Failed');

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openForm = () => {
    setForm(emptyForm);
    setMode('new');
    setEntryMethod('firm');
    setSelectedFirmId(null);
    setSelectedTypeId(null);
    setSelectedSizeId(null);
    setShowForm(true);
  };

  // ── Firm selection handlers ───────────────────
  const handleSelectFirm = (firm: PropFirm) => {
    setSelectedFirmId(firm.id);
    setSelectedTypeId(null);
    setSelectedSizeId(null);
    setForm(emptyForm);
  };

  const handleSelectType = (type: PropFirmAccountType) => {
    setSelectedTypeId(type.id);
    setSelectedSizeId(null);
    setForm(emptyForm);
  };

  const handleSelectSize = (size: PropFirmSize) => {
    setSelectedSizeId(size.id);
    if (selectedFirm && selectedType) {
      setForm(applyFirmSize(size, selectedFirm.name, selectedType.name));
    }
  };

  // ── Validation ────────────────────────────────
  const baseValid =
    form.name.trim() !== '' &&
    Number(form.startingBalance) > 0 &&
    Number(form.maxDrawdown) > 0 &&
    Number(form.riskPerTrade) > 0;

  // Profit target not required for funded accounts (may be "unspecified")
  const profitTargetValid = Number(form.profitTarget) > 0 || form.profitTarget === '';

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
    const profitTarget = Number(form.profitTarget) || 0;

    if (mode === 'new') {
      addAccount({
        name: form.name.trim(),
        balance: startingBalance,
        startingBalance,
        profitTarget,
        maxDrawdown,
        trailingDrawdown: startingBalance - maxDrawdown,
        dailyLossLimit: form.dailyLossLimit ? Number(form.dailyLossLimit) : undefined,
        consistencyPercent: form.consistencyPercent ? Number(form.consistencyPercent) : undefined,
        status: profitTarget > 0 ? 'Evaluation' : 'Funded',
        ruleHealth: 'green',
        riskPerTrade: Number(form.riskPerTrade),
        currentProfit: 0,
      });
    } else {
      const currentBalance = Number(form.currentBalance);
      const currentProfit = currentBalance - startingBalance;
      const currentDrawdownLevel = Number(form.currentDrawdownLevel);
      const trailingDrawdown = currentDrawdownLevel;
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

      let status: 'Evaluation' | 'Funded' | 'Failed' = profitTarget > 0 ? 'Evaluation' : 'Funded';
      if (currentBalance <= trailingDrawdown) {
        status = 'Failed';
        ruleHealth = 'red';
        ruleHealthReason = 'Drawdown limit breached';
      } else if (profitTarget > 0 && currentProfit >= profitTarget) {
        status = 'Funded';
      }

      addAccount({
        name: form.name.trim(),
        balance: currentBalance,
        startingBalance,
        profitTarget,
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

  // ── Preview ───────────────────────────────────
  const previewBalance =
    mode === 'in-progress' && Number(form.currentBalance) > 0
      ? Number(form.currentBalance)
      : Number(form.startingBalance);
  const previewProfit = previewBalance - Number(form.startingBalance);
  const oneRPreview = Number(form.startingBalance) * 0.01;
  const profitTargetNum = Number(form.profitTarget) || 0;
  const rToFunded =
    oneRPreview > 0 && profitTargetNum > 0
      ? (profitTargetNum - Math.max(previewProfit, 0)) / oneRPreview
      : null;

  // ── Check which form fields need manual input ─
  const needsManualRisk = form.riskPerTrade === '' && entryMethod === 'firm' && selectedSize;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={globalStyles.title}>Accounts</Text>
          <Pressable style={styles.addButton} onPress={openForm}>
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>

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

        {funded.length > 0 && (
          <>
            <Text style={styles.groupTitle}>Funded</Text>
            {funded.map((a) => <AccountCard key={a.id} account={a} />)}
          </>
        )}
        {evaluation.length > 0 && (
          <>
            <Text style={styles.groupTitle}>In Evaluation</Text>
            {evaluation.map((a) => <AccountCard key={a.id} account={a} />)}
          </>
        )}
        {failed.length > 0 && (
          <>
            <Text style={styles.groupTitle}>Failed</Text>
            {failed.map((a) => <AccountCard key={a.id} account={a} />)}
          </>
        )}

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

      {/* ════════════════════════════════════════════ */}
      {/* ── ADD ACCOUNT MODAL ══════════════════════ */}
      {/* ════════════════════════════════════════════ */}
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
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowForm(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>New Account</Text>
              <Pressable onPress={handleSubmit} disabled={!isValid}>
                <Text style={[styles.modalSave, { opacity: isValid ? 1 : 0.3 }]}>
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
              {/* ── New vs In Progress ──────────────── */}
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Account Status</Text>
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeOption, mode === 'new' && styles.modeActive]}
                  onPress={() => {
                    setMode('new');
                    setSelectedTypeId(null);
                    setSelectedSizeId(null);
                    setForm(emptyForm);
                  }}
                >
                  <Ionicons name="sparkles" size={16} color={mode === 'new' ? theme.colors.primary : theme.colors.textDim} />
                  <Text style={[styles.modeText, mode === 'new' && styles.modeTextActive]}>Brand New</Text>
                  <Text style={styles.modeSubtext}>Fresh evaluation</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeOption, mode === 'in-progress' && styles.modeActive]}
                  onPress={() => {
                    setMode('in-progress');
                    setSelectedTypeId(null);
                    setSelectedSizeId(null);
                    setForm(emptyForm);
                  }}
                >
                  <Ionicons name="play-circle" size={16} color={mode === 'in-progress' ? theme.colors.primary : theme.colors.textDim} />
                  <Text style={[styles.modeText, mode === 'in-progress' && styles.modeTextActive]}>In Progress</Text>
                  <Text style={styles.modeSubtext}>Already trading</Text>
                </Pressable>
              </View>

              {/* ── Entry method toggle ─────────────── */}
              <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Setup Method</Text>
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeOption, entryMethod === 'firm' && styles.modeActive]}
                  onPress={() => setEntryMethod('firm')}
                >
                  <Ionicons name="business" size={16} color={entryMethod === 'firm' ? theme.colors.primary : theme.colors.textDim} />
                  <Text style={[styles.modeText, entryMethod === 'firm' && styles.modeTextActive]}>Select Firm</Text>
                  <Text style={styles.modeSubtext}>Auto-fill rules</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeOption, entryMethod === 'manual' && styles.modeActive]}
                  onPress={() => {
                    setEntryMethod('manual');
                    setSelectedFirmId(null);
                    setSelectedTypeId(null);
                    setSelectedSizeId(null);
                  }}
                >
                  <Ionicons name="create" size={16} color={entryMethod === 'manual' ? theme.colors.primary : theme.colors.textDim} />
                  <Text style={[styles.modeText, entryMethod === 'manual' && styles.modeTextActive]}>Manual</Text>
                  <Text style={styles.modeSubtext}>Enter rules yourself</Text>
                </Pressable>
              </View>

              {/* ── Prop Firm Carousel ──────────────── */}
              {entryMethod === 'firm' && (
                <>
                  <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Prop Firm</Text>
                  <FlatList
                    data={propFirms}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.firmCarousel}
                    renderItem={({ item }) => {
                      const active = selectedFirmId === item.id;
                      const logo = firmLogos[item.id];
                      return (
                        <Pressable
                          style={[styles.firmTile, active && styles.firmTileActive]}
                          onPress={() => handleSelectFirm(item)}
                        >
                          {logo && (
                            <Image
                              source={logo}
                              style={styles.firmLogo}
                              resizeMode="contain"
                            />
                          )}
                          {active && <View style={styles.firmTileGlow} />}
                        </Pressable>
                      );
                    }}
                  />

                  {/* Firm name label */}
                  {selectedFirm && (
                    <Text style={styles.firmNameLabel}>{selectedFirm.name}</Text>
                  )}

                  {/* Account type selector — filtered by mode */}
                  {selectedFirm && (
                    <>
                      <Text style={[styles.fieldLabel, { marginBottom: 8, marginTop: 14 }]}>Account Type</Text>
                      <View style={styles.chipWrap}>
                        {selectedFirm.accountTypes
                          .filter((type) => {
                            if (mode !== 'new') return true;
                            // Brand new = evaluation only
                            // An evaluation type has at least one size with a numeric profitTarget
                            return type.sizes.some(
                              (s) => typeof s.profitTarget === 'number' && s.profitTarget > 0
                            );
                          })
                          .map((type) => {
                            const active = selectedTypeId === type.id;
                            return (
                              <Pressable
                                key={type.id}
                                style={[styles.typeChip, active && styles.typeChipActive]}
                                onPress={() => handleSelectType(type)}
                              >
                                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                                  {type.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                      </View>
                    </>
                  )}

                  {/* Size selector */}
                  {selectedType && (
                    <>
                      <Text style={[styles.fieldLabel, { marginBottom: 8, marginTop: 18 }]}>Account Size</Text>
                      <View style={styles.sizeRow}>
                        {selectedType.sizes
                          .filter((s) => typeof s.startingBalance === 'number')
                          .map((size) => {
                            const active = selectedSizeId === size.id;
                            return (
                              <Pressable
                                key={size.id}
                                style={[styles.sizeChip, active && styles.sizeChipActive]}
                                onPress={() => handleSelectSize(size)}
                              >
                                <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                                  {size.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                      </View>
                    </>
                  )}

                  {/* Auto-filled rules summary */}
                  {selectedSize && (
                    <View style={styles.rulesCard}>
                      <Text style={styles.rulesTitle}>Loaded Rules</Text>
                      <RuleRow label="Starting Balance" value={form.startingBalance ? `$${Number(form.startingBalance).toLocaleString()}` : '—'} />
                      <RuleRow label="Profit Target" value={form.profitTarget ? `$${Number(form.profitTarget).toLocaleString()}` : 'N/A (funded)'} />
                      <RuleRow label="Max Drawdown" value={form.maxDrawdown ? `$${Number(form.maxDrawdown).toLocaleString()}` : '—'} />
                      <RuleRow label="Daily Loss Limit" value={form.dailyLossLimit ? `$${Number(form.dailyLossLimit).toLocaleString()}` : 'None'} />
                      <RuleRow label="Consistency" value={form.consistencyPercent ? `${form.consistencyPercent}%` : 'None'} />
                      <RuleRow label="Max Contracts" value={form.riskPerTrade || 'Not specified'} />
                    </View>
                  )}

                  {/* Risk per trade if unspecified by firm */}
                  {needsManualRisk && (
                    <FormField
                      label="Risk Per Trade ($)"
                      placeholder="Enter your risk per trade"
                      value={form.riskPerTrade}
                      onChangeText={(v) => updateField('riskPerTrade', v)}
                      keyboard="numeric"
                      focused={focusedField === 'riskPerTrade'}
                      onFocus={() => setFocusedField('riskPerTrade')}
                      onBlur={() => setFocusedField(null)}
                      hint="This firm doesn't specify a risk limit — enter your own"
                    />
                  )}
                </>
              )}

              {/* ── Manual entry fields ─────────────── */}
              {entryMethod === 'manual' && (
                <>
                  <FormField label="Account Name" placeholder="e.g. Alpha Futures 150K" value={form.name} onChangeText={(v) => updateField('name', v)} focused={focusedField === 'name'} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} />
                  <FormField label="Starting Balance ($)" placeholder="e.g. 150000" value={form.startingBalance} onChangeText={(v) => updateField('startingBalance', v)} keyboard="numeric" focused={focusedField === 'startingBalance'} onFocus={() => setFocusedField('startingBalance')} onBlur={() => setFocusedField(null)} />
                  <FormField label="Profit Target ($)" placeholder="e.g. 9000" value={form.profitTarget} onChangeText={(v) => updateField('profitTarget', v)} keyboard="numeric" focused={focusedField === 'profitTarget'} onFocus={() => setFocusedField('profitTarget')} onBlur={() => setFocusedField(null)} />
                  <FormField label="Max Drawdown ($)" placeholder="e.g. 6000" value={form.maxDrawdown} onChangeText={(v) => updateField('maxDrawdown', v)} keyboard="numeric" focused={focusedField === 'maxDrawdown'} onFocus={() => setFocusedField('maxDrawdown')} onBlur={() => setFocusedField(null)} />
                  <FormField label="Daily Loss Limit ($)" placeholder="e.g. 2000" value={form.dailyLossLimit} onChangeText={(v) => updateField('dailyLossLimit', v)} keyboard="numeric" optional focused={focusedField === 'dailyLossLimit'} onFocus={() => setFocusedField('dailyLossLimit')} onBlur={() => setFocusedField(null)} />
                  <FormField label="Consistency Rule (%)" placeholder="e.g. 50" value={form.consistencyPercent} onChangeText={(v) => updateField('consistencyPercent', v)} keyboard="numeric" optional focused={focusedField === 'consistencyPercent'} onFocus={() => setFocusedField('consistencyPercent')} onBlur={() => setFocusedField(null)} />
                  <FormField label="Risk Per Trade ($)" placeholder="e.g. 500" value={form.riskPerTrade} onChangeText={(v) => updateField('riskPerTrade', v)} keyboard="numeric" focused={focusedField === 'riskPerTrade'} onFocus={() => setFocusedField('riskPerTrade')} onBlur={() => setFocusedField(null)} />
                </>
              )}

              {/* ── In-progress fields ─────────────── */}
              {mode === 'in-progress' && (form.startingBalance || entryMethod === 'manual') && (
                <>
                  <View style={styles.inProgressDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>Current State</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <FormField label="Current Balance ($)" placeholder="e.g. 152300" value={form.currentBalance} onChangeText={(v) => updateField('currentBalance', v)} keyboard="numeric" focused={focusedField === 'currentBalance'} onFocus={() => setFocusedField('currentBalance')} onBlur={() => setFocusedField(null)} hint="Your account balance right now" />
                  <FormField label="Trailing Drawdown Level ($)" placeholder="e.g. 146000" value={form.currentDrawdownLevel} onChangeText={(v) => updateField('currentDrawdownLevel', v)} keyboard="numeric" focused={focusedField === 'currentDrawdownLevel'} onFocus={() => setFocusedField('currentDrawdownLevel')} onBlur={() => setFocusedField(null)} hint="The level your balance cannot drop below" />
                </>
              )}

              {/* ── Preview ────────────────────────── */}
              {isValid && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>Preview</Text>
                  <View style={styles.previewCard}>
                    {mode === 'in-progress' && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Current profit</Text>
                        <Text style={[styles.previewValue, { color: previewProfit >= 0 ? theme.colors.profit : theme.colors.loss }]}>
                          {previewProfit >= 0 ? '+' : ''}${previewProfit.toLocaleString()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>1R (1% of balance)</Text>
                      <Text style={styles.previewValue}>${oneRPreview.toLocaleString()}</Text>
                    </View>
                    {rToFunded != null && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>R to funded</Text>
                        <Text style={styles.previewValue}>
                          {rToFunded > 0 ? `${rToFunded.toFixed(1)}R` : 'Target reached'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>Max loss trades</Text>
                      <Text style={styles.previewValue}>
                        {oneRPreview > 0 ? Math.floor(Number(form.maxDrawdown) / oneRPreview) : '—'}
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

// ─── Sub-components ────────────────────────────────

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleLabel}>{label}</Text>
      <Text style={styles.ruleValue}>{value}</Text>
    </View>
  );
}

function FormField({
  label, placeholder, value, onChangeText, keyboard = 'default',
  optional = false, focused = false, onFocus, onBlur, hint,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; keyboard?: 'default' | 'numeric';
  optional?: boolean; focused?: boolean; onFocus?: () => void;
  onBlur?: () => void; hint?: string;
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  addButton: { width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primaryGlow, borderWidth: 1, borderColor: theme.colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg },
  summaryPill: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  summaryText: { fontSize: 12, fontWeight: '700' },
  groupTitle: { color: theme.colors.textMuted, ...typography.label, marginBottom: theme.spacing.sm, marginTop: theme.spacing.xs },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { color: theme.colors.textSecondary, ...typography.sectionTitle },
  emptyBody: { color: theme.colors.textDim, ...typography.body, textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  modalContainer: { flex: 1, backgroundColor: theme.colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalCancel: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' },
  modalTitle: { color: theme.colors.text, ...typography.cardTitle },
  modalSave: { color: theme.colors.primary, fontSize: 15, fontWeight: '700' },
  modalScroll: { flex: 1 },
  modalContent: { padding: theme.spacing.md, paddingBottom: 60 },

  // Mode toggle
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  modeOption: { flex: 1, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, gap: 4 },
  modeActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryGlow },
  modeText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '700' },
  modeTextActive: { color: theme.colors.primary },
  modeSubtext: { color: theme.colors.textDim, fontSize: 11, fontWeight: '400' },

  // Firm carousel — square logo tiles
  firmCarousel: {
    gap: 12,
    paddingBottom: 4,
  },
  firmTile: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  firmTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.cardHighlight,
    ...theme.shadows.cardHover,
  },
  firmLogo: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  firmTileGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
  },
  firmNameLabel: {
    color: theme.colors.text,
    ...typography.cardTitle,
    marginTop: 12,
    marginBottom: 4,
  },

  // Account type chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 10 },
  typeChipActive: { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondaryDim },
  typeChipText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: theme.colors.secondary, fontWeight: '700' },

  // Size chips
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeChip: { flex: 1, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingVertical: 12, alignItems: 'center' },
  sizeChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryGlow },
  sizeChipText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '700' },
  sizeChipTextActive: { color: theme.colors.primary },

  // Rules summary card
  rulesCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginTop: 18, ...theme.shadows.card },
  rulesTitle: { color: theme.colors.text, ...typography.cardTitle, marginBottom: 10 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  ruleLabel: { color: theme.colors.textMuted, ...typography.body },
  ruleValue: { color: theme.colors.text, ...typography.mono, fontSize: 13 },

  // In-progress divider
  inProgressDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerLabel: { color: theme.colors.textMuted, ...typography.label },

  // Form fields
  fieldWrap: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fieldLabel: { color: theme.colors.textMuted, ...typography.label },
  optionalTag: { color: theme.colors.textDim, fontSize: 10, fontWeight: '500', fontStyle: 'italic' },
  input: { backgroundColor: theme.colors.cardAlt, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.sm, color: theme.colors.text, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '500' },
  inputFocused: { borderColor: theme.colors.primary, backgroundColor: theme.colors.cardHighlight },
  hintText: { color: theme.colors.textDim, fontSize: 11, fontWeight: '400', marginTop: 6, paddingLeft: 2 },

  // Preview
  previewSection: { marginTop: 8 },
  previewTitle: { color: theme.colors.textMuted, ...typography.label, marginBottom: theme.spacing.sm },
  previewCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderFocus, padding: theme.spacing.md, gap: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { color: theme.colors.textMuted, ...typography.body },
  previewValue: { color: theme.colors.primary, ...typography.mono, fontWeight: '700' },
});