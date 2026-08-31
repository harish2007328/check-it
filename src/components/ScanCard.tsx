import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { ScanResult } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  scan: ScanResult;
  onPress: () => void;
}

export default function ScanCard({ scan, onPress }: Props) {
  const overallStatus =
    scan.overallStatus === 'COMPLIANT'
      ? 'PASS'
      : scan.overallStatus === 'NON_COMPLIANT'
      ? 'FAIL'
      : 'REVIEW';

  const isPass = overallStatus === 'PASS';
  const isFail = overallStatus === 'FAIL';

  const date = new Date(scan.timestamp);
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.scorePill,
            {
              backgroundColor: isPass
                ? Colors.passBg
                : isFail
                ? Colors.failBg
                : Colors.reviewBg,
            },
          ]}
        >
          <Text
            style={[
              styles.scoreText,
              {
                color: isPass
                  ? Colors.pass
                  : isFail
                  ? Colors.fail
                  : Colors.review,
              },
            ]}
          >
            {scan.score}%
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={1}>
            {scan.productName}
          </Text>
          <View style={styles.subMeta}>
            <Text style={styles.category}>{scan.category}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.scanId}>{scan.id}</Text>
          </View>
        </View>

        <Feather name="chevron-right" size={18} color={Colors.textMuted} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <StatusBadge status={overallStatus} size="sm" />
        <View style={styles.timestampContainer}>
          <Feather name="clock" size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.timeText}>
            {dateStr}, {timeStr}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scorePill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    ...Typography.title,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  category: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  dot: {
    marginHorizontal: 5,
    color: Colors.textMuted,
    fontSize: 10,
  },
  scanId: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
