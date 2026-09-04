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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii, Shadows } from '../theme/colors';
import { ScanResult, Complaint } from '../types';

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

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Notes Required', 'Please add inspector observations before filing.');
      return;
    }

    setSubmitting(true);

    const id = `CMP-2026-${String(Date.now()).slice(-5)}`;
    const now = new Date().toISOString();

    const complaint: Complaint = {
      id,
      scanId: scan.id,
      productName: scan.productName,
      category: scan.category,
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
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
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

    try {
      const existing = await AsyncStorage.getItem('complaints');
      const complaints: Complaint[] = existing ? JSON.parse(existing) : [];
      complaints.unshift(complaint);
      await AsyncStorage.setItem('complaints', JSON.stringify(complaints));
    } catch (e) {
      console.warn('Could not save complaint locally.');
    }

    setSubmitting(false);

    Alert.alert(
      'Regulatory Complaint Registered',
      `Case File: ${id}\nProduct: ${scan.productName}\n\nNotice forwarded to the jurisdictional enforcement officer.`,
      [
        {
          text: 'Track Status',
          onPress: () => navigation.navigate('Track', { complaint }),
        },
        { text: 'Done', onPress: () => navigation.navigate('Home') },
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

        <Text style={styles.navTitle}>File Legal Metrology Complaint</Text>
        <View style={{ width: 40 }} />
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
            <Text style={styles.cardHeader}>COMMODITY SUMMARY (FROM SCAN)</Text>

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
                {scan?.score ?? '—'}% (Non-Compliant)
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
                  <Text style={styles.infringementSub}>Mandatory statutory declaration missing</Text>
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

          {/* ── Submit Action Button ──────────────────────────── */}
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

          <Text style={styles.legalNotice}>
            Official filing pursuant to Rule 32 of Legal Metrology (Packaged Commodities) Rules, 2011.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  navTitle: {
    ...Typography.title,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  cardHeader: {
    ...Typography.labelCaps,
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: Spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dataKey: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dataVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infringementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infringementTitle: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
  },
  infringementSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  severityGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  severityPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
  },
  severityPillBtnActive: {
    backgroundColor: Colors.almostBlack,
    borderColor: Colors.almostBlack,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  severityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  severityBtnTextActive: {
    color: Colors.white,
  },
  textArea: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 90,
  },
  evidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.porcelain,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  evidenceText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    flex: 1,
  },
  btnSubmit: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    ...Shadows.glowOrange,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  legalNotice: {
    ...Typography.caption,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 15,
  },
});
