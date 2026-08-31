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
  ImageBackground,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { MOCK_SCANS } from '../data/mockScans';
import { ScanResult } from '../types';
import ScanCard from '../components/ScanCard';

export default function HomeScreen({ navigation }: any) {
  const scanPressAnim = useRef(new Animated.Value(1)).current;
  const [scans, setScans] = useState<ScanResult[]>(MOCK_SCANS);

  useEffect(() => {
    loadSavedScans();
  }, []);

  const loadSavedScans = async () => {
    try {
      const stored = await AsyncStorage.getItem('scans');
      if (stored) {
        const parsed: ScanResult[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setScans([...parsed, ...MOCK_SCANS]);
        }
      }
    } catch {}
  };

  const handleScanPressIn = () =>
    Animated.spring(scanPressAnim, { toValue: 0.95, useNativeDriver: Platform.OS !== 'web' }).start();
  const handleScanPressOut = () =>
    Animated.spring(scanPressAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();

  const totalToday = 28;
  const complianceRate = 94;
  const violationCount = 3;
  const reviewCount = 2;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Top App Header ────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.userName}>Inspector Sharma</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate('Rules')}
              activeOpacity={0.8}
            >
              <Feather name="search" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate('Track')}
              activeOpacity={0.8}
            >
              <Feather name="bell" size={18} color={Colors.textPrimary} />
              <View style={styles.unreadDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero Liquid Banner (Flush top, curved bottom corners) ── */}
        <View style={styles.heroBannerContainer}>
          <ImageBackground
            source={require('../../assets/hero_banner_scanner.jpg')}
            style={styles.heroBannerBackground}
            imageStyle={styles.heroBannerImage}
            resizeMode="cover"
          >
            {/* Liquid glass light scrim overlay to ensure left text readability */}
            <LinearGradient
              colors={[
                'rgba(247, 250, 252, 0.94)',
                'rgba(247, 250, 252, 0.78)',
                'rgba(247, 250, 252, 0.2)',
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.heroGradientOverlay}
            >
              <View style={styles.heroContentLeft}>
                <View style={styles.liveTagPill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>AI LEGAL METROLOGY</Text>
                </View>

                <Text style={styles.heroHeadline}>
                  Verify Packaged{'\n'}Commodities
                </Text>

                <Text style={styles.heroSubtext}>
                  Instant compliance check for MRP, Net Qty & Expiry.
                </Text>

                <Animated.View style={{ transform: [{ scale: scanPressAnim }] }}>
                  <TouchableOpacity
                    style={styles.liquidCtaButton}
                    onPressIn={handleScanPressIn}
                    onPressOut={handleScanPressOut}
                    onPress={() => navigation.navigate('Scanner')}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#FC9244', '#FF7A1A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.liquidCtaGradient}
                    >
                      <View style={styles.specularTopLight} />
                      <MaterialCommunityIcons
                        name="barcode-scan"
                        size={17}
                        color={Colors.white}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.liquidCtaText}>Scan Label</Text>
                      <Feather
                        name="arrow-right"
                        size={15}
                        color={Colors.white}
                        style={{ marginLeft: 6 }}
                      />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* ── Overview Metrics Grid (Clean 2x2 Pastel Cards) ────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.seeDetails}>Profile Stats</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          {/* Card 1: Today's Total Scans */}
          <View style={[styles.metricCard, { backgroundColor: Colors.porcelain }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Scans Today</Text>
              <View style={[styles.metricIconWrap, { backgroundColor: Colors.white }]}>
                <Feather name="camera" size={14} color={Colors.textPrimary} />
              </View>
            </View>
            <View style={styles.metricBottom}>
              <Text style={styles.metricNumber}>{totalToday}</Text>
              <Text style={styles.metricUnit}>units</Text>
            </View>
          </View>

          {/* Card 2: Compliance Rate */}
          <View style={[styles.metricCard, { backgroundColor: Colors.passBg }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Compliance</Text>
              <View style={[styles.metricIconWrap, { backgroundColor: Colors.white }]}>
                <Feather name="check-circle" size={14} color={Colors.pass} />
              </View>
            </View>
            <View style={styles.metricBottom}>
              <Text style={[styles.metricNumber, { color: Colors.pass }]}>{complianceRate}%</Text>
              <Text style={[styles.metricUnit, { color: Colors.pass }]}>pass</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          {/* Card 3: Violations Flagged */}
          <View style={[styles.metricCard, { backgroundColor: Colors.failBg }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Violations</Text>
              <View style={[styles.metricIconWrap, { backgroundColor: Colors.white }]}>
                <Feather name="alert-circle" size={14} color={Colors.fail} />
              </View>
            </View>
            <View style={styles.metricBottom}>
              <Text style={[styles.metricNumber, { color: Colors.fail }]}>{violationCount}</Text>
              <Text style={[styles.metricUnit, { color: Colors.fail }]}>flagged</Text>
            </View>
          </View>

          {/* Card 4: Needs Review */}
          <View style={[styles.metricCard, { backgroundColor: Colors.reviewBg }]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>Review Needed</Text>
              <View style={[styles.metricIconWrap, { backgroundColor: Colors.white }]}>
                <Feather name="clock" size={14} color={Colors.review} />
              </View>
            </View>
            <View style={styles.metricBottom}>
              <Text style={[styles.metricNumber, { color: Colors.review }]}>{reviewCount}</Text>
              <Text style={[styles.metricUnit, { color: Colors.review }]}>pending</Text>
            </View>
          </View>
        </View>

        {/* ── Recent Inspections ────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Inspections</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Rules')}>
              <Text style={styles.seeDetails}>Standards</Text>
            </TouchableOpacity>
          </View>

          {scans.slice(0, 3).map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onPress={() => navigation.navigate('Report', { scan })}
            />
          ))}
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
    paddingBottom: 110, // Breathing space for floating bottom island
  },

  // ── Header ──────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },

  // ── Hero Banner ─────────────────────────────────────
  heroBannerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Shadows.soft,
  },
  heroBannerBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heroBannerImage: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGradientOverlay: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  heroContentLeft: {
    maxWidth: '68%',
  },
  liveTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 18, 0.05)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 5,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  heroSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },

  // ── Liquid Glass CTA Button ──────────────────────────
  liquidCtaButton: {
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    ...Shadows.glowOrange,
  },
  liquidCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  specularTopLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  liquidCtaText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: -0.2,
  },

  // ── Section ──────────────────────────────────────────
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeDetails: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },

  // ── Metrics 2x2 Grid ─────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 18, 0.04)',
    ...Shadows.soft,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  metricIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  metricBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textMuted,
    marginLeft: 4,
  },
});
