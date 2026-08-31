import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Radii, Spacing } from '../theme/colors';
import { ComplianceStatus } from '../types';

interface Props {
  status: ComplianceStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<
  ComplianceStatus,
  { label: string; bg: string; color: string; icon: keyof typeof Feather.glyphMap }
> = {
  PASS: { label: 'PASS', bg: Colors.passBg, color: Colors.pass, icon: 'check' },
  FAIL: { label: 'VIOLATION', bg: Colors.failBg, color: Colors.fail, icon: 'x' },
  REVIEW: { label: 'REVIEW', bg: Colors.reviewBg, color: Colors.review, icon: 'alert-triangle' },
  NA: { label: 'N/A', bg: Colors.surfaceSubtle, color: Colors.textMuted, icon: 'minus' },
};

export default function StatusBadge({ status, size = 'md' }: Props) {
  const cfg = CONFIG[status] || CONFIG.NA;
  const isSmall = size === 'sm';
  const iconSize = isSmall ? 10 : 12;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, isSmall && styles.badgeSm]}>
      <Feather name={cfg.icon} size={iconSize} color={cfg.color} style={styles.icon} />
      <Text style={[styles.text, { color: cfg.color }, isSmall && styles.textSm]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...Typography.labelCaps,
    fontSize: 10,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 9,
  },
});
