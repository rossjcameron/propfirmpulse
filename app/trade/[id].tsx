import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../src/constants/styles';
import { theme } from '../../src/constants/theme';
import { typography } from '../../src/constants/typography';
import { useApp } from '../../src/context/AppContext';

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trades, accounts } = useApp();

  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const trade = useMemo(
    () => trades.find((item) => item.id === id),
    [trades, id]
  );

  const accountNames = useMemo(() => {
    if (!trade) return '';
    return trade.accountIds
      .map((accountId) => accounts.find((account) => account.id === accountId)?.name)
      .filter(Boolean)
      .join(', ');
  }, [trade, accounts]);

  useEffect(() => {
    if (!trade?.screenshotUrl) {
      setImageHeight(null);
      return;
    }

    const screenWidth = Dimensions.get('window').width;
    const horizontalPadding = 16 * 2;
    const cardPadding = 16 * 2;
    const usableWidth = screenWidth - horizontalPadding - cardPadding;

    Image.getSize(
      trade.screenshotUrl,
      (width, height) => {
        const ratio = height / width;
        setImageHeight(usableWidth * ratio);
      },
      () => {
        setImageHeight(240);
      }
    );
  }, [trade?.screenshotUrl]);

  if (!trade) {
    return (
      <SafeAreaView style={globalStyles.screen} edges={['top']}>
        <ScrollView
          style={globalStyles.screen}
          contentContainerStyle={globalStyles.scrollContent}
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={theme.colors.textDim}
              />
            </View>
            <Text style={styles.emptyTitle}>Trade not found</Text>
            <Text style={styles.emptyBody}>
              This journal entry could not be loaded.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isPositive = trade.pnl >= 0;
  const duration = getDurationLabel(trade.entryTime, trade.exitTime);

  return (
    <>
      <SafeAreaView style={globalStyles.screen} edges={['top']}>
        <ScrollView
          style={globalStyles.screen}
          contentContainerStyle={globalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View
              style={[
                styles.heroAccent,
                {
                  backgroundColor: isPositive
                    ? theme.colors.profit
                    : theme.colors.loss,
                },
              ]}
            />

            <View style={styles.heroTopRow}>
              <Text style={styles.heroStrategy}>{trade.strategy}</Text>

              <View
                style={[
                  styles.resultPill,
                  {
                    backgroundColor:
                      trade.outcome === 'Win'
                        ? theme.colors.primaryGlow
                        : theme.colors.lossDim,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resultPillText,
                    {
                      color:
                        trade.outcome === 'Win'
                          ? theme.colors.profit
                          : theme.colors.loss,
                    },
                  ]}
                >
                  {trade.outcome}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroPnl,
                { color: isPositive ? theme.colors.profit : theme.colors.loss },
              ]}
            >
              {isPositive ? '+' : '-'}${Math.abs(trade.pnl).toLocaleString()}
            </Text>

            <Text
              style={[
                styles.heroR,
                { color: isPositive ? theme.colors.profit : theme.colors.loss },
              ]}
            >
              {trade.r >= 0 ? '+' : ''}
              {trade.r.toFixed(2)}R
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Trade Summary</Text>

            <DetailRow label="Account" value={accountNames || '—'} />
            <DetailRow label="Direction" value={trade.direction} />
            <DetailRow label="Outcome" value={trade.outcome} />
            <DetailRow label="Duration" value={duration} />
            <DetailRow label="Entry time" value={formatDateTime(trade.entryTime)} />
            <DetailRow label="Exit time" value={formatDateTime(trade.exitTime)} />
            <DetailRow label="Logged on" value={formatDateTime(trade.createdAt)} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Journal Details</Text>

            <DetailRow label="Emotional state" value={trade.emotionalState ?? '—'} />
            <DetailRow label="Confidence" value={trade.confidence ?? '—'} />

            <View style={styles.longField}>
              <Text style={styles.longFieldLabel}>Notes</Text>
              <Text style={styles.longFieldValue}>
                {trade.notes || 'No notes added.'}
              </Text>
            </View>

            <View style={styles.longField}>
              <Text style={styles.longFieldLabel}>Lessons</Text>
              <Text style={styles.longFieldValue}>
                {trade.lessons || 'No lessons added.'}
              </Text>
            </View>
          </View>

          {trade.screenshotUrl && (
            <View style={styles.sectionCard}>
              <View style={styles.screenshotHeader}>
                <Text style={styles.sectionTitle}>Screenshot</Text>
                <Text style={styles.screenshotHint}>Tap to zoom</Text>
              </View>

              <Pressable
                onPress={() => setViewerOpen(true)}
                style={styles.screenshotPressable}
              >
                {imageHeight ? (
                  <Image
                    source={{ uri: trade.screenshotUrl }}
                    style={[
                      styles.screenshotInline,
                      {
                        height: imageHeight,
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.screenshotLoading}>
                    <Text style={styles.screenshotLoadingText}>Loading image…</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={viewerOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.viewerRoot}>
          <View style={styles.viewerTopBar}>
            <Pressable
              onPress={() => setViewerOpen(false)}
              style={styles.viewerCloseButton}
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
              <Text style={styles.viewerCloseText}>Back</Text>
            </Pressable>
          </View>

          {trade.screenshotUrl && (
            <ScrollView
              style={styles.viewerScroll}
              contentContainerStyle={styles.viewerScrollContent}
              maximumZoomScale={6}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bouncesZoom
              centerContent
            >
              <Image
                source={{ uri: trade.screenshotUrl }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  heroCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroStrategy: {
    color: theme.colors.text,
    ...typography.sectionTitle,
  },
  resultPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resultPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroPnl: {
    ...typography.heroStat,
  },
  heroR: {
    ...typography.monoLarge,
    marginTop: 6,
  },

  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  sectionTitle: {
    color: theme.colors.text,
    ...typography.cardTitle,
    marginBottom: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  detailLabel: {
    color: theme.colors.textMuted,
    ...typography.body,
    flex: 1,
  },
  detailValue: {
    color: theme.colors.text,
    ...typography.bodyMedium,
    flex: 1,
    textAlign: 'right',
  },

  longField: {
    marginTop: 14,
  },
  longFieldLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: 8,
  },
  longFieldValue: {
    color: theme.colors.text,
    ...typography.body,
    lineHeight: 22,
  },

  screenshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  screenshotHint: {
    color: theme.colors.textDim,
    ...typography.caption,
  },
  screenshotPressable: {
    width: '100%',
  },
  screenshotInline: {
    width: '100%',
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.sm,
  },
  screenshotLoading: {
    width: '100%',
    height: 240,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotLoadingText: {
    color: theme.colors.textDim,
    ...typography.body,
  },

  viewerRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerTopBar: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    zIndex: 2,
  },
  viewerCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  viewerCloseText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  viewerScroll: {
    flex: 1,
  },
  viewerScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 120,
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