import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import type { Trade } from '../../src/types';

type EmotionalState = NonNullable<Trade['emotionalState']>;
type Confidence = NonNullable<Trade['confidence']>;

const EMOTION_OPTIONS: EmotionalState[] = [
  'Calm',
  'Focused',
  'Confident',
  'Anxious',
  'FOMO',
  'Revenge',
];

const CONFIDENCE_OPTIONS: Confidence[] = ['A+', 'High', 'Medium', 'Low'];

export default function LogTradeScreen() {
  const { accounts, addTrade } = useApp();

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? '');
  const [strategy, setStrategy] = useState('NY ORB');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [outcome, setOutcome] = useState<'Win' | 'Loss'>('Win');
  const [pnl, setPnl] = useState('');
  const [risk, setRisk] = useState('');
  const [entryTime, setEntryTime] = useState(getCurrentTimeString());
  const [exitTime, setExitTime] = useState(getCurrentTimeString());
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('Focused');
  const [confidence, setConfidence] = useState<Confidence>('Medium');
  const [notes, setNotes] = useState('');
  const [lessons, setLessons] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId),
    [accounts, selectedAccountId]
  );

  const pickScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to attach a screenshot.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const removeScreenshot = () => {
    setScreenshotUri(null);
  };

  const submitTrade = () => {
    const rawPnl = Number(pnl);
    const riskNumber = Number(risk);

    if (
      !selectedAccountId ||
      !strategy.trim() ||
      Number.isNaN(rawPnl) ||
      Number.isNaN(riskNumber) ||
      riskNumber <= 0
    ) {
      Alert.alert('Missing info', 'Please complete the required fields.');
      return;
    }

    if (!isValidTime(entryTime) || !isValidTime(exitTime)) {
      Alert.alert('Invalid time', 'Use HH:MM format for entry and exit time.');
      return;
    }

    const entryIso = buildTodayIso(entryTime);
    const exitIso = buildTodayIso(exitTime);

    if (new Date(exitIso).getTime() < new Date(entryIso).getTime()) {
      Alert.alert('Invalid duration', 'Exit time must be after entry time.');
      return;
    }

    const normalisedPnl =
      outcome === 'Win' ? Math.abs(rawPnl) : -Math.abs(rawPnl);

    addTrade({
      accountIds: [selectedAccountId],
      strategy: strategy.trim(),
      direction,
      outcome,
      entryTime: entryIso,
      exitTime: exitIso,
      pnl: normalisedPnl,
      r: normalisedPnl / riskNumber,
      screenshotUrl: screenshotUri ?? undefined,
      emotionalState,
      confidence,
      notes: notes.trim() || undefined,
      lessons: lessons.trim() || undefined,
    });

    setStrategy('NY ORB');
    setDirection('Long');
    setOutcome('Win');
    setPnl('');
    setRisk('');
    setEntryTime(getCurrentTimeString());
    setExitTime(getCurrentTimeString());
    setEmotionalState('Focused');
    setConfidence('Medium');
    setNotes('');
    setLessons('');
    setScreenshotUri(null);

    Alert.alert('Saved', 'Trade journal entry added.');
  };

  const signedPreviewPnl =
    pnl.trim() !== '' && !Number.isNaN(Number(pnl))
      ? outcome === 'Win'
        ? Math.abs(Number(pnl))
        : -Math.abs(Number(pnl))
      : null;

  const rValue =
    signedPreviewPnl != null && risk && Number(risk) > 0
      ? signedPreviewPnl / Number(risk)
      : null;

  const durationPreview =
    isValidTime(entryTime) && isValidTime(exitTime)
      ? getDurationLabel(buildTodayIso(entryTime), buildTodayIso(exitTime))
      : '—';

  if (accounts.length === 0) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['top']}>
        <ScrollView
          style={globalStyles.screen}
          contentContainerStyle={globalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[globalStyles.title, styles.title]}>Log Trade</Text>

          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={38} color={theme.colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>Add an account first</Text>
            <Text style={styles.emptyBody}>
              You need at least one account before you can journal a trade.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[globalStyles.title, styles.title]}>Log Trade</Text>

        <Text style={[globalStyles.label, styles.fieldLabel]}>Account</Text>
        <View style={styles.chipWrap}>
          {accounts.map((account) => {
            const active = selectedAccountId === account.id;
            return (
              <Pressable
                key={account.id}
                onPress={() => setSelectedAccountId(account.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {account.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedAccount && (
          <View style={styles.selectedAccountCard}>
            <Text style={styles.selectedAccountName}>{selectedAccount.name}</Text>
            <Text style={styles.selectedAccountMeta}>
              Balance ${selectedAccount.balance.toLocaleString()} · Profit{' '}
              {selectedAccount.currentProfit >= 0 ? '+' : '-'}$
              {Math.abs(selectedAccount.currentProfit).toLocaleString()}
            </Text>
          </View>
        )}

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

        <Text style={[globalStyles.label, styles.fieldLabel]}>Outcome</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggle, outcome === 'Win' && styles.toggleLongActive]}
            onPress={() => setOutcome('Win')}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={outcome === 'Win' ? theme.colors.profit : theme.colors.textDim}
            />
            <Text
              style={[
                styles.toggleText,
                outcome === 'Win' && { color: theme.colors.profit },
              ]}
            >
              Win
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggle, outcome === 'Loss' && styles.toggleShortActive]}
            onPress={() => setOutcome('Loss')}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={outcome === 'Loss' ? theme.colors.loss : theme.colors.textDim}
            />
            <Text
              style={[
                styles.toggleText,
                outcome === 'Loss' && { color: theme.colors.loss },
              ]}
            >
              Loss
            </Text>
          </Pressable>
        </View>

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

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={[globalStyles.label, styles.fieldLabel]}>P&amp;L Amount ($)</Text>
            <TextInput
              value={pnl}
              onChangeText={setPnl}
              style={[
                globalStyles.input,
                focusedField === 'pnl' && globalStyles.inputFocused,
              ]}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textDim}
              onFocus={() => setFocusedField('pnl')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={[globalStyles.label, styles.fieldLabel]}>Risk ($)</Text>
            <TextInput
              value={risk}
              onChangeText={setRisk}
              style={[
                globalStyles.input,
                focusedField === 'risk' && globalStyles.inputFocused,
              ]}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.colors.textDim}
              onFocus={() => setFocusedField('risk')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={[globalStyles.label, styles.fieldLabel]}>Entry Time</Text>
            <TextInput
              value={entryTime}
              onChangeText={setEntryTime}
              style={[
                globalStyles.input,
                focusedField === 'entryTime' && globalStyles.inputFocused,
              ]}
              placeholder="HH:MM"
              placeholderTextColor={theme.colors.textDim}
              onFocus={() => setFocusedField('entryTime')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={[globalStyles.label, styles.fieldLabel]}>Exit Time</Text>
            <TextInput
              value={exitTime}
              onChangeText={setExitTime}
              style={[
                globalStyles.input,
                focusedField === 'exitTime' && globalStyles.inputFocused,
              ]}
              placeholder="HH:MM"
              placeholderTextColor={theme.colors.textDim}
              onFocus={() => setFocusedField('exitTime')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        <View style={styles.infoStrip}>
          <Text style={styles.infoStripLabel}>Duration</Text>
          <Text style={styles.infoStripValue}>{durationPreview}</Text>
        </View>

        <Text style={[globalStyles.label, styles.fieldLabel]}>Emotional State</Text>
        <View style={styles.chipWrap}>
          {EMOTION_OPTIONS.map((option) => {
            const active = emotionalState === option;
            return (
              <Pressable
                key={option}
                onPress={() => setEmotionalState(option)}
                style={[styles.quickChip, active && styles.quickChipActive]}
              >
                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[globalStyles.label, styles.fieldLabel]}>Confidence</Text>
        <View style={styles.chipWrap}>
          {CONFIDENCE_OPTIONS.map((option) => {
            const active = confidence === option;
            return (
              <Pressable
                key={option}
                onPress={() => setConfidence(option)}
                style={[styles.quickChip, active && styles.quickChipActive]}
              >
                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {rValue != null && signedPreviewPnl != null && (
          <View style={styles.rPreview}>
            <View>
              <Text style={styles.rPreviewLabel}>Trade result</Text>
              <Text
                style={[
                  styles.rPreviewPnl,
                  {
                    color:
                      signedPreviewPnl >= 0 ? theme.colors.profit : theme.colors.loss,
                  },
                ]}
              >
                {signedPreviewPnl >= 0 ? '+' : '-'}$
                {Math.abs(signedPreviewPnl).toLocaleString()}
              </Text>
            </View>

            <View style={styles.rPreviewRight}>
              <Text style={styles.rPreviewLabel}>Trade R</Text>
              <Text
                style={[
                  styles.rPreviewValue,
                  { color: rValue >= 0 ? theme.colors.profit : theme.colors.loss },
                ]}
              >
                {rValue >= 0 ? '+' : ''}
                {rValue.toFixed(2)}R
              </Text>
            </View>
          </View>
        )}

        <Text style={[globalStyles.label, styles.fieldLabel]}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.textArea, focusedField === 'notes' && globalStyles.inputFocused]}
          placeholder="What did you see? Why did you take it?"
          placeholderTextColor={theme.colors.textDim}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocusedField('notes')}
          onBlur={() => setFocusedField(null)}
        />

        <Text style={[globalStyles.label, styles.fieldLabel]}>Lessons</Text>
        <TextInput
          value={lessons}
          onChangeText={setLessons}
          style={[
            styles.textArea,
            focusedField === 'lessons' && globalStyles.inputFocused,
          ]}
          placeholder="What would you repeat or change next time?"
          placeholderTextColor={theme.colors.textDim}
          multiline
          textAlignVertical="top"
          onFocus={() => setFocusedField('lessons')}
          onBlur={() => setFocusedField(null)}
        />

        <Text style={[globalStyles.label, styles.fieldLabel]}>Screenshot</Text>
        {screenshotUri ? (
          <View style={styles.screenshotCard}>
            <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} />
            <View style={styles.screenshotActions}>
              <Pressable style={styles.secondaryButton} onPress={pickScreenshot}>
                <Text style={styles.secondaryButtonText}>Replace</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={removeScreenshot}>
                <Text style={styles.secondaryButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.uploadCard} onPress={pickScreenshot}>
            <Ionicons name="image-outline" size={20} color={theme.colors.textMuted} />
            <Text style={styles.uploadTitle}>Add screenshot</Text>
            <Text style={styles.uploadBody}>
              Optional. Attach a chart or execution screenshot without forcing a crop.
            </Text>
          </Pressable>
        )}

        <Pressable onPress={submitTrade} style={[globalStyles.buttonPrimary, styles.button]}>
          <Ionicons name="checkmark-circle" size={18} color="#050507" />
          <Text style={globalStyles.buttonPrimaryText}>Save Trade</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getCurrentTimeString() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function buildTodayIso(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function getDurationLabel(entryIso: string, exitIso: string) {
  const diffMs = new Date(exitIso).getTime() - new Date(entryIso).getTime();

  if (diffMs <= 0) return '0m';

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const styles = StyleSheet.create({
  title: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 18,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
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

  selectedAccountCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: 12,
  },
  selectedAccountName: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  selectedAccountMeta: {
    color: theme.colors.textDim,
    ...typography.caption,
    marginTop: 4,
  },

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

  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },

  quickChip: {
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickChipActive: {
    backgroundColor: theme.colors.primaryGlow,
    borderColor: theme.colors.primary,
  },
  quickChipText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },

  infoStrip: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoStripLabel: {
    color: theme.colors.textMuted,
    ...typography.bodyMedium,
  },
  infoStripValue: {
    color: theme.colors.text,
    ...typography.mono,
  },

  rPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rPreviewLabel: {
    color: theme.colors.textMuted,
    ...typography.bodyMedium,
    marginBottom: 4,
  },
  rPreviewPnl: {
    ...typography.mono,
    fontSize: 16,
    fontWeight: '700',
  },
  rPreviewRight: {
    alignItems: 'flex-end',
  },
  rPreviewValue: {
    ...typography.monoLarge,
  },

  textArea: {
    backgroundColor: theme.colors.cardAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 108,
  },

  uploadCard: {
    marginTop: 4,
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  uploadTitle: {
    color: theme.colors.text,
    ...typography.cardTitle,
    marginTop: 10,
  },
  uploadBody: {
    color: theme.colors.textDim,
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },

  screenshotCard: {
    marginTop: 4,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  screenshotImage: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.cardAlt,
  },
  screenshotActions: {
    flexDirection: 'row',
    gap: 10,
    padding: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  button: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    gap: 8,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: theme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: theme.colors.text,
    ...typography.sectionTitle,
  },
  emptyBody: {
    color: theme.colors.textDim,
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});