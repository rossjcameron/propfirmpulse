import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
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

export default function ProfileScreen() {
  const router = useRouter();
  const {
    accounts,
    trades,
    profileUsername,
    setProfileUsername,
    profileImageUri,
    setProfileImageUri,
  } = useApp();

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(profileUsername);

  const fundedCount = accounts.filter((a) => a.status === 'Funded').length;
  const totalR = trades.reduce((sum, t) => sum + t.r, 0);

  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRate =
    trades.length > 0 ? ((wins / trades.length) * 100).toFixed(0) : '—';

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const saveUsername = () => {
    const trimmed = usernameDraft.trim();
    if (!trimmed) return;
    setProfileUsername(trimmed);
    setShowUsernameModal(false);
  };

  return (
    <SafeAreaView style={globalStyles.screen} edges={['top']}>
      <ScrollView
        style={globalStyles.screen}
        contentContainerStyle={globalStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={globalStyles.title}>Profile</Text>
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.profileHeader}>
          <Pressable style={styles.avatarWrap} onPress={pickProfileImage}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={theme.colors.textDim} />
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#050507" />
            </View>
          </Pressable>

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profileUsername}</Text>
            <Text style={styles.username}>@{slugify(profileUsername)}</Text>

            <View style={styles.profileActions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  setUsernameDraft(profileUsername);
                  setShowUsernameModal(true);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.actionButtonText}>Change username</Text>
              </Pressable>

              <Pressable style={styles.actionButton} onPress={pickProfileImage}>
                <Ionicons
                  name="image-outline"
                  size={14}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.actionButtonText}>Change photo</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total R</Text>
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

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>
              {winRate}
              {winRate !== '—' ? '%' : ''}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Accounts</Text>
            <Text style={styles.statValue}>{accounts.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Funded</Text>
            <Text style={[styles.statValue, { color: theme.colors.profit }]}>
              {fundedCount}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Trades</Text>
            <Text style={styles.statValue}>{trades.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Wins</Text>
            <Text style={[styles.statValue, { color: theme.colors.profit }]}>
              {wins}
            </Text>
          </View>
        </View>

        <Text style={[globalStyles.label, styles.sectionLabel]}>Profile actions</Text>

        <View style={styles.menuCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setUsernameDraft(profileUsername);
              setShowUsernameModal(true);
            }}
          >
            <Ionicons name="person-circle-outline" size={18} color={theme.colors.textMuted} />
            <Text style={styles.menuText}>Edit username</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
          </Pressable>

          <View style={globalStyles.divider} />

          <Pressable style={styles.menuItem} onPress={pickProfileImage}>
            <Ionicons name="image-outline" size={18} color={theme.colors.textMuted} />
            <Text style={styles.menuText}>Change profile picture</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
          </Pressable>

          <View style={globalStyles.divider} />

          <Pressable style={styles.menuItem} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={18} color={theme.colors.textMuted} />
            <Text style={styles.menuText}>Open settings</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showUsernameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowUsernameModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Change username</Text>
            <Text style={styles.modalSubtitle}>
              Pick the display name shown on your profile.
            </Text>

            <TextInput
              value={usernameDraft}
              onChangeText={setUsernameDraft}
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor={theme.colors.textDim}
              maxLength={24}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalSecondary}
                onPress={() => setShowUsernameModal(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.modalPrimary} onPress={saveUsername}>
                <Text style={styles.modalPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '');
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    color: theme.colors.text,
    ...typography.sectionTitle,
  },
  username: {
    color: theme.colors.textMuted,
    ...typography.body,
    marginTop: 2,
  },
  profileActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.cardAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    width: '48%',
    flexGrow: 1,
    ...theme.shadows.card,
  },
  statLabel: {
    color: theme.colors.textMuted,
    ...typography.label,
    marginBottom: 6,
  },
  statValue: {
    color: theme.colors.text,
    ...typography.monoLarge,
  },

  sectionLabel: {
    marginBottom: theme.spacing.sm,
  },
  menuCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  menuText: {
    color: theme.colors.text,
    ...typography.bodyMedium,
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    color: theme.colors.text,
    ...typography.sectionTitle,
    marginBottom: 6,
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    ...typography.body,
    marginBottom: 16,
    lineHeight: 20,
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
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalSecondaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalPrimary: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: '#050507',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});