import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Linking,
  Image,
  ScrollView,
  Dimensions,
  Easing,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radii, Typography, Shadows } from '../theme/colors';
import { processOnDeviceOcr } from '../utils/onDeviceOcr';
import { isGroqConfigured } from '../services/groqService';
import { saveScan } from '../utils/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Target 4:5 aspect ratio with enlarged framing dimensions
const CAM_MAX_W = Math.min(Math.round(SCREEN_WIDTH * 0.92), 360);
const CAM_MAX_H = Math.min(Math.round(CAM_MAX_W * 1.25), Math.round(SCREEN_HEIGHT * 0.46));
const CAMERA_WIDTH = Math.round(CAM_MAX_H / 1.25);
const CAMERA_HEIGHT = CAM_MAX_H;

export default function ScannerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [panels, setPanels] = useState<string[]>([]);
  const [status, setStatus] = useState('Position the packaged commodity label inside the 4:5 frame.');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const trayAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosing = useRef(false);
  const groqActive = isGroqConfigured();

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top;
  const topPadding = statusBarHeight + 10;

  // Auto-request permission on screen mount if not yet requested
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Smooth slide-up presentation animation from bottom to position on open
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 24,
      mass: 0.9,
      stiffness: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  // Smooth slide-down animation on exit
  const handleGoBack = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 260,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      navigation.goBack();
    });
  };

  // Intercept Android hardware back button and gesture shortcuts to play smooth slide down
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleGoBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 1200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  // Smooth slide and fade animation for separate captured photo tray
  useEffect(() => {
    if (panels.length > 0) {
      Animated.spring(trayAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(trayAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [panels.length]);

  const runInspection = async (targetPanels: string[]) => {
    if (targetPanels.length === 0) return;
    setScanning(true);
    setStatus(`Extracting text across ${targetPanels.length} captured packaging angle(s)...`);

    try {
      const { scanResult } = await processOnDeviceOcr(targetPanels, (stepMsg) => {
        setStatus(stepMsg);
      });

      // Save to Supabase and local inspection history
      try {
        await saveScan(scanResult);
      } catch (err) {
        console.warn('Could not save scan to Supabase/cache:', err);
      }

      setScanning(false);
      setPanels([]);
      setStatus('Position packaged commodity label inside the frame. Snap multiple angles if needed.');

      // Directly transition to the official white inspection report page
      navigation.navigate('Report', { scan: scanResult });
    } catch (err) {
      console.warn('Scan verification error:', err);
      Alert.alert(
        'Inspection Incomplete',
        'Could not clearly detect statutory declarations across the captured angles. Please ensure labels are well lit, in focus, and try again.'
      );
      setStatus('Position packaged commodity label inside the frame. Snap multiple angles if needed.');
      setScanning(false);
    }
  };

  const handleGallery = async () => {
    if (scanning) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.90,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      const updated = [...panels, ...newUris];
      setPanels(updated);
      setStatus(
        `${updated.length} angle(s) in tray. Snap more angles or tap "Inspect Product" below.`
      );
    }
  };

  // Snaps a photo and adds it to the tray (allowing user to photograph multiple sides)
  const handleSnapAngle = async () => {
    if (scanning) return;

    let capturedUri: string | null = null;
    if (cameraRef.current && permission?.granted) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.90,
          skipProcessing: true,
          shutterSound: false,
        });
        if (photo?.uri) {
          capturedUri = photo.uri;
        }
      } catch (err) {
        console.warn('Camera capture error, falling back to picker:', err);
      }
    }

    if (!capturedUri) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access to photograph packaging.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant', onPress: () => requestPermission() },
          ]
        );
        return;
      }
      try {
        const result = await ImagePicker.launchCameraAsync({ quality: 0.90 });
        if (!result.canceled && result.assets[0]?.uri) {
          capturedUri = result.assets[0].uri;
        }
      } catch (e) {
        console.warn('ImagePicker camera error:', e);
      }
    }

    if (capturedUri) {
      const updated = [...panels, capturedUri];
      setPanels(updated);
    }
  };

  return (
    <Animated.View
      style={[
        styles.safe,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={true} />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.topBarActions}>
          {permission?.granted && (
            <TouchableOpacity
              style={[styles.navCircleBtn, flashOn && styles.navCircleBtnActive]}
              onPress={() => setFlashOn(!flashOn)}
              activeOpacity={0.8}
            >
              <Feather
                name={flashOn ? 'zap' : 'zap-off'}
                size={18}
                color={flashOn ? Colors.primary : '#0F172A'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Camera Viewport: Positioned Upward with Bigger Size ── */}
      <View style={styles.cameraViewportArea}>
        {/* Prominent 3-Word Sentence */}
        <Text style={styles.frameTopTitle}>Scan the package</Text>

        {!permission?.granted ? (
          /* ── Permission Request Card ── */
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Feather name="camera" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionBody}>
              Check-It needs access to your camera to scan product packaging and verify declarations.
            </Text>

            <TouchableOpacity
              style={styles.permissionPrimaryBtn}
              onPress={() => {
                if (permission && !permission.canAskAgain) {
                  Linking.openSettings();
                } else {
                  requestPermission();
                }
              }}
              activeOpacity={0.85}
            >
              <Feather
                name={permission && !permission.canAskAgain ? 'settings' : 'check-circle'}
                size={18}
                color={Colors.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.permissionPrimaryBtnText}>
                {permission && !permission.canAskAgain ? 'Open System Settings' : 'Grant Camera Access'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.permissionFallbackBtn}
              onPress={handleGallery}
              activeOpacity={0.8}
            >
              <Feather name="image" size={15} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.permissionFallbackText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── 4:5 Fixed Aspect Ratio Camera Container (Bigger, No Glitch) ── */
          <View style={styles.cameraAspectBox}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={flashOn}
              animateShutter={false}
            />

            {/* Bigger Precision Centered Targeting Frame */}
            <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
              {/* 4 Precision Corner Brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {scanning ? (
                <ScanLine />
              ) : (
                <View style={styles.framePlaceholder}>
                  <Feather
                    name="box"
                    size={48}
                    color="rgba(255, 255, 255, 0.45)"
                  />
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* ── Grayed-out Hint with Info Icon (Visible only in initial empty state) ── */}
        {panels.length === 0 && (
          <View style={styles.frameHintRow}>
            <Feather name="info" size={13} color="#94A3B8" style={styles.frameHintIcon} />
            <Text style={styles.frameHintText}>
              Take 3 or more photos of the package to get a clear output
            </Text>
          </View>
        )}
      </View>

      {/* ── Bottom Section: Integrated Orange Tray + Controls Sheet ── */}
      <View style={styles.bottomSectionContainer} pointerEvents="box-none">
        {/* Vibrant Orange Tray (No Drop Shadow, Wider, Attached to Bottom Controls) */}
        {panels.length > 0 && (
          <Animated.View
            style={[
              styles.orangeTray,
              {
                opacity: trayAnim,
                transform: [
                  {
                    translateY: trayAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.trayHeader}>
              <View style={styles.trayTitleContainer}>
                <Feather name="layers" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.trayTitle}>
                  {panels.length} {panels.length === 1 ? 'Photo Captured' : 'Photos Captured'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.trayClearBtn}
                onPress={() => setPanels([])}
                activeOpacity={0.75}
              >
                <Feather name="trash-2" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.trayClearText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trayScrollView}
              contentContainerStyle={styles.trayScroll}
            >
              {panels.map((uri, idx) => (
                <View key={idx} style={styles.panelThumbBox}>
                  <Image source={{ uri }} style={styles.panelThumbImg} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.panelDeleteBtn}
                    onPress={() => setPanels(panels.filter((_, i) => i !== idx))}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Bottom Controls Sheet */}
        <View style={styles.bottomSheet}>
        {scanning ? (
          <View style={styles.processingArea}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.processingTitle}>Verifying...</Text>
            <Text style={styles.processingSub}>{status}</Text>
          </View>
        ) : (
          <View style={styles.controlsRow}>
            {/* Upload Photo button */}
            <TouchableOpacity style={styles.sideBtn} onPress={handleGallery} activeOpacity={0.8}>
              <View style={styles.sideBtnIconCircle}>
                <Feather name="image" size={20} color="#0F172A" />
              </View>
              <Text style={styles.sideBtnLabel}>Upload</Text>
            </TouchableOpacity>

            {/* Center Shutter button */}
            <TouchableOpacity
              style={styles.shutterBtn}
              onPress={handleSnapAngle}
              activeOpacity={0.85}
            >
              <View style={styles.shutterOuter}>
                <View style={styles.shutterInner}>
                  <Feather name="camera" size={26} color={Colors.white} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Verify Action Button (Replaces Flip - Enabled upon capturing 1+ photo) */}
            <TouchableOpacity
              style={[styles.sideBtn, panels.length === 0 && styles.sideBtnDisabled]}
              onPress={() => {
                if (panels.length > 0) {
                  runInspection(panels);
                }
              }}
              disabled={panels.length === 0}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.sideBtnIconCircle,
                  panels.length > 0 && styles.verifyBtnIconCircleActive,
                ]}
              >
                <Feather
                  name="check"
                  size={22}
                  color={panels.length > 0 ? Colors.white : '#94A3B8'}
                />
                {panels.length > 0 && (
                  <View style={styles.verifyCountBadge}>
                    <Text style={styles.verifyCountBadgeText}>{panels.length}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.sideBtnLabel,
                  panels.length > 0 && styles.verifyBtnLabelActive,
                ]}
              >
                Verify
              </Text>
            </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 220, duration: 1300, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(anim, { toValue: 0, duration: 1300, useNativeDriver: Platform.OS !== 'web' }),
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
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 4,
    zIndex: 10,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navCircleBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: Colors.primary,
  },

  // ── Camera Viewport (Anchored Position - Stays Fixed at All Times) ──
  cameraViewportArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 18,
  },
  frameTopTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
    marginTop: 6,
    marginBottom: 22,
    textAlign: 'center',
  },
  cameraAspectBox: {
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  frameHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 32,
    maxWidth: 250,
    alignSelf: 'center',
  },
  frameHintIcon: {
    marginRight: 6,
    marginTop: 2.5,
  },
  frameHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  scanFrame: {
    width: Math.round(CAMERA_WIDTH * 0.90),
    height: Math.round(CAMERA_HEIGHT * 0.85),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: 'rgba(252, 146, 68, 0.72)',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
  },
  framePlaceholder: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },

  // ── Bottom Container (Fixed at screen bottom so it never shifts the camera) ──
  bottomSectionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  // ── Vibrant Orange Captured Photos Tray ──
  orangeTray: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 8,
    shadowOpacity: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  trayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 4,
  },
  trayTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  trayClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  trayClearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  trayScrollView: {
    // Normal scrollview clipping so horizontally scrolled thumbnails stay inside the container
  },
  trayScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 12,
    gap: 12,
  },
  panelThumbBox: {
    position: 'relative',
    marginRight: 10,
  },
  panelThumbImg: {
    width: 58,
    height: 58,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F1F5F9',
  },
  panelDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  // ── Bottom Sheet (Elevated, Spacious, Lifted) ──
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 44 : 34,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },

  // ── Bottom Controls Sheet (Generous Spacing & Upward Lift) ──
  processingArea: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  processingTitle: {
    ...Typography.title,
    color: '#0F172A',
    marginTop: Spacing.xs,
    fontSize: 16,
    fontWeight: '700',
  },
  processingSub: {
    ...Typography.caption,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  sideBtn: {
    alignItems: 'center',
    width: 68,
  },
  sideBtnDisabled: {
    opacity: 0.55,
  },
  sideBtnIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  verifyBtnIconCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.glowOrange,
  },
  verifyBtnLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  verifyCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0F172A',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifyCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sideBtnLabel: {
    ...Typography.caption,
    color: '#475569',
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  shutterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowOrange,
  },

  // ── Camera Permission Request Card (Light Theme) ──
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '90%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(252, 146, 68, 0.3)',
  },
  permissionTitle: {
    ...Typography.title,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  permissionBody: {
    ...Typography.body,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  permissionPrimaryBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: Radii.full,
    marginBottom: Spacing.sm,
    ...Shadows.glowOrange,
  },
  permissionPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  permissionFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  permissionFallbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
});
