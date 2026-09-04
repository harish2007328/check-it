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
import { MOCK_SCANS, MOCK_COMPLAINTS } from '../data/mockScans';
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
  const [scans, setScans] = useState<ScanResult[]>(MOCK_SCANS);
  const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);

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

    return () => scannerLoop.stop();
  }, []);

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
    } catch { }
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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
});
