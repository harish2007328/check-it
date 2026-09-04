import React, { useRef, useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radii, Shadows } from '../theme/colors';
import { MOCK_SCANS, MOCK_COMPLAINTS } from '../data/mockScans';
import { ScanResult, Complaint } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function HomeScreen({ navigation }: any) {
  const scanPressAnim = useRef(new Animated.Value(1)).current;
  const [scans, setScans] = useState<ScanResult[]>(MOCK_SCANS);
  const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const storedScans = await AsyncStorage.getItem('scans');
      if (storedScans) {
        const parsed: ScanResult[] = JSON.parse(storedScans);
        if (parsed.length > 0) setScans([...parsed, ...MOCK_SCANS]);
      }
      const storedComplaints = await AsyncStorage.getItem('complaints');
      if (storedComplaints) {
        const parsedCmp: Complaint[] = JSON.parse(storedComplaints);
        if (parsedCmp.length > 0) setComplaints([...parsedCmp, ...MOCK_COMPLAINTS]);
      }
    } catch {}
  };

  const handleScanPressIn = () =>
    Animated.spring(scanPressAnim, { toValue: 0.95, useNativeDriver: Platform.OS !== 'web' }).start();
  const handleScanPressOut = () =>
    Animated.spring(scanPressAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();

  const pendingScans = scans.filter(
    (s) => s.overallStatus === 'NON_COMPLIANT' || s.overallStatus === 'NEEDS_REVIEW'
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111118" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── DARK HERO ────────────────────────────────────── */}
        <LinearGradient
          colors={['#111118', '#1C1C28', '#111118']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Header row */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarPill}>
                <Feather name="shield" size={16} color={Colors.primary} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.userName}>Inspector Sharma 👋</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => navigation.navigate('Rules')}
                activeOpacity={0.8}
              >
                <Feather name="search" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => navigation.navigate('Track')}
                activeOpacity={0.8}
              >
                <Feather name="bell" size={16} color="#fff" />
                <View style={styles.unreadDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Centered shield badge */}
          <View style={styles.badgeWrap}>
            <Image
              source={require('../../assets/hero_scan_badge.jpg')}
              style={styles.badgeImg}
              resizeMode="contain"
            />
          </View>

          {/* Hero headline */}
          <Text style={styles.heroTitle}>Scan. Inspect. Protect.</Text>
          <Text style={styles.heroSub}>
            Enforce packaged commodity laws instantly
          </Text>

          {/* CTA */}
          <Animated.View style={{ transform: [{ scale: scanPressAnim }] }}>
            <TouchableOpacity
              style={styles.whiteCta}
              onPressIn={handleScanPressIn}
              onPressOut={handleScanPressOut}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons
                name="barcode-scan"
                size={17}
                color={Colors.almostBlack}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.ctaText}>Scan Product</Text>
              <Feather
                name="arrow-right"
                size={15}
                color={Colors.almostBlack}
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* ── WHITE CONTENT SHEET ───────────────────────────── */}
        <View style={styles.sheet}>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{scans.length}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{complaints.length}</Text>
              <Text style={styles.statLabel}>Complaints</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, pendingScans.length > 0 && { color: Colors.fail }]}>
                {pendingScans.length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* ── Registered Complaints ────────────────────── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Registered Complaints</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{complaints.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Track')}
                style={styles.linkBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.linkBtnText}>Track all →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {complaints.map((item, index) => {
                const isHigh = item.severity === 'HIGH' || item.severity === 'CRITICAL';
                const cardBg = index % 2 === 0 ? Colors.porcelain : '#F3E8FF';
                const accentColor = index % 2 === 0 ? '#0D9488' : '#7C3AED';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.horizontalCard, { backgroundColor: cardBg }]}
                    onPress={() => navigation.navigate('Track', { complaint: item })}
                    activeOpacity={0.88}
                  >
                    <View style={styles.hCardTop}>
                      <View style={[styles.hCaseIdPill, { backgroundColor: Colors.white }]}>
                        <Text style={[styles.hCaseIdText, { color: accentColor }]}>{item.id}</Text>
                      </View>
                      <StatusBadge
                        status={item.status === 'RESOLVED' ? 'PASS' : isHigh ? 'FAIL' : 'REVIEW'}
                        size="sm"
                      />
                    </View>
                    <Text style={styles.hCardTitle} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.hCardCategory}>{item.category} Commodity</Text>
                    <View style={styles.violationsTagContainer}>
                      <Feather name="alert-triangle" size={11} color={accentColor} style={{ marginRight: 4 }} />
                      <Text style={[styles.violationsSummary, { color: accentColor }]} numberOfLines={1}>
                        {item.violations[0] || 'Declarations missing'}
                      </Text>
                    </View>
                    <View style={styles.hCardFooter}>
                      <View style={styles.officerRow}>
                        <Feather name="shield" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.officerText}>Jurisdiction Office</Text>
                      </View>
                      <View style={[styles.hArrowCircle, { backgroundColor: Colors.white }]}>
                        <Feather name="chevron-right" size={14} color={accentColor} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Pending Action (Drafts) ───────────────────── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Pending Action</Text>
                <View style={[styles.countBadge, { backgroundColor: Colors.failBg }]}>
                  <Text style={[styles.countBadgeText, { color: Colors.fail }]}>
                    {pendingScans.length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
                <Text style={styles.scanMoreLink}>+ New Scan</Text>
              </TouchableOpacity>
            </View>

            {pendingScans.map((scan) => {
              const isNonCompliant = scan.overallStatus === 'NON_COMPLIANT';
              const failFields = scan.fields.filter((f) => f.status === 'FAIL');
              return (
                <TouchableOpacity
                  key={scan.id}
                  style={styles.pendingCard}
                  onPress={() => navigation.navigate('Report', { scan })}
                  activeOpacity={0.85}
                >
                  <View style={styles.pendingCardTop}>
                    <View style={styles.pendingLeftInfo}>
                      <View style={styles.pendingIdRow}>
                        <Text style={styles.pendingId}>{scan.id}</Text>
                        <Text style={styles.pendingDot}>•</Text>
                        <Text style={styles.pendingCategory}>{scan.category}</Text>
                      </View>
                      <Text style={styles.pendingProductName}>{scan.productName}</Text>
                    </View>
                    <View
                      style={[
                        styles.scoreCircle,
                        { backgroundColor: isNonCompliant ? Colors.failBg : Colors.reviewBg },
                      ]}
                    >
                      <Text style={[styles.scoreText, { color: isNonCompliant ? Colors.fail : Colors.review }]}>
                        {scan.score}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pendingDivider} />

                  <View style={styles.pendingCardBottom}>
                    <View style={styles.missingIssuesBox}>
                      <Feather
                        name="alert-circle"
                        size={12}
                        color={isNonCompliant ? Colors.fail : Colors.review}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.missingIssuesText} numberOfLines={1}>
                        {failFields.length > 0
                          ? `${failFields.length} rule violation(s) detected`
                          : 'Low confidence OCR requires review'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.fileNoticeBtn,
                        { backgroundColor: isNonCompliant ? Colors.almostBlack : Colors.white },
                      ]}
                      onPress={() => navigation.navigate('Complaint', { scan })}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.fileNoticeBtnText, { color: isNonCompliant ? Colors.white : Colors.textPrimary }]}>
                        {isNonCompliant ? 'File Notice' : 'Verify'}
                      </Text>
                      <Feather
                        name="arrow-up-right"
                        size={12}
                        color={isNonCompliant ? Colors.white : Colors.textPrimary}
                        style={{ marginLeft: 3 }}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111118',
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── Hero ──────────────────────────────────────────────
  hero: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 56,
    alignItems: 'center',
  },

  // Header row (inside hero, white text)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(252, 146, 68, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252, 146, 68, 0.28)',
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: '#111118',
  },

  // Badge image
  badgeWrap: {
    width: 190,
    height: 190,
    marginBottom: Spacing.lg,
  },
  badgeImg: {
    width: '100%',
    height: '100%',
  },

  // Hero text
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: 0.1,
  },

  // White CTA button
  whiteCta: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radii.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.almostBlack,
    letterSpacing: -0.2,
  },

  // ── White sheet overlapping hero ──────────────────────
  sheet: {
    backgroundColor: Colors.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  // Quick stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md + 2,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '55%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },

  // Sections
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Colors.porcelainDark,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  linkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  scanMoreLink: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Horizontal cards
  horizontalScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  horizontalCard: {
    width: 220,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Shadows.soft,
  },
  hCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hCaseIdPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  hCaseIdText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  hCardCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  violationsTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    marginBottom: 10,
  },
  violationsSummary: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  hCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  officerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  hArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },

  // Pending cards
  pendingCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 18, 0.05)',
    ...Shadows.soft,
  },
  pendingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingLeftInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  pendingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pendingId: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  pendingDot: {
    fontSize: 10,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  pendingCategory: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  pendingProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  scoreCircle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pendingDivider: {
    height: 1,
    backgroundColor: 'rgba(13, 13, 18, 0.04)',
    marginVertical: 10,
  },
  pendingCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missingIssuesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  missingIssuesText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  fileNoticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileNoticeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
