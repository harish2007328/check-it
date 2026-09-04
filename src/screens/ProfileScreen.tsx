import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [offlineOcr, setOfflineOcr] = useState(true);
  const [autoEvidence, setAutoEvidence] = useState(true);
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top;
  const topPadding = statusBarHeight + 14;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>H</Text>
          </View>
          <Text style={styles.userName}>Harish</Text>
          <Text style={styles.userRole}>Legal Metrology Officer · Zone 4</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Feather name="shield" size={11} color={Colors.pass} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>Certified Inspector</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: Colors.chromeWhite }]}>
              <Text style={[styles.badgeText, { color: Colors.textPrimary }]}>ID: LM-2026-981</Text>
            </View>
          </View>
        </View>

        {/* Inspection Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: Colors.porcelain }]}>
            <Text style={styles.statNumber}>128</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.passBg }]}>
            <Text style={[styles.statNumber, { color: Colors.pass }]}>94.2%</Text>
            <Text style={styles.statLabel}>Compliance Rate</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: Colors.failBg }]}>
            <Text style={[styles.statNumber, { color: Colors.fail }]}>13</Text>
            <Text style={styles.statLabel}>Violations Filed</Text>
          </View>
        </View>

        {/* Engine Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AI & COMPLIANCE ENGINE</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>On-Device Edge OCR</Text>
                <Text style={styles.settingDesc}>Fast local text extraction without cloud delay</Text>
              </View>
              <Switch
                value={offlineOcr}
                onValueChange={setOfflineOcr}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Auto-Attach Evidence Images</Text>
                <Text style={styles.settingDesc}>Embed bounding crops in inspection reports</Text>
              </View>
              <Switch
                value={autoEvidence}
                onValueChange={setAutoEvidence}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Critical Violation Alerts</Text>
                <Text style={styles.settingDesc}>Haptic alert on missing mandatory declarations</Text>
              </View>
              <Switch
                value={highRiskAlerts}
                onValueChange={setHighRiskAlerts}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SUPPORT & METROLOGY ACT</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Rules')}
            >
              <Feather name="book" size={16} color={Colors.textPrimary} style={{ marginRight: 12 }} />
              <Text style={styles.actionText}>Gazette Amendments 2026</Text>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() =>
                Alert.alert('Database Sync', 'Legal Metrology standards are up-to-date (Version 2026.3).')
              }
            >
              <Feather name="refresh-cw" size={16} color={Colors.textPrimary} style={{ marginRight: 12 }} />
              <Text style={styles.actionText}>Check Rule Database Updates</Text>
              <Feather name="chevron-right" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.canvas },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.chromeWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.soft,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userName: {
    ...Typography.headline,
    fontSize: 20,
  },
  userRole: {
    ...Typography.body,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.passBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.pass,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  statBox: {
    flex: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  settingDesc: {
    ...Typography.caption,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionText: {
    ...Typography.bodyMedium,
    flex: 1,
  },
});
