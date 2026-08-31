import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Radii } from '../theme/colors';

interface Props {
  score: number;
  size?: number;
}

function getTone(score: number) {
  if (score >= 90) return { color: Colors.pass, bg: Colors.passBg, label: 'COMPLIANT', icon: 'check-circle' as const };
  if (score >= 65) return { color: Colors.review, bg: Colors.reviewBg, label: 'ATTENTION', icon: 'alert-triangle' as const };
  return { color: Colors.fail, bg: Colors.failBg, label: 'NON-COMPLIANT', icon: 'x-circle' as const };
}

export default function ComplianceRing({ score, size = 124 }: Props) {
  const animVal = useRef(new Animated.Value(0)).current;
  const tone = getTone(score);

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeWidth = 8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer track */}
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.porcelainDark,
          },
        ]}
      />

      {/* Center Label Area */}
      <View
        style={[
          styles.centerPill,
          {
            width: size - 24,
            height: size - 24,
            borderRadius: (size - 24) / 2,
            backgroundColor: Colors.white,
          },
        ]}
      >
        <Text style={[styles.scoreNumber, { color: tone.color }]}>{score}%</Text>
        <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
          <Feather name={tone.icon} size={10} color={tone.color} style={{ marginRight: 3 }} />
          <Text style={[styles.statusLabel, { color: tone.color }]}>{tone.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
  },
  centerPill: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.almostBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginTop: 2,
  },
  statusLabel: {
    ...Typography.labelCaps,
    fontSize: 8,
    fontWeight: '700',
  },
});
