import { StyleSheet } from 'react-native';
import { theme } from './theme';
import { typography } from './typography';

export const globalStyles = StyleSheet.create({
  // ─── Screens ─────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 60,
  },

  // ─── Typography ──────────────────────────────────
  title: {
    color: theme.colors.text,
    ...typography.title,
  },

  sectionTitle: {
    color: theme.colors.text,
    ...typography.sectionTitle,
  },

  subtitle: {
    color: theme.colors.textMuted,
    ...typography.body,
    lineHeight: 20,
  },

  label: {
    color: theme.colors.textMuted,
    ...typography.label,
  },

  value: {
    color: theme.colors.text,
    ...typography.bodyMedium,
  },

  caption: {
    color: theme.colors.textDim,
    ...typography.caption,
  },

  // ─── Cards ───────────────────────────────────────
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  cardAlt: {
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },

  // A highlighted card with a subtle primary glow
  cardGlow: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderFocus,
    ...theme.shadows.cardHover,
  },

  // ─── Inputs ──────────────────────────────────────
  input: {
    backgroundColor: theme.colors.cardAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as any,
  },

  inputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.cardHighlight,
  },

  // ─── Buttons ─────────────────────────────────────
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...theme.shadows.glow,
  },

  buttonPrimaryText: {
    color: '#050507',
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  buttonSecondaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },

  // ─── Layout helpers ──────────────────────────────
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },

  // ─── Status badges ──────────────────────────────
  badgeEval: {
    backgroundColor: theme.colors.statusEvalBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeEvalText: {
    color: theme.colors.statusEval,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  badgeFunded: {
    backgroundColor: theme.colors.statusFundedBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeFundedText: {
    color: theme.colors.statusFunded,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  badgeFailed: {
    backgroundColor: theme.colors.statusFailedBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeFailedText: {
    color: theme.colors.statusFailed,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // ─── Profit / Loss colouring ─────────────────────
  profit: {
    color: theme.colors.profit,
  },

  loss: {
    color: theme.colors.loss,
  },
});