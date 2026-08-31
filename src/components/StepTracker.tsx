import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../theme/colors';
import { ComplaintStep } from '../types';

interface Props {
  steps: ComplaintStep[];
}

export default function StepTracker({ steps }: Props) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isDone = step.status === 'DONE';
        const isActive = step.status === 'IN_PROGRESS';

        const dotColor = isDone
          ? Colors.pass
          : isActive
          ? Colors.primary
          : Colors.textMuted;

        const dotBg = isDone
          ? Colors.passBg
          : isActive
          ? Colors.primaryLight
          : Colors.surfaceSubtle;

        const labelColor = isDone || isActive ? Colors.textPrimary : Colors.textMuted;
        const lineColor = isDone ? Colors.pass : Colors.border;

        return (
          <View key={index} style={styles.stepRow}>
            {/* Indicator Column */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.dot,
                  {
                    borderColor: dotColor,
                    backgroundColor: dotBg,
                  },
                ]}
              >
                {isDone ? (
                  <Feather name="check" size={12} color={Colors.pass} />
                ) : isActive ? (
                  <View style={styles.activeDotInner} />
                ) : (
                  <View style={styles.pendingDotInner} />
                )}
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
            </View>

            {/* Content Column */}
            <View style={styles.content}>
              <Text style={[styles.stepLabel, { color: labelColor }]}>{step.label}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
              {step.date && (
                <View style={styles.dateBadge}>
                  <Feather name="clock" size={10} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.stepDate}>{step.date}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 64,
  },
  indicatorCol: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  pendingDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  stepLabel: {
    ...Typography.bodyMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  stepDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    marginTop: 4,
  },
  stepDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
