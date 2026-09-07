import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  Polygon,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radii, Shadows } from '../theme/colors';
import { fetchScans, fetchComplaints } from '../utils/supabase';
import { ScanResult, Complaint } from '../types';
import StatusBadge from '../components/StatusBadge';

const PRODUCT_IMAGES = [
  require('../../assets/1.png'),
  require('../../assets/2.png'),
  require('../../assets/3.png'),
  require('../../assets/4.png'),
  require('../../assets/5.png'),
  require('../../assets/6.png'),
  require('../../assets/7.png'),
  require('../../assets/8.png'),
];

function DynamicStatusBar({ scrollY }: { scrollY: Animated.Value }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const dark = value > 40;
      setIsDark((prev) => (prev !== dark ? dark : prev));
    });
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY]);

  return (
    <StatusBar
      barStyle={isDark ? 'dark-content' : 'light-content'}
      backgroundColor="transparent"
      translucent={true}
    />
  );
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scanPressAnim = useRef(new Animated.Value(1)).current;
  const laserSweep = useRef(new Animated.Value(0)).current;
  const laserOpacity = useRef(new Animated.Value(0)).current;
  const conveyorAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW'>('ALL');

  const compliantCount = scans.filter((s) => s.overallStatus === 'COMPLIANT').length;
  const violationCount = scans.filter((s) => s.overallStatus === 'NON_COMPLIANT').length;
  const reviewCount = scans.filter((s) => s.overallStatus === 'NEEDS_REVIEW').length;
  const complianceRate = scans.length > 0 ? Math.round((compliantCount / scans.length) * 100) : 100;

  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      searchQuery.trim().length === 0 ||
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || s.overallStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-500, 0, 4000],
    outputRange: [0, 0, 4000],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerOpacityInverse = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadData();

    // Unified step-by-step conveyor & scanning sequence (100% synchronized)
    const stepAnimations: Animated.CompositeAnimation[] = [];

    for (let k = 0; k < 8; k++) {
      // 1. Scan the product currently centered in the frame (~1000ms total)
      stepAnimations.push(
        Animated.sequence([
          // Reset laser position to top & fade in
          Animated.parallel([
            Animated.timing(laserSweep, {
              toValue: 0,
              duration: 0,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(laserOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ]),
          // Sweep laser line down
          Animated.timing(laserSweep, {
            toValue: 1,
            duration: 420,
            useNativeDriver: Platform.OS !== 'web',
          }),
          // Sweep laser line back up
          Animated.timing(laserSweep, {
            toValue: 0,
            duration: 420,
            useNativeDriver: Platform.OS !== 'web',
          }),
          // Fade out laser right before next item moves
          Animated.timing(laserOpacity, {
            toValue: 0,
            duration: 60,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );

      // 2. Slide next product into center frame (380ms)
      stepAnimations.push(
        Animated.timing(conveyorAnim, {
          toValue: k + 1,
          duration: 380,
          useNativeDriver: Platform.OS !== 'web',
        })
      );
    }

    // Reset conveyorAnim to 0 instantly after completing 8 items (8 % 8 === 0)
    stepAnimations.push(
      Animated.timing(conveyorAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: Platform.OS !== 'web',
      })
    );

    const scannerLoop = Animated.loop(Animated.sequence(stepAnimations));
    scannerLoop.start();

    const unsub = navigation.addListener?.('focus', () => {
      loadData();
    });

    return () => {
      scannerLoop.stop();
      unsub?.();
    };
  }, [navigation]);

  const loadData = async () => {
    try {
      const [scansData, complaintsData] = await Promise.all([
        fetchScans(),
        fetchComplaints(),
      ]);
      setScans(scansData);
      setComplaints(complaintsData);
    } catch (err) {
      console.warn('[Home] Error loading database data:', err);
    }
  };

  const handleScanPressIn = () =>
    Animated.spring(scanPressAnim, { toValue: 0.95, useNativeDriver: Platform.OS !== 'web' }).start();
  const handleScanPressOut = () =>
    Animated.spring(scanPressAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();

  const pendingScans = scans.filter(
    (s) => s.overallStatus === 'NON_COMPLIANT' || s.overallStatus === 'NEEDS_REVIEW'
  );

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top;
  const topPadding = statusBarHeight + 14;

  const renderCarouselItem = (index: number) => {
    // N = 8 items
    const val = Animated.modulo(Animated.add(conveyorAnim, index), 8);
    const translateX = val.interpolate({
      inputRange: [0, 1, 2, 6, 7, 8],
      outputRange: [0, -95, -150, 150, 95, 0],
    });
    const scale = val.interpolate({
      inputRange: [0, 1, 2, 6, 7, 8],
      outputRange: [1.0, 0.62, 0.35, 0.35, 0.62, 1.0],
    });
    const opacity = val.interpolate({
      inputRange: [0, 1, 2, 6, 7, 8],
      outputRange: [1, 0.38, 0, 0, 0.38, 1],
    });
    const zIndex = val.interpolate({
      inputRange: [0, 0.5, 1, 1.5, 2, 6, 7, 7.5, 8],
      outputRange: [10, 5, 1, 0, 0, 0, 1, 5, 10],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.carouselItem,
          {
            transform: [{ translateX }, { scale }],
            opacity,
            zIndex,
          },
        ]}
      >
        <Image
          source={PRODUCT_IMAGES[index]}
          style={styles.productImage}
          resizeMode="contain"
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.safe}>
      {/* Top Orange Background Anchor for overscroll */}
      <View style={styles.topOverscrollAnchor} pointerEvents="none" />
      <DynamicStatusBar scrollY={scrollY} />

      {/* ── STICKY HEADER (Fixed at Top, Transitions to White on Scroll) ── */}
      <View style={[styles.stickyHeader, { paddingTop: topPadding }]}>
        {/* Animated White Background Layer */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.whiteHeaderBg,
            { opacity: headerOpacity },
          ]}
        />

        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Base Dark Greeting Text (Visible when scrolled) */}
            <Text style={[styles.greetingTitle, styles.greetingTitleDark]}>
              Hello, Harish! 👋
            </Text>
            {/* White Greeting Text (Smoothly dissolves as you scroll) */}
            <Animated.Text
              style={[
                styles.greetingTitle,
                styles.greetingTitleWhite,
                { opacity: headerOpacityInverse },
              ]}
            >
              Hello, Harish! 👋
            </Animated.Text>
          </View>

          <View style={styles.headerRight}>
            {/* Search icon button */}
            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => navigation.navigate('Rules')}
              activeOpacity={0.85}
            >
              <Feather name="search" size={16} color={Colors.primary} />
            </TouchableOpacity>

            {/* Notification bell button */}
            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => navigation.navigate('Track')}
              activeOpacity={0.85}
            >
              <Feather name="bell" size={16} color={Colors.almostBlack} />
              <View style={styles.redBadgeDot} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* ── ORANGE HERO (Fixed via translateY: heroTranslateY) ───────── */}
        <Animated.View
          style={[
            styles.heroWrapper,
            {
              transform: [{ translateY: heroTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.primary, '#F97316', '#ED6408']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.hero, { paddingTop: topPadding + 48 }]}
          >
            {/* Top-Left Corner Pattern */}
            <View style={styles.topLeftPatternContainer} pointerEvents="none">
              <Image
                source={require('../../assets/pattern.png')}
                style={styles.cornerPatternImg}
                resizeMode="contain"
              />
            </View>

            {/* Bottom-Right Corner Pattern (Mirrored Vertically & Horizontally) */}
            <View style={styles.bottomRightPatternContainer} pointerEvents="none">
              <Image
                source={require('../../assets/pattern.png')}
                style={[styles.cornerPatternImg, styles.mirroredPatternImg]}
                resizeMode="contain"
              />
            </View>

            {/* ── Scanning Carousel ── */}
            <View style={styles.carouselContainer}>
              {/* The 8 looping images */}
              {PRODUCT_IMAGES.map((_, idx) => renderCarouselItem(idx))}

              {/* High-End White Scanner Viewfinder Frame (Scaled ~30% smaller, Crisp SVG Corner Brackets) */}
              <View style={styles.scannerFrame} pointerEvents="none">
                {/* Corner Viewfinder Accents via SVG for razor-sharp precision */}
                <Svg width={110} height={126} viewBox="0 0 110 126" style={StyleSheet.absoluteFill}>
                  {/* Top-Left */}
                  <Path
                    d="M 3,18 L 3,6 A 3 3 0 0 1 6,3 L 18,3"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Top-Right */}
                  <Path
                    d="M 92,3 L 104,3 A 3 3 0 0 1 107,6 L 107,18"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Bottom-Left */}
                  <Path
                    d="M 3,108 L 3,120 A 3 3 0 0 0 6,123 L 18,123"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Bottom-Right */}
                  <Path
                    d="M 92,123 L 104,123 A 3 3 0 0 0 107,120 L 107,108"
                    stroke="#FFFFFF"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>

                {/* Synchronized Laser Scanning Beam Assembly */}
                <Animated.View
                  style={[
                    styles.laserAssembly,
                    {
                      opacity: laserOpacity,
                      transform: [
                        {
                          translateY: laserSweep.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 118],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {/* Holographic glowing scan beam */}
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0)',
                      'rgba(255, 255, 255, 0.28)',
                      'rgba(255, 255, 255, 0)',
                    ]}
                    style={styles.laserBeamGlow}
                  />

                  {/* Intense white laser line with edge beacons */}
                  <View style={styles.laserLine}>
                    <View style={styles.laserEndDot} />
                    <View style={{ flex: 1 }} />
                    <View style={styles.laserEndDot} />
                  </View>
                </Animated.View>
              </View>
            </View>

            {/* Aura Gold Inspired Compact Hero Punchline */}
            <View style={styles.heroSentenceContainer}>
              <Text style={styles.heroSentence}>
                Check any package {'\n'}in{' '}
                <Text style={styles.highlightWord}>1 tap</Text>
              </Text>
            </View>

            {/* Clean White Scan Button (With barcode scan icon, zero drop shadow) */}
            <Animated.View style={{ transform: [{ scale: scanPressAnim }] }}>
              <TouchableOpacity
                style={styles.whiteCompactScanBtn}
                onPressIn={handleScanPressIn}
                onPressOut={handleScanPressOut}
                onPress={() => navigation.navigate('Scanner')}
                activeOpacity={0.88}
              >
                <MaterialCommunityIcons
                  name="barcode-scan"
                  size={21}
                  color={Colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.whiteCompactScanText}>Scan</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* ── WHITE CONTENT SHEET (Overlaps and Scrolls Over Fixed Hero) ── */}
        <View style={styles.sheet}>
          {/* Top Grab Handle / Navigation Bar Indicator */}
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>

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
              {complaints.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Track')}
                  style={styles.linkBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkBtnText}>Track all →</Text>
                </TouchableOpacity>
              )}
            </View>

            {complaints.length === 0 ? (
              <View style={styles.emptyComplaintsBox}>
                <View style={styles.emptyComplaintsIconCircle}>
                  <Feather name="shield" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.emptyComplaintsText}>
                  Your registered complaints will be available here. Currently 0.
                </Text>
                <Text style={styles.emptyComplaintsSub}>
                  When you scan product packaging and file notices for non-compliant declarations, their live status will be tracked here.
                </Text>
              </View>
            ) : (
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
            )}
          </View>

          {/* ── Pending Action (Drafts) - Only shown when pending items exist ── */}
          {pendingScans.length > 0 && (
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
          )}

          {/* ── Enforcement Intelligence Analytics Dashboard ── */}
          <View style={styles.dashboardSection}>
            <View style={styles.dashboardCard}>
              <View style={styles.dashboardHeaderRow}>
                <View style={styles.dashboardHeaderLeft}>
                  <View style={styles.dashboardIconCircle}>
                    <Feather name="bar-chart-2" size={15} color="#0D9488" />
                  </View>
                  <View>
                    <Text style={styles.dashboardBadgeTag}>ENFORCEMENT INTELLIGENCE</Text>
                    <Text style={styles.dashboardTitle}>Compliance Monitoring</Text>
                  </View>
                </View>
                <View style={styles.complianceIndexPill}>
                  <Text style={styles.complianceIndexValue}>{complianceRate}%</Text>
                  <Text style={styles.complianceIndexLabel}>PASSED</Text>
                </View>
              </View>

              <View style={styles.dashboardMetricsGrid}>
                <View style={styles.dashboardMetricItem}>
                  <Text style={styles.dashMetricNum}>{scans.length}</Text>
                  <Text style={styles.dashMetricLabel}>Inspections</Text>
                </View>
                <View style={styles.dashboardMetricDivider} />
                <View style={styles.dashboardMetricItem}>
                  <Text style={[styles.dashMetricNum, { color: Colors.pass }]}>{compliantCount}</Text>
                  <Text style={styles.dashMetricLabel}>Compliant</Text>
                </View>
                <View style={styles.dashboardMetricDivider} />
                <View style={styles.dashboardMetricItem}>
                  <Text style={[styles.dashMetricNum, { color: violationCount > 0 ? Colors.fail : Colors.textPrimary }]}>
                    {violationCount}
                  </Text>
                  <Text style={styles.dashMetricLabel}>Violations</Text>
                </View>
                <View style={styles.dashboardMetricDivider} />
                <View style={styles.dashboardMetricItem}>
                  <Text style={[styles.dashMetricNum, { color: Colors.primary }]}>{complaints.length}</Text>
                  <Text style={styles.dashMetricLabel}>Notices</Text>
                </View>
              </View>

              {/* Statutory Health Progress Bar */}
              <View style={styles.healthBarTrack}>
                <View
                  style={[
                    styles.healthBarFill,
                    {
                      width: `${Math.max(complianceRate, 4)}%`,
                      backgroundColor:
                        complianceRate >= 80 ? Colors.pass : complianceRate >= 50 ? Colors.primary : Colors.fail,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* ── Search & Retrieval Inspection History Repository ── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Inspection Repository</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredScans.length}</Text>
                </View>
              </View>
              {scans.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('Scanner')}>
                  <Text style={styles.scanMoreLink}>+ New Scan</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Input Bar */}
            {scans.length > 0 && (
              <View style={styles.searchBarWrapper}>
                <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search previously scanned commodities..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInputField}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x-circle" size={15} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Status Filter Chips */}
            {scans.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                {(
                  [
                    { id: 'ALL', label: `All (${scans.length})` },
                    { id: 'COMPLIANT', label: `Compliant (${compliantCount})` },
                    { id: 'NON_COMPLIANT', label: `Violations (${violationCount})` },
                    { id: 'NEEDS_REVIEW', label: `Review (${reviewCount})` },
                  ] as const
                ).map((chip) => {
                  const isActive = statusFilter === chip.id;
                  return (
                    <TouchableOpacity
                      key={chip.id}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setStatusFilter(chip.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Repository List or Empty States */}
            {scans.length === 0 ? (
              <View style={styles.emptyComplaintsBox}>
                <View style={styles.emptyComplaintsIconCircle}>
                  <Feather name="package" size={22} color="#94A3B8" />
                </View>
                <Text style={styles.emptyComplaintsText}>No scanned commodities in repository.</Text>
                <Text style={styles.emptyComplaintsSub}>
                  When you scan product packaging labels, their full Legal Metrology compliance records will be archived here.
                </Text>
              </View>
            ) : filteredScans.length === 0 ? (
              <View style={[styles.emptyComplaintsBox, { paddingVertical: 20 }]}>
                <Feather name="search" size={20} color="#94A3B8" style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyComplaintsText, { fontSize: 13 }]}>
                  No commodities found matching "{searchQuery}".
                </Text>
              </View>
            ) : (
              filteredScans.map((item) => {
                const isPass = item.overallStatus === 'COMPLIANT';
                const isFail = item.overallStatus === 'NON_COMPLIANT';
                const statusBadgeBg = isPass ? '#DCFCE7' : isFail ? '#FEE2E2' : '#FEF3C7';
                const statusBadgeText = isPass ? '#15803D' : isFail ? '#B91C1C' : '#B45309';
                const dateText = new Date(item.timestamp).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.repoCard}
                    onPress={() => navigation.navigate('Report', { scan: item })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.repoThumbnailBox}>
                      {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.repoThumbnailImg} resizeMode="cover" />
                      ) : (
                        <Feather name="box" size={20} color="#94A3B8" />
                      )}
                    </View>
                    <View style={styles.repoContentCol}>
                      <View style={styles.repoTopRow}>
                        <Text style={styles.repoIdText}>{item.id}</Text>
                        <Text style={styles.repoDateText}>{dateText}</Text>
                      </View>
                      <Text style={styles.repoTitleText} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.repoCategoryText}>{item.category} Commodity</Text>
                    </View>
                    <View style={styles.repoRightCol}>
                      <View style={[styles.repoScoreBadge, { backgroundColor: statusBadgeBg }]}>
                        <Text style={[styles.repoScoreText, { color: statusBadgeText }]}>{item.score}%</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#94A3B8" style={{ marginTop: 6 }} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── Statutory Legal Metrology Advisory Notice Banner ── */}
          <View style={styles.statutoryNoticeCard}>
            <View style={styles.statutoryBadgeRow}>
              <View style={styles.statutoryIconCircle}>
                <Feather name="file-text" size={16} color={Colors.primary} />
              </View>
              <View style={styles.statutoryBadgeTextCol}>
                <Text style={styles.statutoryBadgeTag}>OFFICIAL STATUTORY NOTICE</Text>
                <Text style={styles.statutoryRuleTitle}>Legal Metrology (Packaged Commodities) Rules, 2011</Text>
              </View>
            </View>

            <Text style={styles.statutoryNoticeParagraph}>
              Under the Legal Metrology Act, 2009, it is mandatory for every pre-packaged commodity in India to display accurate MRP (inclusive of all taxes), Net Quantity, Date of Manufacture, and complete Consumer Care details. Selling above MRP or omitting declarations is a cognizable statutory offence.
            </Text>

            <View style={styles.statutoryHelplineBox}>
              <View style={styles.helplinePhoneRow}>
                <Feather name="phone-call" size={13} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.helplinePhoneText}>National Consumer Helpline: 1915</Text>
              </View>
              <Text style={styles.helplinePortalText}>consumerhelpline.gov.in</Text>
            </View>
          </View>

        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  topOverscrollAnchor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: Colors.primary,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  whiteHeaderBg: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 13, 18, 0.08)',
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  heroWrapper: {
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // ── Hero ──────────────────────────────────────────────
  hero: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 70,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  topLeftPatternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 320,
    height: 320,
    zIndex: 0,
  },
  bottomRightPatternContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 320,
    height: 320,
    zIndex: 0,
  },
  cornerPatternImg: {
    width: '100%',
    height: '100%',
    opacity: 0.16,
  },
  mirroredPatternImg: {
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },

  // Header row
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeft: {
    justifyContent: 'center',
    position: 'relative',
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  greetingTitleDark: {
    color: Colors.textPrimary,
  },
  greetingTitleWhite: {
    color: '#FFFFFF',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  redBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Hero Sentence Container (~50-60% width, Aura Gold inspiration)
  heroSentenceContainer: {
    width: '70%',
    maxWidth: 270,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 28,
  },
  heroSentence: {
    fontSize: 27,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 33,
  },
  highlightWord: {
    color: '#fff314ff', // Electric Sky Cyan - high contrast pop against Orange
    fontWeight: '900',
  },

  // Pure White Scan Button (Zero drop shadows, clean white pill with scan icon)
  whiteCompactScanBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  whiteCompactScanText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.2,
  },

  // ── Carousel Scanning (Scaled ~30% smaller) ─────────────────────────
  carouselContainer: {
    height: 145,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 6,
    marginBottom: 20,
    overflow: 'hidden',
  },
  carouselItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: 82,
    height: 82,
  },
  scannerFrame: {
    position: 'absolute',
    width: 110,
    height: 126,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  laserAssembly: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    alignItems: 'center',
  },
  laserBeamGlow: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    height: 26,
  },
  laserLine: {
    width: '100%',
    height: 2.2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  laserEndDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },

  // ── Grab Handle / Navigation Bar Indicator ──────────
  handleBarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handleBar: {
    width: 70,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 18, 0.06)',
    shadowColor: '#0D0D12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },

  // ── White sheet overlapping hero ──────────────────────
  sheet: {
    backgroundColor: Colors.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -26,
    paddingTop: 4,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    minHeight: 1000,
  },

  // Quick stats (Apple Liquid Glass - Zero Drop Shadow)
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 22,
    paddingVertical: Spacing.md + 2,
    marginBottom: Spacing.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
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

  // Horizontal cards (Liquid Glass - Zero Drop Shadow)
  horizontalScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  horizontalCard: {
    width: 220,
    borderRadius: 22,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },

  // Pending cards (Liquid Glass - Zero Drop Shadow)
  pendingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
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

  // ── Empty Registered Complaints State ──
  emptyComplaintsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  emptyComplaintsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyComplaintsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyComplaintsSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },

  // ── Official Statutory Advisory Notice Card ──
  statutoryNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statutoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statutoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(252, 146, 68, 0.3)',
  },
  statutoryBadgeTextCol: {
    flex: 1,
  },
  statutoryBadgeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statutoryRuleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  statutoryNoticeParagraph: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  statutoryHelplineBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helplinePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  helplinePhoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  helplinePortalText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 19,
  },

  // ── Enforcement Intelligence Analytics Dashboard ──
  dashboardSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  dashboardCard: {
    backgroundColor: '#0F172A',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  dashboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dashboardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dashboardBadgeTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2DD4BF',
    letterSpacing: 0.6,
  },
  dashboardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  complianceIndexPill: {
    alignItems: 'flex-end',
  },
  complianceIndexValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2DD4BF',
  },
  complianceIndexLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dashboardMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  dashboardMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  dashMetricNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dashMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  dashboardMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  healthBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Search & Filter Repository ──
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  searchInputField: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: Spacing.sm,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Repository Item Card ──
  repoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.soft,
  },
  repoThumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  repoThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  repoContentCol: {
    flex: 1,
  },
  repoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  repoIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  repoDateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  repoTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  repoCategoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  repoRightCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  repoScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  repoScoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
