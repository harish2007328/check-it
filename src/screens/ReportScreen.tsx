import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { ScanResult } from '../types';
import ComplianceRing from '../components/ComplianceRing';
import FieldCheckRow from '../components/FieldCheckRow';
import StatusBadge from '../components/StatusBadge';

export default function ReportScreen({ route, navigation }: any) {
  const scan: ScanResult = route.params?.scan ?? null;
  const [showAll, setShowAll] = useState(false);

  if (!scan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No scan data found.</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.btnPrimaryText}>Start New Scan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fails = scan.fields.filter((f) => f.status === 'FAIL');
  const reviews = scan.fields.filter((f) => f.status === 'REVIEW');
  const passes = scan.fields.filter((f) => f.status === 'PASS');
  const nas = scan.fields.filter((f) => f.status === 'NA');

  const overallBadgeStatus =
    scan.overallStatus === 'COMPLIANT'
      ? 'PASS'
      : scan.overallStatus === 'NON_COMPLIANT'
      ? 'FAIL'
      : 'REVIEW';

  const hasViolations = fails.length > 0;

  const displayFields = showAll
    ? scan.fields
    : [...fails, ...reviews, ...passes, ...nas];

  const date = new Date(scan.timestamp);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.canvas} />

      {/* ── Top Header Bar ──────────────────────────────────────── */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circleBackBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>Inspection Report</Text>

        <TouchableOpacity
          style={styles.circleBackBtn}
          onPress={() =>
            Alert.alert(
              'Share Report',
              `Inspection report #${scan.id} ready for PDF export.`
            )
          }
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Product Hero Card (Pastel Porcelain) ────────────────── */}
        <View style={styles.productHeroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroTextCol}>
              <View style={styles.idChip}>
                <Text style={styles.idChipText}>{scan.id}</Text>
              </View>
              <Text style={styles.productName}>{scan.productName}</Text>
              <Text style={styles.categoryText}>Category: {scan.category}</Text>
            </View>
            <StatusBadge status={overallBadgeStatus} />
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.metaItemText}>{dateStr}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.metaItemText}>{timeStr}</Text>
            </View>
          </View>
        </View>

        {/* ── Score & Statistics Module ───────────────────────────── */}
        <View style={styles.scoreModule}>
          <ComplianceRing score={scan.score} size={118} />

          <View style={styles.scoreStatsCol}>
            <View style={styles.statPillRow}>
              <View style={[styles.statPill, { backgroundColor: Colors.passBg }]}>
                <Feather name="check" size={12} color={Colors.pass} style={{ marginRight: 4 }} />
                <Text style={[styles.statNum, { color: Colors.pass }]}>{passes.length} Passed</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: Colors.reviewBg }]}>
                <Feather name="alert-triangle" size={12} color={Colors.review} style={{ marginRight: 4 }} />
                <Text style={[styles.statNum, { color: Colors.review }]}>{reviews.length} Review</Text>
              </View>
            </View>

            <View style={styles.statPillRow}>
              <View style={[styles.statPill, { backgroundColor: Colors.failBg }]}>
                <Feather name="x" size={12} color={Colors.fail} style={{ marginRight: 4 }} />
                <Text style={[styles.statNum, { color: Colors.fail }]}>{fails.length} Failed</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: Colors.surfaceSubtle }]}>
                <Feather name="minus" size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.statNum, { color: Colors.textMuted }]}>{nas.length} N/A</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Assessment Disclaimer Banner ────────────────────────── */}
        <View style={styles.noticeBanner}>
          <Feather name="info" size={15} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.noticeText}>
            AI-assisted compliance scan. Verify missing clauses before regulatory enforcement.
          </Text>
        </View>

        {/* ── Field-by-Field Checklist ────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mandatory Declarations</Text>
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={styles.toggleText}>
              {showAll ? 'Sort by Priority' : 'Show All (12)'}
            </Text>
          </TouchableOpacity>
        </View>

        {displayFields.map((field) => (
          <FieldCheckRow key={field.id} field={field} />
        ))}

        {/* ── Action Buttons ──────────────────────────────────────── */}
        <View style={styles.actionsBox}>
          {hasViolations && (
            <TouchableOpacity
              style={styles.btnDanger}
              onPress={() => navigation.navigate('Complaint', { scan })}
              activeOpacity={0.88}
            >
              <Feather name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.btnDangerText}>File Regulatory Complaint</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.88}
          >
            <Feather name="camera" size={16} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.btnPrimaryText}>Scan Another Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() =>
              Alert.alert(
                'PDF Report Generated',
                `Official Legal Metrology Inspection Certificate #${scan.id}\nScore: ${scan.score}/100\nDate: ${dateStr}\n\nEvidence dossier compiled.`
              )
            }
            activeOpacity={0.85}
          >
            <Feather name="download" size={16} color={Colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.btnSecondaryText}>Download PDF Certificate</Text>
          </TouchableOpacity>
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
    paddingBottom: 110,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  circleBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  navTitle: {
    ...Typography.title,
    fontSize: 16,
  },
  productHeroCard: {
    backgroundColor: Colors.porcelain,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  idChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.xs,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  idChipText: {
    ...Typography.labelCaps,
    color: Colors.primary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  productName: {
    ...Typography.headline,
    fontSize: 19,
    color: Colors.textPrimary,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 13, 18, 0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItemText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  scoreModule: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  scoreStatsCol: {
    flex: 1,
    marginLeft: Spacing.md,
    gap: 8,
  },
  statPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: Radii.md,
  },
  statNum: {
    fontSize: 11,
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(252, 146, 68, 0.25)',
  },
  noticeText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 16,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionsBox: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  btnDanger: {
    backgroundColor: Colors.fail,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    ...Shadows.soft,
  },
  btnDangerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    ...Shadows.glowOrange,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  btnSecondary: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
