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

// ── Modern Record Card (Inspired by Image 2) ──
function InspectionRecordCard({
  title,
  subtitle,
  category,
  date,
  status,
  statusLabel,
  score,
  rulesPassed,
  totalRules,
  imageUri,
  severity,
  onPress,
}: {
  title: string;
  subtitle?: string;
  category: string;
  date: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW' | 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED';
  statusLabel?: string;
  score?: number;
  rulesPassed?: number;
  totalRules?: number;
  imageUri?: string;
  severity?: string;
  onPress: () => void;
}) {
  const isNonCompliant = status === 'NON_COMPLIANT';
  const isCompliant = status === 'COMPLIANT' || status === 'RESOLVED';
  const isReview = status === 'NEEDS_REVIEW';

  let dotColor = '#12B76A';
  let badgeBg = '#ECFDF3';
  let textColor = '#027A48';
  let label = statusLabel || 'Compliant';

  if (isNonCompliant) {
    dotColor = '#F04438';
    badgeBg = '#FEF3F2';
    textColor = '#B42318';
    label = statusLabel || 'Action Required';
  } else if (isReview) {
    dotColor = '#F79009';
    badgeBg = '#FFFAEB';
    textColor = '#B54708';
    label = statusLabel || 'Needs Review';
  } else if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') {
    dotColor = '#2E90FA';
    badgeBg = '#EFF8FF';
    textColor = '#175CD3';
    label = statusLabel || 'Notice Filed';
  }

  const priorityText =
    severity || (isNonCompliant ? 'High' : isReview ? 'Medium' : 'Low');

  const passed = rulesPassed ?? (isCompliant ? 12 : isNonCompliant ? 7 : 9);
  const total = totalRules ?? 12;

  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.modernCard}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Top row: Folder icon & Status dot pill */}
      <View style={styles.modernCardTopRow}>
        <View style={styles.modernCardFolderBox}>
          <Feather name="folder" size={15} color="#475467" />
        </View>
        <View style={[styles.modernStatusPill, { backgroundColor: badgeBg }]}>
          <View style={[styles.modernStatusDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.modernStatusText, { color: textColor }]}>{label}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.modernCardTitle} numberOfLines={1}>
        {title}
      </Text>

      {/* Subtitle description */}
      {subtitle ? (
        <Text style={styles.modernCardSub} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}

      {/* Sub-row 1: Category / Item */}
      <View style={styles.modernMetaRow}>
        <Feather name="tag" size={12} color="#667085" style={{ marginRight: 5 }} />
        <Text style={styles.modernMetaText} numberOfLines={1}>
          {category} • Packaged Commodity
        </Text>
      </View>

      {/* Sub-row 2: Date & Priority */}
      <View style={styles.modernMetaRowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="flag" size={12} color="#667085" style={{ marginRight: 5 }} />
          <Text style={styles.modernMetaText}>{date}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="bar-chart-2" size={12} color="#344054" style={{ marginRight: 4 }} />
          <Text style={styles.modernPriorityText}>{priorityText}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.modernDivider} />

      {/* Bottom Progress Row: Score, Rules & Product Thumbnail */}
      <View style={styles.modernProgressRow}>
        <View style={styles.modernProgressLeft}>
          {score !== undefined ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              <View
                style={[
                  styles.scoreMiniDot,
                  { backgroundColor: isCompliant ? '#12B76A' : isNonCompliant ? '#F04438' : '#F79009' },
                ]}
              />
              <Text style={styles.modernScoreText}>{score}%</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="check-square" size={12} color="#667085" style={{ marginRight: 4 }} />
            <Text style={styles.modernRulesText}>
              {passed}/{total} Rules
            </Text>
          </View>
        </View>

        {/* Thumbnail on Bottom Right */}
        <View style={styles.modernCardThumbWrap}>
          {imageUri && !imgError ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.modernCardThumbImg}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={styles.modernCardThumbPlaceholder}>
              <Feather name="package" size={16} color="#98A2B3" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Modern Pastel Guide Card (Inspired by Image 1) ──
function PastelGuideCard({
  title,
  subtitle,
  bgColor,
  tags,
  onPress,
}: {
  title: string;
  subtitle: string;
  bgColor: string;
  tags: string[];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.pastelCard}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[styles.pastelCardTop, { backgroundColor: bgColor }]}>
        <Text style={styles.pastelCardTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.pastelCardSub} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={styles.pastelPillsRow}>
          {tags.map((tag, idx) => (
            <View key={idx} style={styles.pastelPill}>
              <Text style={styles.pastelPillText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.pastelCardBottom}>
        <Text style={styles.pastelExploreText}>Explore</Text>
        <View style={styles.pastelArrowBtn}>
          <Feather name="arrow-right" size={13} color="#101828" />
        </View>
      </View>
    </TouchableOpacity>
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

  const compliantCount = scans.filter((s) => s.overallStatus === 'COMPLIANT').length;
  const violationCount = scans.filter((s) => s.overallStatus === 'NON_COMPLIANT').length;
  const reviewCount = scans.filter((s) => s.overallStatus === 'NEEDS_REVIEW').length;

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

  const recentScans = scans.slice(0, 4);

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

          {/* ── Quick Stats Row ── */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
              <Text style={styles.statNum}>{scans.length}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
              <Text style={[styles.statNum, { color: Colors.pass }]}>{compliantCount}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
              <Text style={[styles.statNum, violationCount > 0 && { color: Colors.fail }]}>{violationCount}</Text>
              <Text style={styles.statLabel}>Flagged</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Track')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNum, { color: Colors.primary }]}>{complaints.length}</Text>
              <Text style={styles.statLabel}>Notices</Text>
            </TouchableOpacity>
          </View>

          {/* ── Pending Action (Needs Action - Image 2 Record Card Style) ── */}
          {pendingScans.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="alert-circle" size={14} color={Colors.fail} />
                  </View>
                  <Text style={styles.sectionTitle}>Needs Action</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.countBadgeText, { color: Colors.fail }]}>
                      {pendingScans.length}
                    </Text>
                  </View>
                </View>
              </View>

              {pendingScans.slice(0, 3).map((scan) => {
                const dateStr = new Date(scan.timestamp).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const violationSummary =
                  scan.observations && scan.observations.length > 0
                    ? scan.observations[0]
                    : 'Mandatory statutory declaration missing under Rule 6';
                const passCount = scan.fields.filter((f) => f.status === 'PASS').length;

                return (
                  <InspectionRecordCard
                    key={scan.id}
                    title={scan.productName}
                    subtitle={violationSummary}
                    category={scan.category}
                    date={dateStr}
                    status={scan.overallStatus}
                    statusLabel={scan.overallStatus === 'NON_COMPLIANT' ? 'Non-Compliant' : 'Needs Review'}
                    score={scan.score}
                    rulesPassed={passCount}
                    totalRules={scan.fields.length || 12}
                    imageUri={scan.imageUri || (scan.images && scan.images[0])}
                    severity={scan.overallStatus === 'NON_COMPLIANT' ? 'High' : 'Medium'}
                    onPress={() => navigation.navigate('Report', { scan })}
                  />
                );
              })}

              {pendingScans.length > 3 && (
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => navigation.navigate('Scanner')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>
                    View all {pendingScans.length} pending items
                  </Text>
                  <Feather name="chevron-right" size={14} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Registered Complaints (Image 2 Record Card Style) ── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#EFF8FF' }]}>
                  <Feather name="shield" size={14} color="#175CD3" />
                </View>
                <Text style={styles.sectionTitle}>Filed Complaints</Text>
                <View style={[styles.countBadge, { backgroundColor: '#EFF8FF' }]}>
                  <Text style={[styles.countBadgeText, { color: '#175CD3' }]}>{complaints.length}</Text>
                </View>
              </View>
              {complaints.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Track')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkBtnText}>Track →</Text>
                </TouchableOpacity>
              )}
            </View>

            {complaints.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="shield" size={20} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No complaints filed yet</Text>
                <Text style={styles.emptySub}>
                  Scan a package and file a statutory notice if violations are found.
                </Text>
              </View>
            ) : (
              complaints.slice(0, 3).map((item) => {
                const dateStr = new Date(item.filedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const summary =
                  item.violations && item.violations.length > 0
                    ? `Contraventions: ${item.violations.join(', ')}`
                    : 'Statutory complaint submitted to enforcement jurisdiction';

                return (
                  <InspectionRecordCard
                    key={item.id}
                    title={item.productName}
                    subtitle={summary}
                    category={item.category}
                    date={dateStr}
                    status={item.status as any}
                    statusLabel={item.status.replace('_', ' ')}
                    severity={item.severity}
                    imageUri={
                      item.imageUri ||
                      scans.find((s) => s.id === item.scanId)?.imageUri ||
                      scans.find((s) => s.id === item.scanId)?.images?.[0]
                    }
                    onPress={() => navigation.navigate('Track', { complaint: item })}
                  />
                );
              })
            )}
          </View>

          {/* ── Recent Scans (Latest 4 - Image 2 Record Card Style) ── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#ECFDF3' }]}>
                  <Feather name="clock" size={14} color="#0D9488" />
                </View>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
              </View>
              {scans.length > 4 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Scanner')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkBtnText}>See All →</Text>
                </TouchableOpacity>
              )}
            </View>

            {scans.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="package" size={20} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No scans yet</Text>
                <Text style={styles.emptySub}>
                  Tap the Scan button above to inspect and verify packaging declarations.
                </Text>
              </View>
            ) : (
              recentScans.map((item) => {
                const dateStr = new Date(item.timestamp).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const isCompliant = item.overallStatus === 'COMPLIANT';
                const summary = isCompliant
                  ? 'All mandatory Rule 6 declarations verified'
                  : item.observations?.[0] || 'Statutory review indicated for packaging';
                const passCount = item.fields.filter((f) => f.status === 'PASS').length;

                return (
                  <InspectionRecordCard
                    key={item.id}
                    title={item.productName}
                    subtitle={summary}
                    category={item.category}
                    date={dateStr}
                    status={item.overallStatus}
                    statusLabel={isCompliant ? 'Compliant' : 'Needs Review'}
                    score={item.score}
                    rulesPassed={passCount}
                    totalRules={item.fields.length || 12}
                    imageUri={item.imageUri || (item.images && item.images[0])}
                    onPress={() => navigation.navigate('Report', { scan: item })}
                  />
                );
              })
            )}
          </View>

          {/* ── Statutory Standards & Guidelines (2x2 Grid - Image 1 Pastel Style) ── */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Feather name="book-open" size={14} color="#7C3AED" />
                </View>
                <Text style={styles.sectionTitle}>Standards & Guidelines</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Rules')}
                activeOpacity={0.7}
              >
                <Text style={styles.linkBtnText}>All Rules →</Text>
              </TouchableOpacity>
            </View>

            {/* 2x2 Grid Layout */}
            <View style={styles.pastelGridRow}>
              <PastelGuideCard
                title="Declarations"
                subtitle="Rule 6 mandatory packaging labels"
                bgColor="#E8F4FD"
                tags={['MRP', 'Mfg Date', 'Net Qty', 'Origin']}
                onPress={() => navigation.navigate('Rules')}
              />
              <PastelGuideCard
                title="Font Scale"
                subtitle="Rule 9 minimum numeral heights"
                bgColor="#FFEADA"
                tags={['< 50cm²', '100-500cm²', 'Rule 13']}
                onPress={() => navigation.navigate('Rules')}
              />
            </View>

            <View style={styles.pastelGridRow}>
              <PastelGuideCard
                title="Enforcement"
                subtitle="Statutory notice & offences"
                bgColor="#EFEAFF"
                tags={['Section 18', 'Section 36', 'Notice']}
                onPress={() => navigation.navigate('Rules')}
              />
              <PastelGuideCard
                title="Helpline 1915"
                subtitle="National Grievance & INGRAM"
                bgColor="#E0F8EE"
                tags={['Toll Free', 'e-Daakhil', 'Support']}
                onPress={() => navigation.navigate('Rules')}
              />
            </View>
          </View>

          {/* Helpline pill */}
          <View style={styles.helplinePill}>
            <Feather name="phone-call" size={12} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.helplineText}>
              Consumer Helpline: 1915 • National Consumer Grievance Portal
            </Text>
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

  // Hero Sentence Container
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
    color: '#fff314ff',
    fontWeight: '900',
  },

  // Pure White Scan Button
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

  // ── Carousel Scanning ─────────────────────────
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

  // ── Grab Handle ──────────
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -26,
    paddingTop: 4,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    minHeight: 800,
  },

  // ── Quick Stats Row ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#EAECF0',
    ...Shadows.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '55%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // ── Sections ──
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.failBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
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
  linkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Status Dot ──
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  // ── Score Pill ──
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // ── Modern Record Cards (Image 2 Style) ──
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    ...Shadows.soft,
  },
  modernCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernCardFolderBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  modernStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modernCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    marginTop: 10,
    letterSpacing: -0.2,
  },
  modernCardSub: {
    fontSize: 13,
    color: '#475467',
    marginTop: 2,
    lineHeight: 17,
  },
  modernMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modernMetaRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  modernMetaText: {
    fontSize: 12,
    color: '#475467',
  },
  modernPriorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344054',
  },
  modernDivider: {
    height: 1,
    backgroundColor: '#F2F4F7',
    marginVertical: 12,
  },
  modernProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreMiniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  modernScoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#101828',
  },
  modernRulesText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475467',
  },
  modernCardThumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAECF0',
    backgroundColor: '#F8FAFC',
  },
  modernCardThumbImg: {
    width: '100%',
    height: '100%',
  },
  modernCardThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
  },

  // ── Modern Pastel Guide Cards (Image 1 Style) ──
  pastelGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pastelCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  pastelCardTop: {
    padding: 14,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  pastelCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101828',
    letterSpacing: -0.2,
  },
  pastelCardSub: {
    fontSize: 11,
    color: '#475467',
    marginTop: 3,
    lineHeight: 15,
  },
  pastelPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  pastelPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  pastelPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
  },
  pastelCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  pastelExploreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#101828',
  },
  pastelArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty States ──
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 8,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 240,
  },

  // ── Helpline Pill ──
  helplinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  helplineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
