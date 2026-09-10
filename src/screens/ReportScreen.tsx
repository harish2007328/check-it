import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { ScanResult } from '../types';
import { generateAndShareInspectionPdf, exportReportData } from '../utils/pdfReportGenerator';
import ComplianceRing from '../components/ComplianceRing';
import FieldCheckRow from '../components/FieldCheckRow';
import StatusBadge from '../components/StatusBadge';

export default function ReportScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const scan: ScanResult = route.params?.scan ?? null;
  const [showAll, setShowAll] = useState(false);

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top;
  const topPadding = statusBarHeight + 10;

  if (!scan) {
    return (
      <View style={[styles.safe, { paddingTop: topPadding }]}>
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
      </View>
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

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await generateAndShareInspectionPdf(scan);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportFormat = async (format: 'csv' | 'json' | 'txt') => {
    setExportModalVisible(false);
    if (!scan) return;
    await exportReportData(scan, format);
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ── Top Header Bar ──────────────────────────────────────── */}
      <View style={[styles.topNav, { paddingTop: topPadding }]}>
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
            {scan.imageUri || scan.images?.[0] ? (
              <Image
                source={{ uri: scan.imageUri || scan.images?.[0] }}
                style={styles.heroThumbnail}
                resizeMode="cover"
              />
            ) : null}
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

        {/* ── Multi-Panel Inspection Gallery ──────────────────────── */}
        {scan.images && scan.images.length > 1 && (
          <View style={styles.multiPanelGallery}>
            <View style={styles.galleryHeaderRow}>
              <Feather name="layers" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.galleryHeaderTitle}>
                Inspected Panels ({scan.images.length} Sides Captured)
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScrollContent}
            >
              {scan.images.map((imgUri, idx) => (
                <View key={idx} style={styles.galleryPanelCard}>
                  <Image source={{ uri: imgUri }} style={styles.galleryPanelImg} resizeMode="cover" />
                  <Text style={styles.galleryPanelTag}>Side #{idx + 1}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── AI Compliance Observations ──────────────────────────── */}
        {scan.observations && scan.observations.length > 0 && (
          <View style={styles.aiObsCard}>
            <View style={styles.aiObsHeader}>
              <Feather name="cpu" size={15} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.aiObsTitle}>AI Regulatory Compliance Audit</Text>
            </View>
            {scan.observations.map((obs, idx) => (
              <View key={idx} style={styles.obsItemRow}>
                <View style={styles.obsBullet} />
                <Text style={styles.obsItemText}>{obs}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Assessment Disclaimer Banner ────────────────────────── */}
        <View style={styles.noticeBanner}>
          <Feather name="info" size={15} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.noticeText}>
            AI-assisted compliance scan. Verify missing clauses before regulatory enforcement.
          </Text>
        </View>

        {/* ── Rule 9 Font Height & Optical Readability Analysis ── */}
        {scan.fontReadability && (
          <View style={styles.fontAuditCard}>
            <View style={styles.fontAuditHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="type" size={15} color={Colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.fontAuditTitle}>Rule 9 Font Height & Readability</Text>
              </View>
              <View
                style={[
                  styles.fontStatusPill,
                  {
                    backgroundColor: scan.fontReadability.fontSizeCompliant
                      ? '#DCFCE7'
                      : '#FEE2E2',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fontStatusPillText,
                    {
                      color: scan.fontReadability.fontSizeCompliant
                        ? '#15803D'
                        : '#B91C1C',
                    },
                  ]}
                >
                  {scan.fontReadability.fontSizeCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                </Text>
              </View>
            </View>

            <View style={styles.fontAuditGrid}>
              <View style={styles.fontGridItem}>
                <Text style={styles.fontGridLabel}>PRESCRIBED MIN.</Text>
                <Text style={styles.fontGridValue}>{scan.fontReadability.prescribedMinHeightMm} mm</Text>
              </View>
              <View style={styles.fontGridItem}>
                <Text style={styles.fontGridLabel}>ESTIMATED HEIGHT</Text>
                <Text
                  style={[
                    styles.fontGridValue,
                    {
                      color: scan.fontReadability.fontSizeCompliant
                        ? Colors.pass
                        : Colors.fail,
                    },
                  ]}
                >
                  ~{scan.fontReadability.estimatedFontHeightMm} mm
                </Text>
              </View>
              <View style={styles.fontGridItem}>
                <Text style={styles.fontGridLabel}>CONTRAST SCORE</Text>
                <Text style={styles.fontGridValue}>{scan.fontReadability.contrastScore}%</Text>
              </View>
              <View style={styles.fontGridItem}>
                <Text style={styles.fontGridLabel}>METRIC UNIT</Text>
                <Text
                  style={[
                    styles.fontGridValue,
                    {
                      color: scan.fontReadability.unitCompliant
                        ? Colors.pass
                        : Colors.fail,
                    },
                  ]}
                >
                  {scan.fontReadability.unitCompliant ? 'Statutory (Rule 13)' : 'Infringement'}
                </Text>
              </View>
            </View>

            {scan.fontReadability.remarks.length > 0 && (
              <View style={styles.fontRemarksBox}>
                {scan.fontReadability.remarks.map((rem, i) => (
                  <View key={i} style={styles.fontRemarkRow}>
                    <Feather
                      name={scan.fontReadability?.fontSizeCompliant ? 'check-circle' : 'alert-triangle'}
                      size={12}
                      color={scan.fontReadability?.fontSizeCompliant ? Colors.pass : Colors.fail}
                      style={{ marginRight: 6, marginTop: 2 }}
                    />
                    <Text style={styles.fontRemarkText}>{rem}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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
          {/* Primary Button: Download PDF Certificate */}
          <TouchableOpacity
            style={[styles.btnPrimaryDownload, exportingPdf && { opacity: 0.7 }]}
            onPress={handleExportPdf}
            disabled={exportingPdf}
            activeOpacity={0.88}
          >
            {exportingPdf ? (
              <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
            ) : (
              <Feather name="file-text" size={16} color={Colors.white} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.btnPrimaryDownloadText}>
              {exportingPdf ? 'Compiling Official Certificate...' : 'Download PDF Certificate'}
            </Text>
          </TouchableOpacity>

          {/* Extra Button: Export in Various Formats */}
          <TouchableOpacity
            style={styles.btnExportFormats}
            onPress={() => setExportModalVisible(true)}
            activeOpacity={0.85}
          >
            <Feather name="download" size={15} color={Colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.btnExportFormatsText}>Export in Various Formats</Text>
          </TouchableOpacity>

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
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.88}
          >
            <Feather name="camera" size={16} color={Colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.btnSecondaryText}>Scan Another Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Export Multi-Format Modal ───────────────────────── */}
      <Modal
        visible={exportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setExportModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Export Inspection Audit Data</Text>
            <Text style={styles.modalSub}>
              Select format to export or share inspection declarations:
            </Text>

            <TouchableOpacity
              style={styles.modalOptionCard}
              onPress={() => handleExportFormat('csv')}
              activeOpacity={0.8}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="grid" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>CSV Spreadsheet (.csv)</Text>
                <Text style={styles.modalOptionDesc}>
                  Tabular data with field label, detected value, status & rule citations
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOptionCard}
              onPress={() => handleExportFormat('json')}
              activeOpacity={0.8}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="code" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>JSON Machine Data (.json)</Text>
                <Text style={styles.modalOptionDesc}>
                  Full structured audit payload for database or API intake
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOptionCard}
              onPress={() => handleExportFormat('txt')}
              activeOpacity={0.8}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Feather name="align-left" size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalOptionTitle}>Plain Text Notice (.txt)</Text>
                <Text style={styles.modalOptionDesc}>
                  Formatted notice summary ready for email, SMS, or WhatsApp
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setExportModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  heroThumbnail: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
    gap: 10,
    marginBottom: 40,
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

  // ── Multi-Panel Inspection Gallery ──
  multiPanelGallery: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  galleryHeaderTitle: {
    ...Typography.title,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  galleryScrollContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  galleryPanelCard: {
    alignItems: 'center',
  },
  galleryPanelImg: {
    width: 72,
    height: 72,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  galleryPanelTag: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // ── AI Compliance Audit Observations ──
  aiObsCard: {
    backgroundColor: Colors.chromeWhite,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(216, 232, 161, 0.6)',
    ...Shadows.soft,
  },
  aiObsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  aiObsTitle: {
    ...Typography.title,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  obsItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 3,
  },
  obsBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: 8,
  },
  obsItemText: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
    flex: 1,
  },

  // ── Rule 9 Font Height & Readability Audit Card ──
  fontAuditCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Shadows.soft,
  },
  fontAuditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fontAuditTitle: {
    ...Typography.title,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fontStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  fontStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fontAuditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  fontGridItem: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F8FAFC',
    borderRadius: Radii.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fontGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fontGridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fontRemarksBox: {
    marginTop: Spacing.xs + 2,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  fontRemarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  fontRemarkText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },

  // ── Extra Action Button Styles ──
  btnPrimaryDownload: {
    backgroundColor: Colors.almostBlack,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    ...Shadows.soft,
  },
  btnPrimaryDownloadText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  btnExportFormats: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    ...Shadows.soft,
  },
  btnExportFormatsText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Export Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    marginBottom: 10,
  },
  modalOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  modalCancelBtn: {
    marginTop: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
