import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radii, Typography, Shadows } from '../theme/colors';
import { simulateScan } from '../data/mockScans';

export default function ScannerScreen({ navigation }: any) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Align product label within the frame to verify MRP and Net Quantity.');
  const [flashOn, setFlashOn] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  const startProcessing = async (uri: string) => {
    setScanning(true);
    setStatus('Reading label text...');

    await new Promise((r) => setTimeout(r, 900));
    setStatus('Extracting mandatory declarations...');
    await new Promise((r) => setTimeout(r, 900));
    setStatus('Checking Legal Metrology Rules (2026.3)...');

    const result = await simulateScan(uri);
    try {
      const stored = await AsyncStorage.getItem('scans');
      const existing = stored ? JSON.parse(stored) : [];
      await AsyncStorage.setItem('scans', JSON.stringify([result, ...existing]));
    } catch {}
    setScanning(false);
    navigation.navigate('Report', { scan: result });
  };

  const handleGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      startProcessing(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      startProcessing(result.assets[0].uri);
    }
  };

  const handleDemoScan = () => {
    startProcessing('demo://packaged-commodity');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.almostBlack} />

      <View style={styles.viewfinder}>
        {/* ── Top Bar ────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.topBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.topBadgeText}>AI OCR ACTIVE</Text>
          </View>

          <TouchableOpacity
            style={[styles.navCircleBtn, flashOn && styles.navCircleBtnActive]}
            onPress={() => setFlashOn(!flashOn)}
            activeOpacity={0.8}
          >
            <Feather
              name={flashOn ? 'zap' : 'zap-off'}
              size={18}
              color={flashOn ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* ── Center Scanning Frame ───────────────────────────── */}
        <View style={styles.frameCenterArea}>
          <Animated.View style={[styles.frameWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.scanFrame}>
              {/* Faded Orange Corner Brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {scanning ? (
                <ScanLine />
              ) : (
                <View style={styles.framePlaceholder}>
                  <MaterialCommunityIcons
                    name="barcode-scan"
                    size={42}
                    color="rgba(252, 146, 68, 0.75)"
                  />
                  <Text style={styles.framePlaceholderLabel}>Align Label Declarations</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* ── Bottom Liquid Glass Control Sheet ──────────────── */}
        <View style={styles.bottomSheet}>
          <View style={styles.handleBar} />

          <Text style={styles.statusInstruction}>{status}</Text>

          {scanning ? (
            <View style={styles.processingArea}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.processingTitle}>Evaluating Compliance</Text>
              <Text style={styles.processingSub}>Cross-referencing 12 statutory clauses...</Text>
            </View>
          ) : (
            <View style={styles.controlsRow}>
              {/* Gallery button */}
              <TouchableOpacity style={styles.sideBtn} onPress={handleGallery} activeOpacity={0.8}>
                <View style={styles.sideBtnIconCircle}>
                  <Feather name="image" size={20} color={Colors.white} />
                </View>
                <Text style={styles.sideBtnLabel}>Gallery</Text>
              </TouchableOpacity>

              {/* Center Shutter button */}
              <TouchableOpacity style={styles.shutterBtn} onPress={handleCamera} activeOpacity={0.85}>
                <View style={styles.shutterOuter}>
                  <View style={styles.shutterInner} />
                </View>
              </TouchableOpacity>

              {/* Demo button */}
              <TouchableOpacity style={styles.sideBtn} onPress={handleDemoScan} activeOpacity={0.8}>
                <View style={[styles.sideBtnIconCircle, { backgroundColor: 'rgba(252, 146, 68, 0.25)' }]}>
                  <Feather name="play" size={18} color={Colors.primary} />
                </View>
                <Text style={[styles.sideBtnLabel, { color: Colors.primary }]}>Demo Scan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 230, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(anim, { toValue: 0, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY: anim }] }]} />
  );
}

const CORNER_SIZE = 26;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.almostBlack,
  },
  viewfinder: {
    flex: 1,
    backgroundColor: Colors.almostBlack,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  navCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  navCircleBtnActive: {
    backgroundColor: 'rgba(252, 146, 68, 0.25)',
    borderColor: Colors.primary,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.pass,
    marginRight: 6,
  },
  topBadgeText: {
    ...Typography.labelCaps,
    color: Colors.white,
    fontSize: 10,
  },
  frameCenterArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  frameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 270,
    height: 270,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  framePlaceholder: {
    alignItems: 'center',
  },
  framePlaceholderLabel: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 8,
  },
  bottomSheet: {
    backgroundColor: Colors.almostBlackLight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Shadows.glassIsland,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  statusInstruction: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontSize: 13,
    lineHeight: 18,
  },
  processingArea: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  processingTitle: {
    ...Typography.title,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  processingSub: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Spacing.xs,
  },
  sideBtn: {
    alignItems: 'center',
    width: 72,
  },
  sideBtnIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sideBtnLabel: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  shutterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary,
    ...Shadows.glowOrange,
  },
});
