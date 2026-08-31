import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { MOCK_SCANS, MOCK_COMPLAINTS } from '../data/mockScans';
import ScanCard from '../components/ScanCard';
import StatusBadge from '../components/StatusBadge';

export default function HomeScreen({ navigation }: any) {
  const scanPressAnim = useRef(new Animated.Value(1)).current;

  const handleScanPressIn = () =>
    Animated.spring(scanPressAnim, { toValue: 0.96, useNativeDriver: Platform.OS !== 'web' }).start();
  const handleScanPressOut = () =>
    Animated.spring(scanPressAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();

  const totalToday = 28;
  const compliantCount = 24;
  const violationCount = 3;
  const reviewCount = 1;

  const activeComplaint = MOCK_COMPLAINTS[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Top Header Bar ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.userName}>Turja Sen Das</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate('Rules')}
              activeOpacity={0.8}
            >
              <Feather name="search" size={19} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate('Track')}
              activeOpacity={0.8}
            >
              <Feather name="bell" size={19} color={Colors.textPrimary} />
              <View style={styles.unreadDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Inspection Banner Card ─────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Track Product{'\n'}Compliance</Text>
            <Text style={styles.heroSubtitle}>
              Scan packages for MRP, Net Qty, Best Before & Manufacturer declarations.
            </Text>

            <Animated.View style={{ transform: [{ scale: scanPressAnim }] }}>
              <TouchableOpacity
                style={styles.heroCtaBtn}
                onPressIn={handleScanPressIn}
                onPressOut={handleScanPressOut}
                onPress={() => navigation.navigate('Scanner')}
                activeOpacity={0.9}
              >
                <Text style={styles.heroCtaText}>Scan Now</Text>
                <Feather name="arrow-right" size={15} color={Colors.white} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.heroGraphicBox}>
            <View style={styles.heroIconBubble}>
              <MaterialCommunityIcons name="shield-check" size={38} color={Colors.primary} />
            </View>
            <View style={styles.heroMiniChip}>
              <Feather name="zap" size={11} color={Colors.primary} style={{ marginRight: 3 }} />
              <Text style={styles.heroMiniChipText}>AI Verified</Text>
            </View>
          </View>
        </View>

        {/* ── Metrics Overview Grid ───────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inspections Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.seeDetails}>See Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          {/* Card 1: Today's Total Scans */}
          <View style={[styles.metricCard, { backgroundColor: Colors.white }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Scans Today</Text>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.porcelain }]}>
                <Feather name="camera" size={15} color={Colors.textPrimary} />
              </View>
            </View>
            <View style={styles.metricNumberRow}>
              <Text style={styles.metricNumber}>{totalToday}</Text>
              <Text style={styles.metricUnit}>units</Text>
            </View>
          </View>

          {/* Card 2: Compliance Rate */}
          <View style={[styles.metricCard, { backgroundColor: Colors.white }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Compliance Rate</Text>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.chromeWhite }]}>
                <Feather name="check-circle" size={15} color={Colors.pass} />
              </View>
            </View>
            <View style={styles.metricNumberRow}>
              <Text style={styles.metricNumber}>92</Text>
              <Text style={styles.metricUnit}>%</Text>
            </View>
          </View>
        </View>

        {/* ── Secondary Metric Pill Row ───────────────────────────── */}
        <View style={styles.statusChipsRow}>
          <View style={[styles.statusChipItem, { backgroundColor: Colors.passBg }]}>
            <Feather name="check" size={13} color={Colors.pass} style={{ marginRight: 6 }} />
            <Text style={[styles.statusChipText, { color: Colors.pass }]}>
              {compliantCount} Compliant
            </Text>
          </View>

          <View style={[styles.statusChipItem, { backgroundColor: Colors.reviewBg }]}>
            <Feather name="alert-triangle" size={13} color={Colors.review} style={{ marginRight: 6 }} />
            <Text style={[styles.statusChipText, { color: Colors.review }]}>
              {reviewCount} Review
            </Text>
          </View>

          <View style={[styles.statusChipItem, { backgroundColor: Colors.failBg }]}>
            <Feather name="x-circle" size={13} color={Colors.fail} style={{ marginRight: 6 }} />
            <Text style={[styles.statusChipText, { color: Colors.fail }]}>
              {violationCount} Violations
            </Text>
          </View>
        </View>

        {/* ── Active Complaint Summary ────────────────────────────── */}
        {activeComplaint && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Case File</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Track')}>
                <Text style={styles.seeDetails}>Track</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.complaintCard}
              onPress={() => navigation.navigate('Track', { complaint: activeComplaint })}
              activeOpacity={0.85}
            >
              <View style={styles.complaintTop}>
                <View style={styles.complaintIconPill}>
                  <Feather name="file-text" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.complaintId}>{activeComplaint.id}</Text>
                  <Text style={styles.complaintTitle} numberOfLines={1}>
                    {activeComplaint.productName}
                  </Text>
                </View>
                <StatusBadge status="REVIEW" size="sm" />
              </View>

              <View style={styles.complaintDivider} />

              <View style={styles.complaintBottom}>
                <Feather name="alert-circle" size={13} color={Colors.fail} style={{ marginRight: 5 }} />
                <Text style={styles.complaintViolations} numberOfLines={1}>
                  {activeComplaint.violations.join(' · ')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Recent Inspections List ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Rules')}>
              <Text style={styles.seeDetails}>See Details</Text>
            </TouchableOpacity>
          </View>

          {MOCK_SCANS.slice(0, 3).map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onPress={() => navigation.navigate('Report', { scan })}
            />
          ))}
        </View>

        {/* ── Educational Tip Card (Chrome White Pastel) ──────────── */}
        <View style={styles.educationCard}>
          <View style={styles.eduHeader}>
            <View style={styles.eduIconCircle}>
              <Feather name="book-open" size={14} color={Colors.textPrimary} />
            </View>
            <Text style={styles.eduCaps}>LEGAL METROLOGY DIRECTIVE</Text>
          </View>
          <Text style={styles.eduTitle}>Mandatory MRP & Unit Sale Price</Text>
          <Text style={styles.eduBody}>
            As per the Legal Metrology (Packaged Commodities) Amendment Rules, packages containing more than 1 kg or 1 L must declare Unit Sale Price alongside Maximum Retail Price (MRP).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 110, // Space for floating bottom island
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  userName: {
    ...Typography.headline,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  heroCard: {
    backgroundColor: Colors.porcelain,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  heroCtaBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    ...Shadows.glowOrange,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  heroGraphicBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  heroMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginTop: 8,
    ...Shadows.soft,
  },
  heroMiniChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 17,
  },
  seeDetails: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statusChipItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  complaintCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  complaintTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complaintIconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complaintId: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  complaintTitle: {
    ...Typography.title,
    fontSize: 14,
    marginTop: 1,
  },
  complaintDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  complaintBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complaintViolations: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  educationCard: {
    backgroundColor: Colors.chromeWhite,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.chromeWhiteDark,
  },
  eduHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eduIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  eduCaps: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.textPrimary,
  },
  eduTitle: {
    ...Typography.title,
    fontSize: 14,
    marginBottom: 4,
  },
  eduBody: {
    ...Typography.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textPrimary,
  },
});
