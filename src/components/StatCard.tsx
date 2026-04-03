import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { typography } from '../constants/typography';

// ─── Types ─────────────────────────────────────────
type TrendDirection = 'up' | 'down' | 'flat';

interface StatCardProps {
  /** Small uppercase label above the value */
  label: string;
  /** The main stat value (pre-formatted string) */
  value: string;
  /** Optional colour override for the value text */
  valueColour?: string;
  /** Optional trend arrow shown next to the value */
  trend?: TrendDirection;
  /** Optional change text below the value, e.g. "+$240 today" */
  change?: string;
  /** Colour for the change text (defaults to profit/loss based on trend) */
  changeColour?: string;
  /** Optional icon name (Ionicons) shown in the top-right corner */
  icon?: string;
  /** Optional icon colour */
  iconColour?: string;
  /** If true, renders the card with a subtle primary glow border */
  glow?: boolean;
  /** If true, uses a compact single-line layout */
  compact?: boolean;
}

// ─── Component ─────────────────────────────────────
export default function StatCard({
  label,
  value,
  valueColour,
  trend,
  change,
  changeColour,
  icon,
  iconColour,
  glow = false,
  compact = false,
}: StatCardProps) {
  const trendIcon =
    trend === 'up'
      ? 'trending-up'
      : trend === 'down'
      ? 'trending-down'
      : trend === 'flat'
      ? 'remove'
      : null;

  const trendColour =
    trend === 'up'
      ? theme.colors.profit
      : trend === 'down'
      ? theme.colors.loss
      : theme.colors.textDim;

  const resolvedChangeColour = changeColour ?? trendColour;

  return (
    <View
      style={[
        styles.card,
        glow && styles.cardGlow,
        compact && styles.cardCompact,
      ]}
    >
      {/* ── Header: label + optional icon ──────── */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && (
          <Ionicons
            name={icon as any}
            size={14}
            color={iconColour ?? theme.colors.textDim}
          />
        )}
      </View>

      {/* ── Value + trend ─────────────────────── */}
      <View style={styles.valueRow}>
        <Text
          style={[
            compact ? styles.valueCompact : styles.value,
            valueColour ? { color: valueColour } : null,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>

        {trendIcon && (
          <Ionicons
            name={trendIcon as any}
            size={compact ? 14 : 18}
            color={trendColour}
            style={styles.trendIcon}
          />
        )}
      </View>

      {/* ── Optional change text ──────────────── */}
      {change && (
        <Text style={[styles.change, { color: resolvedChangeColour }]}>
          {change}
        </Text>
      )}
    </View>
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
    ...theme.shadows.card,
  },
  cardGlow: {
    borderColor: theme.colors.borderFocus,
    ...theme.shadows.cardHover,
  },
  cardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: theme.colors.textMuted,
    ...typography.label,
  },

  // Value
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    color: theme.colors.text,
    ...typography.monoLarge,
    flexShrink: 1,
  },
  valueCompact: {
    color: theme.colors.text,
    ...typography.mono,
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  trendIcon: {
    marginLeft: 8,
  },

  // Change text
  change: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: 6,
  },
});