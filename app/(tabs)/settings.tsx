import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../src/constants/styles';
import { theme } from '../../src/constants/theme';
import { typography } from '../../src/constants/typography';
import { useApp } from '../../src/context/AppContext';
import type { PathStyle } from '../../src/services/ruleEngine';

const PATH_OPTIONS: {
  key: PathStyle;
  label: string;
  description: string;
  icon: string;
  example: string;
}[] = [
  {
    key: 'aggressive',
    label: 'Aggressive',
    description: 'Bigger steps, fewer trades to funded. Higher risk per session.',
    icon: 'flash',
    example: '3R → 3R → 1.3R',
  },
  {
    key: 'normal',
    label: 'Normal',
    description: 'Balanced steps. A steady pace towards the target.',
    icon: 'speedometer',
    example: '2R → 2R → 2R → 1.3R',
  },
  {
    key: 'conservative',
    label: 'Conservative',
    description: 'Smaller steps after an initial push. Lower risk, more sessions.',
    icon: 'shield-checkmark',
    example: '2R → 1R → 1R → 1R → 1R → 1.3R',
  },
];

export default function SettingsScreen() {
  const { pathStyle, setPathStyle, accounts, getRemainingR, getBestPath } = useApp();

  // Find first eval account for a live preview
  const previewAccount = accounts.find(
    (a) => a.status === 'Evaluation' && a.currentProfit < a.profitTarget
  );

  const previewPath = previewAccount ? getBestPath(previewAccount) : null;
  const previewR = previewAccount ? getRemainingR(previewAccount) : null;

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={globalStyles.title}>Settings</Text>
        <Text style={[globalStyles.subtitle, styles.subtitle]}>
          Customise how PropFirmPulse works for you.
        </Text>

        {/* ── Path Style Section ──────────────────── */}
        <Text style={styles.sectionLabel}>Path to Funded Style</Text>
        <Text style={styles.sectionDescription}>
          Choose how your path to funded is broken down into trading sessions.
        </Text>

        <View style={styles.optionsWrap}>
          {PATH_OPTIONS.map((option) => {
            const isActive = pathStyle === option.key;

            return (
              <Pressable
                key={option.key}
                style={[styles.optionCard, isActive && styles.optionCardActive]}
                onPress={() => setPathStyle(option.key)}
              >
                <View style={styles.optionHeader}>
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primaryGlow
                          : theme.colors.cardHighlight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={isActive ? theme.colors.primary : theme.colors.textDim}
                    />
                  </View>

                  <View style={styles.optionInfo}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isActive && { color: theme.colors.primary },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      isActive && styles.radioActive,
                    ]}
                  >
                    {isActive && <View style={styles.radioDot} />}
                  </View>
                </View>

                {/* Example path */}
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleLabel}>e.g. 7.3R →</Text>
                  <Text
                    style={[
                      styles.examplePath,
                      isActive && { color: theme.colors.primary },
                    ]}
                  >
                    {option.example}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Live Preview ────────────────────────── */}
        {previewAccount && previewPath && previewR != null && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>Live Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewName}>{previewAccount.name}</Text>
                <Text style={styles.previewRemaining}>
                  {previewR.toFixed(1)}R remaining
                </Text>
              </View>
              <View style={styles.previewSteps}>
                {previewPath.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <View style={styles.previewStep}>
                      <Text style={styles.previewStepText}>
                        {step % 1 === 0 ? step : step.toFixed(1)}R
                      </Text>
                    </View>
                    {i < previewPath.steps.length - 1 && (
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: theme.spacing.xl,
  },

  // Section
  sectionLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: 6,
  },
  sectionDescription: {
    color: theme.colors.textDim,
    ...typography.body,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },

  // Option cards
  optionsWrap: {
    gap: 10,
    marginBottom: theme.spacing.xl,
  },
  optionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  optionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryGlow,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  optionDescription: {
    color: theme.colors.textDim,
    fontSize: 12,
    lineHeight: 16,
  },

  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },

  // Example
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exampleLabel: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '500',
  },
  examplePath: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  // Live preview
  previewSection: {
    marginBottom: theme.spacing.lg,
  },
  previewCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderFocus,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    ...theme.shadows.cardHover,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewName: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  previewRemaining: {
    color: theme.colors.textMuted,
    ...typography.caption,
    fontWeight: '600',
  },
  previewSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  previewStep: {
    backgroundColor: theme.colors.primaryGlow,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewStepText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});