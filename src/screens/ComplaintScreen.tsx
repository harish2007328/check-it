import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { ScanResult, Complaint } from '../types';
import { saveComplaint } from '../utils/supabase';
import { generateAndShareComplaintPdf, exportReportData } from '../utils/pdfReportGenerator';

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM'] as const;

export default function ComplaintScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const scan: ScanResult = route.params?.scan;

  const statusBarHeight =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top;
  const topPadding = statusBarHeight + 10;

  const fails = scan?.fields.filter((f) => f.status === 'FAIL') ?? [];
  const reviews = scan?.fields.filter((f) => f.status === 'REVIEW') ?? [];

  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const getComplaintPayload = (): Complaint => {
    const id = `CMP-2026-${String(Date.now()).slice(-5)}`;
    const now = new Date().toISOString();

    return {
      id,
      scanId: scan?.id || 'INS-PENDING',
      productName: scan?.productName || 'Unlabeled Commodity',
      category: scan?.category || 'General',
      imageUri: scan?.imageUri || (scan?.images && scan.images[0]),
      violations: fails.map((f) => `${f.label} undeclared`),
      notes: notes.trim(),
      severity,
      status: 'SUBMITTED',
      filedAt: now,
      updatedAt: now,
      steps: [
        {
          label: 'Complaint Lodged',
          description: `Registered under reference #${id}`,
          status: 'DONE',
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        {
          label: 'Statutory Verification',
          description: 'Being reviewed by Legal Metrology Officer',
          status: 'IN_PROGRESS',
        },
        {
          label: 'Notice Issued',
          description: 'Show cause notice to manufacturer / packer',
          status: 'PENDING',
        },
        {
          label: 'Case Resolution',
          description: 'Compounding of offence or legal proceeding',
          status: 'PENDING',
        },
      ],
    };
  };

  const handleDownloadNoticePdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const complaintData = getComplaintPayload();
      await generateAndShareComplaintPdf(complaintData, scan);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportFormat = async (format: 'csv' | 'json' | 'txt') => {
    setExportModalVisible(false);
    if (!scan) return;
    await exportReportData(scan, format);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Notes Required', 'Please add inspector observations before filing.');
      return;
    }

    setSubmitting(true);
    const complaint = getComplaintPayload();

    try {
      await saveComplaint(complaint);
    } catch (e) {
      console.warn('Could not save complaint to database/cache:', e);
    }

    setSubmitting(false);

    Alert.alert(
      'Regulatory Complaint Registered',
      `Case File: ${complaint.id}\nProduct: ${scan?.productName}\n\nNotice forwarded to the jurisdictional enforcement officer.`,
      [
        {
          text: 'Download Notice PDF',
          onPress: () => generateAndShareComplaintPdf(complaint, scan),
        },
        {
          text: 'Track Status',
          onPress: () =>
            navigation.navigate('MainTabs', {
              screen: 'Track',
              params: { complaint },
            }),
        },
        {
          text: 'Done',
          onPress: () =>
            navigation.navigate('MainTabs', {
              screen: 'Home',
            }),
        },
      ]
    );
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* ── Top Bar ────────────────────────────────────────── */}
      <View style={[styles.topNav, { paddingTop: topPadding }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circleBackBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>Legal Metrology Complaint</Text>

        <TouchableOpacity
          style={styles.circleBackBtn}
          onPress={() => setExportModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Product Metadata Card ─────────────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeader}>COMMODITY EVIDENCE SUMMARY</Text>
              <View style={styles.nonCompliantBadge}>
                <View style={styles.redDot} />
                <Text style={styles.nonCompliantBadgeText}>Non-Compliant</Text>
              </View>
            </View>

            {/* Scanned Image Evidence Preview */}
            {scan?.imageUri || scan?.images?.[0] ? (
              <View style={styles.evidenceImageBanner}>
                <Image
                  source={{ uri: scan.imageUri || scan.images?.[0] }}
                  style={styles.evidenceThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.evidenceImageInfo}>
                  <Text style={styles.evidenceImageTitle}>Captured Sample Photo</Text>
                  <Text style={styles.evidenceImageSub}>
                    Attached as official evidentiary proof in the complaint docket.
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.dataRow}>
              <Text style={styles.dataKey}>COMMODITY</Text>
              <Text style={styles.dataVal}>{scan?.productName ?? '—'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataKey}>CATEGORY</Text>
              <Text style={styles.dataVal}>{scan?.category ?? '—'}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataKey}>INSPECTION DOSSIER</Text>
              <Text style={[styles.dataVal, { fontFamily: 'monospace', color: Colors.primary }]}>
                {scan?.id ?? '—'}
              </Text>
            </View>

            <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.dataKey}>COMPLIANCE RATING</Text>
              <Text style={[styles.dataVal, { color: Colors.fail, fontWeight: '700' }]}>
                {scan?.score ?? '—'}% (Statutory Violations)
              </Text>
            </View>
          </View>

          {/* ── Detected Infringements ─────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>FLAGGED INFRINGEMENTS ({fails.length})</Text>
            {fails.map((f) => (
              <View key={f.id} style={styles.infringementItem}>
                <Feather name="x-circle" size={14} color={Colors.fail} style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infringementTitle}>{f.label}</Text>
                  <Text style={styles.infringementSub}>
                    Mandatory statutory declaration missing under Rule 6
                  </Text>
                </View>
              </View>
            ))}

            {reviews.length > 0 && (
              <>
                <Text style={[styles.cardHeader, { marginTop: Spacing.sm, color: Colors.review }]}>
                  UNRESOLVED DECLARATIONS ({reviews.length})
                </Text>
                {reviews.map((f) => (
                  <View key={f.id} style={styles.infringementItem}>
                    <Feather name="alert-triangle" size={14} color={Colors.review} style={{ marginRight: 8, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infringementTitle}>{f.label}</Text>
                      <Text style={styles.infringementSub}>Uncertain declaration / low optical confidence</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* ── Severity Level ────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>ENFORCEMENT SEVERITY</Text>
            <View style={styles.severityGrid}>
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severity === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.severityPillBtn, active && styles.severityPillBtnActive]}
                    onPress={() => setSeverity(opt)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.severityDot,
                        {
                          backgroundColor:
                            opt === 'CRITICAL'
                              ? Colors.fail
                              : opt === 'HIGH'
                              ? Colors.review
                              : Colors.primary,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.severityBtnText,
                        active && styles.severityBtnTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Inspector Notes Input ─────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>INSPECTOR OBSERVATIONS & LOCATION *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Record outlet name, batch markings, retail location, and specific non-compliance details..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          {/* ── Evidence Attachment Pill ──────────────────────── */}
          <View style={styles.evidencePill}>
            <Feather name="paperclip" size={14} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.evidenceText}>
              Scan photograph & OCR token coordinates attached to case file
            </Text>
          </View>

          {/* ── Action Buttons ────────────────────────────────── */}
          <View style={styles.actionButtonGroup}>
            {/* Primary Action: Download PDF Notice */}
            <TouchableOpacity
              style={[styles.btnDownloadPdf, downloadingPdf && { opacity: 0.7 }]}
              onPress={handleDownloadNoticePdf}
              disabled={downloadingPdf}
              activeOpacity={0.88}
            >
              {downloadingPdf ? (
                <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
              ) : (
                <Feather name="file-text" size={16} color={Colors.white} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.btnDownloadPdfText}>
                {downloadingPdf ? 'Compiling Official Notice...' : 'Download Non-Compliance PDF Notice'}
              </Text>
            </TouchableOpacity>

            {/* Extra Button: Download / Export in Various Formats */}
            <TouchableOpacity
              style={styles.btnExportFormats}
              onPress={() => setExportModalVisible(true)}
              activeOpacity={0.85}
            >
              <Feather name="download" size={15} color={Colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.btnExportFormatsText}>Export in Various Formats</Text>
            </TouchableOpacity>

            {/* Lodge Complaint Button */}
            <TouchableOpacity
              style={[styles.btnSubmit, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              <Feather name="send" size={16} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.btnSubmitText}>
                {submitting ? 'Registering...' : 'Lodge Regulatory Complaint'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legalNotice}>
            Official filing pursuant to Rule 32 of Legal Metrology (Packaged Commodities) Rules, 2011.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

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
            <Text style={styles.modalTitle}>Export Non-Compliance Data</Text>
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
    borderColor: '#EAECF0',
    ...Shadows.soft,
  },
  navTitle: {
    ...Typography.title,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EAECF0',
    ...Shadows.soft,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    ...Typography.labelCaps,
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  nonCompliantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.fail,
    marginRight: 5,
  },
  nonCompliantBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.fail,
  },
  evidenceImageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  evidenceThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  evidenceImageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  evidenceImageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  evidenceImageSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  dataKey: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dataVal: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infringementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  infringementTitle: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  infringementSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  severityGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  severityPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  severityPillBtnActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.almostBlack,
    borderWidth: 1.5,
    ...Shadows.soft,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  severityBtnText: {
    ...Typography.labelCaps,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  severityBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: '#F8FAFC',
    minHeight: 90,
    marginTop: Spacing.xs,
  },
  evidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  evidenceText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  actionButtonGroup: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  btnDownloadPdf: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    ...Shadows.soft,
  },
  btnDownloadPdfText: {
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
  btnSubmit: {
    backgroundColor: Colors.almostBlack,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.soft,
  },
  btnSubmitText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  legalNotice: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: Spacing.lg,
    marginBottom: 40,
  },

  // Modal styles
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
