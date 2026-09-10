import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { Complaint } from '../types';
import { fetchComplaints } from '../utils/supabase';
import StepTracker from '../components/StepTracker';
import StatusBadge from '../components/StatusBadge';

export default function TrackComplaintScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(
    route.params?.complaint ?? null
  );
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top;
  const topPadding = statusBarHeight + 10;

  useEffect(() => {
    loadComplaints();
    const unsub = navigation.addListener?.('focus', () => {
      loadComplaints();
    });
    return unsub;
  }, [navigation]);

  const loadComplaints = async () => {
    try {
      const data = await fetchComplaints();
      setComplaints(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } catch (err) {
      console.warn('Error loading complaints from Supabase:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  const filtered = search.trim()
    ? complaints.filter(
        (c) =>
          c.id.toLowerCase().includes(search.toLowerCase()) ||
          c.productName.toLowerCase().includes(search.toLowerCase())
      )
    : complaints;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View>
          <Text style={styles.headerTitle}>Case Tracking</Text>
          <Text style={styles.headerSub}>Legal Metrology Regulatory Complaints</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshCircleBtn}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <Feather name="rotate-cw" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ──────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by case ID or product..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="shield" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Registered Complaints</Text>
            <Text style={styles.emptySub}>
              Your registered complaints will be available here. Currently 0. When you scan product packaging and file notices, their live tracking status will appear here.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyActionBtnText}>Start New Scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Horizontal / Vertical Case Selector ─────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Dossiers ({filtered.length})</Text>

          {filtered.map((c) => {
            const active = selected?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.caseCard, active && styles.caseCardActive]}
                onPress={() => setSelected(c)}
                activeOpacity={0.85}
              >
                <View style={styles.caseTop}>
                  <View style={styles.caseIdPill}>
                    <Text style={styles.caseIdText}>{c.id}</Text>
                  </View>
                  <StatusBadge
                    status={c.status === 'RESOLVED' ? 'PASS' : 'REVIEW'}
                    size="sm"
                  />
                </View>

                <Text style={styles.caseProduct} numberOfLines={1}>
                  {c.productName}
                </Text>

                <View style={styles.caseFooter}>
                  <View style={styles.severityItem}>
                    <View
                      style={[
                        styles.severityDot,
                        {
                          backgroundColor:
                            c.severity === 'CRITICAL'
                              ? Colors.fail
                              : c.severity === 'HIGH'
                              ? Colors.review
                              : Colors.primary,
                        },
                      ]}
                    />
                    <Text style={styles.severityLabel}>{c.severity} Priority</Text>
                  </View>

                  <Text style={styles.caseDate}>
                    {new Date(c.filedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Case File Investigation Dossier ─────────────────── */}
        {selected && (
          <View style={styles.dossierContainer}>
            <View style={styles.dossierHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                {selected.imageUri ? (
                  <Image
                    source={{ uri: selected.imageUri }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 8,
                      marginRight: 12,
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      backgroundColor: '#FFFFFF',
                    }}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.dossierSubtitle}>ACTIVE INVESTIGATION</Text>
                  <Text style={styles.dossierTitle} numberOfLines={1}>{selected.productName}</Text>
                </View>
              </View>
              <View style={styles.dossierIdBadge}>
                <Text style={styles.dossierIdBadgeText}>{selected.id}</Text>
              </View>
            </View>

            {/* Reported Non-Compliance */}
            <View style={styles.dossierBox}>
              <Text style={styles.dossierBoxTitle}>REPORTED STATUTORY INFRINGEMENTS</Text>
              {selected.violations.map((v, i) => (
                <View key={i} style={styles.violationBulletRow}>
                  <Feather name="alert-circle" size={13} color={Colors.fail} style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.violationBulletText}>{v}</Text>
                </View>
              ))}
            </View>

            {/* Inspector Observations */}
            <View style={[styles.dossierBox, { backgroundColor: Colors.surfaceSubtle }]}>
              <Text style={styles.dossierBoxTitle}>INSPECTOR MEMORANDUM</Text>
              <Text style={styles.memoText}>{selected.notes}</Text>
            </View>

            {/* Step Progress Tracker */}
            <View style={styles.trackerWrapper}>
              <Text style={styles.dossierBoxTitle}>STATUTORY PROCEEDING LIFECYCLE</Text>
              <StepTracker steps={selected.steps} />
            </View>
          </View>
        )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.headline,
    fontSize: 20,
  },
  headerSub: {
    ...Typography.caption,
    marginTop: 2,
  },
  refreshCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  caseCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  caseCardActive: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: Colors.primaryLight,
  },
  caseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseIdPill: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  caseIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  caseProduct: {
    ...Typography.title,
    fontSize: 15,
    marginTop: 6,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  severityLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  caseDate: {
    ...Typography.caption,
    fontSize: 11,
  },
  dossierContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  dossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dossierSubtitle: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    fontSize: 9,
  },
  dossierTitle: {
    ...Typography.headline,
    fontSize: 18,
    marginTop: 2,
  },
  dossierIdBadge: {
    backgroundColor: Colors.porcelain,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
  },
  dossierIdBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  dossierBox: {
    backgroundColor: Colors.failBg,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dossierBoxTitle: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  violationBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  violationBulletText: {
    ...Typography.bodyMedium,
    fontSize: 12,
    color: Colors.fail,
    flex: 1,
  },
  memoText: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  },
  trackerWrapper: {
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radii.full,
    ...Shadows.glowOrange,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
