import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../src/constants/styles';
import { theme } from '../../src/constants/theme';
import { typography } from '../../src/constants/typography';
import { useApp } from '../../src/context/AppContext';
import type { Trade } from '../../src/types';

type TradeGroup = {
  title: string;
  trades: Trade[];
};

export default function JournalScreen() {
  const { trades } = useApp();
  const router = useRouter();

  const groupedTrades = useMemo(() => {
    const map = new Map<string, Trade[]>();

    trades.forEach((trade) => {
      const key = getDayKey(trade.createdAt);
      const existing = map.get(key) ?? [];
      existing.push(trade);
      map.set(key, existing);
    });

    const groups: TradeGroup[] = Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([day, dayTrades]) => ({
        title: formatDayHeading(day),
        trades: dayTrades.sort(
          (a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
        ),
      }));

    return groups;
  }, [trades]);

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={globalStyles.title}>Journal</Text>
          <Text style={styles.tradeCount}>
            {trades.length} trade{trades.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {trades.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={40} color={theme.colors.textDim} />
            </View>
            <Text style={styles.emptyTitle}>No trades logged yet</Text>
            <Text style={styles.emptyBody}>
              Your journal will organise trades by day once you start logging them.
            </Text>
          </View>
        ) : (
          groupedTrades.map((group) => (
            <View key={group.title} style={styles.daySection}>
              <Text style={styles.dayHeading}>{group.title}</Text>

              <View style={styles.dayCard}>
                {group.trades.map((trade, index) => {
                  const isPositive = trade.pnl >= 0;
                  const duration = getDurationLabel(trade.entryTime, trade.exitTime);

                  return (
                    <React.Fragment key={trade.id}>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/trade/[id]',
                            params: { id: trade.id },
                          })
                        }
                        style={styles.tradeRow}
                      >
                        <View style={styles.tradeLeft}>
                          <Text style={styles.strategy}>{trade.strategy}</Text>
                          <Text style={styles.duration}>{duration}</Text>
                        </View>

                        <View style={styles.tradeRight}>
                          <Text
                            style={[
                              styles.pnl,
                              {
                                color: isPositive ? theme.colors.profit : theme.colors.loss,
                              },
                            ]}
                          >
                            {isPositive ? '+' : '-'}$
                            {Math.abs(trade.pnl).toLocaleString()}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={theme.colors.textDim}
                          />
                        </View>
                      </Pressable>

                      {index < group.trades.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getDayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDayHeading(dayKey: string) {
  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getDurationLabel(entryIso: string, exitIso: string) {
  const diffMs = new Date(exitIso).getTime() - new Date(entryIso).getTime();

  if (diffMs <= 0) return '0m';

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  tradeCount: {
    color: theme.colors.textDim,
    ...typography.caption,
  },

  daySection: {
    marginBottom: theme.spacing.lg,
  },
  dayHeading: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: 10,
  },
  dayCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  tradeRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tradeLeft: {
    flex: 1,
    marginRight: 12,
  },
  strategy: {
    color: theme.colors.text,
    ...typography.cardTitle,
  },
  duration: {
    color: theme.colors.textDim,
    ...typography.caption,
    marginTop: 4,
  },
  tradeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pnl: {
    ...typography.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
});