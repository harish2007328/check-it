import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { ComplianceField } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  field: ComplianceField;
}

export default function FieldCheckRow({ field }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (field.status === 'NA') {
    return (
      <View style={[styles.card, styles.cardNA]}>
        <View style={styles.headerRow}>
          <Text style={styles.labelNA}>{field.label}</Text>
          <StatusBadge status="NA" size="sm" />
        </View>
      </View>
    );
  }

  const isFail = field.status === 'FAIL';
  const isReview = field.status === 'REVIEW';

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
      style={[
        styles.card,
        isFail && styles.cardFail,
        isReview && styles.cardReview,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isFail
                  ? Colors.fail
                  : isReview
                  ? Colors.review
                  : Colors.pass,
              },
            ]}
          />
          <Text style={styles.fieldLabel} numberOfLines={1}>
            {field.label}
          </Text>
        </View>
        <View style={styles.rightHeader}>
          <StatusBadge status={field.status} size="sm" />
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
            style={{ marginLeft: 6 }}
          />
        </View>
      </View>

      {field.detected ? (
        <View style={styles.detectedContainer}>
          <Text style={styles.detectedText} numberOfLines={expanded ? undefined : 1}>
            {field.detected}
          </Text>
        </View>
      ) : (
        <View style={styles.missingContainer}>
          <Text style={styles.missingText}>Mandatory declaration missing from package</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.expandedBox}>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>OCR CONFIDENCE</Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color:
                      field.confidence >= 0.8
                        ? Colors.pass
                        : field.confidence >= 0.5
                        ? Colors.review
                        : Colors.fail,
                  },
                ]}
              >
                {Math.round(field.confidence * 100)}%
              </Text>
            </View>

            {field.ruleId && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>STATUTE RULE</Text>
                <Text style={styles.metaValue}>{field.ruleId}</Text>
              </View>
            )}

            {field.severity && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>SEVERITY</Text>
                <Text style={[styles.metaValue, { color: Colors.fail }]}>
                  {field.severity}
                </Text>
              </View>
            )}
          </View>

          {field.note && (
            <View style={styles.noteBox}>
              <Feather name="info" size={13} color={Colors.review} style={{ marginRight: 6 }} />
              <Text style={styles.noteText}>{field.note}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  cardFail: {
    borderColor: 'rgba(225, 29, 72, 0.25)',
    backgroundColor: '#FFFBFB',
  },
  cardReview: {
    borderColor: 'rgba(234, 88, 12, 0.25)',
    backgroundColor: '#FFFDF9',
  },
  cardNA: {
    backgroundColor: Colors.canvas,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  fieldLabel: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  labelNA: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectedContainer: {
    marginTop: 6,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  detectedText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  missingContainer: {
    marginTop: 6,
  },
  missingText: {
    fontSize: 12,
    color: Colors.fail,
    fontWeight: '500',
  },
  expandedBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  metaItem: {
    minWidth: 80,
  },
  metaLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.textMuted,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.reviewBg,
    borderRadius: Radii.xs,
    padding: Spacing.xs,
    marginTop: 6,
  },
  noteText: {
    fontSize: 11,
    color: Colors.review,
    fontWeight: '500',
    flex: 1,
  },
});
