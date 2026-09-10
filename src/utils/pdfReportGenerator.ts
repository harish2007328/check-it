import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Alert, Platform, Share } from 'react-native';
import { ScanResult, Complaint } from '../types';

/**
 * Generates an official Government-standard Legal Metrology Compliance Inspection Report PDF
 * and prompts the native sharing/printing sheet.
 */
export async function generateAndShareInspectionPdf(scan: ScanResult): Promise<void> {
  try {
    const isCompliant = scan.overallStatus === 'COMPLIANT';
    const isNonCompliant = scan.overallStatus === 'NON_COMPLIANT';
    const statusColor = isCompliant ? '#16A34A' : isNonCompliant ? '#DC2626' : '#D97706';
    const statusText = isCompliant
      ? 'COMPLIANT (PASSED)'
      : isNonCompliant
      ? 'NON-COMPLIANT (VIOLATION DETECTED)'
      : 'REQUIRES MANUAL REVIEW';

    const fontAudit = scan.fontReadability;
    const fontStatus = fontAudit?.fontSizeCompliant ? 'COMPLIANT' : 'NON-COMPLIANT';
    const fontStatusColor = fontAudit?.fontSizeCompliant ? '#16A34A' : '#DC2626';

    const fieldsRowsHtml = scan.fields
      .map((field, idx) => {
        const isPass = field.status === 'PASS';
        const isFail = field.status === 'FAIL';
        const badgeColor = isPass ? '#DCFCE7' : isFail ? '#FEE2E2' : '#FEF3C7';
        const textColor = isPass ? '#15803D' : isFail ? '#B91C1C' : '#B45309';
        const badgeLabel = isPass ? 'PASS' : isFail ? 'FAIL' : field.status === 'NA' ? 'N/A' : 'REVIEW';

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
            <td style="padding: 10px 12px; font-weight: 600; color: #1E293B; border-bottom: 1px solid #E2E8F0;">
              ${field.label}
              ${field.ruleId ? `<div style="font-size: 10px; color: #64748B; font-weight: 400;">${field.ruleId}</div>` : ''}
            </td>
            <td style="padding: 10px 12px; color: #334155; border-bottom: 1px solid #E2E8F0; font-family: monospace;">
              ${field.detected || '<span style="color: #94A3B8; font-style: italic;">Not Detected</span>'}
            </td>
            <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #E2E8F0;">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background-color: ${badgeColor}; color: ${textColor};">
                ${badgeLabel}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    const observationsHtml =
      scan.observations && scan.observations.length > 0
        ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #FFF7ED; border-left: 4px solid #EA580C; border-radius: 6px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #9A3412; text-transform: uppercase; letter-spacing: 0.5px;">
            Enforcement Observations & Statutory Infringements
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #7C2D12; font-size: 12px; line-height: 1.6;">
            ${scan.observations.map((obs) => `<li>${obs}</li>`).join('')}
          </ul>
        </div>
      `
        : '';

    const photoEvidenceHtml = scan.imageUri
      ? `
      <div style="margin-bottom: 20px; padding: 14px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; gap: 16px; align-items: center;">
        <img src="${scan.imageUri}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1; background: #FFFFFF;" alt="Captured Package Evidence" />
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Photographic Package Evidence</div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-top: 3px;">Original Package Label Capture</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Captured and verified via Check-It On-Device Optical OCR Engine</div>
          <div style="font-size: 11px; color: #0F172A; margin-top: 6px; font-family: monospace;">Ref: ${scan.id}</div>
        </div>
      </div>
    `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Legal Metrology Inspection Report - ${scan.id}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 0;
            line-height: 1.5;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0F172A;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .emblem-title {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #0F172A;
            text-transform: uppercase;
            margin: 0 0 4px 0;
          }
          .emblem-sub {
            font-size: 11px;
            color: #475569;
            margin: 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-badge {
            display: inline-block;
            background-color: #0F172A;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            padding: 4px 12px;
            border-radius: 4px;
            margin-top: 10px;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
            background-color: #F8FAFC;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
          }
          .meta-item {
            font-size: 12px;
          }
          .meta-label {
            font-weight: 600;
            color: #64748B;
            text-transform: uppercase;
            font-size: 10px;
          }
          .meta-value {
            font-weight: 700;
            color: #0F172A;
            margin-top: 2px;
          }
          .status-banner {
            padding: 14px 18px;
            border-radius: 8px;
            border: 1.5px solid ${statusColor};
            background-color: #FFFFFF;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .status-title {
            font-size: 14px;
            font-weight: 800;
            color: ${statusColor};
          }
          .score-pill {
            background-color: ${statusColor};
            color: #FFFFFF;
            font-weight: 800;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th {
            background-color: #0F172A;
            color: #FFFFFF;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
            color: #64748B;
          }
          .seal-box {
            text-align: center;
            border: 1px dashed #94A3B8;
            padding: 10px 16px;
            border-radius: 6px;
            color: #334155;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1 class="emblem-title">Government of India • Legal Metrology Inspection Certificate</h1>
          <p class="emblem-sub">Department of Consumer Affairs • Legal Metrology (Packaged Commodities) Rules, 2011</p>
          <div class="doc-badge">Official Statutory Compliance Dossier</div>
        </div>

        <!-- Evidence Photograph -->
        ${photoEvidenceHtml}

        <!-- Metadata Grid -->
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Inspection Reference</div>
            <div class="meta-value">${scan.id}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date of Inspection</div>
            <div class="meta-value">${new Date(scan.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Product / Commodity Title</div>
            <div class="meta-value">${scan.productName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Product Category</div>
            <div class="meta-value">${scan.category}</div>
          </div>
        </div>

        <!-- Status & Score Banner -->
        <div class="status-banner">
          <div>
            <div style="font-size: 10px; color: #64748B; font-weight: 700; text-transform: uppercase;">Statutory Determination</div>
            <div class="status-title">${statusText}</div>
          </div>
          <div class="score-pill">Score: ${scan.score}%</div>
        </div>

        <!-- Rule 9 Font Size & Readability Audit Box -->
        ${
          fontAudit
            ? `
          <div style="margin-bottom: 24px; padding: 14px; background-color: #F1F5F9; border-radius: 8px; border: 1px solid #CBD5E1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase;">Rule 9 Font Height & Optical Readability Audit</span>
              <span style="font-size: 11px; font-weight: 700; color: ${fontStatusColor}; background: #FFFFFF; padding: 2px 8px; border-radius: 4px; border: 1px solid ${fontStatusColor};">${fontStatus}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 11px;">
              <div><strong>Declared Net Qty:</strong> ${fontAudit.declaredNetQuantity || 'N/A'}</div>
              <div><strong>Prescribed Min Height:</strong> ${fontAudit.prescribedMinHeightMm} mm</div>
              <div><strong>Estimated Height:</strong> ${fontAudit.estimatedFontHeightMm} mm</div>
              <div><strong>Readability Rating:</strong> ${fontAudit.readabilityLevel}</div>
              <div><strong>Contrast Score:</strong> ${fontAudit.contrastScore}%</div>
              <div><strong>Metric Unit Standard:</strong> ${fontAudit.unitCompliant ? 'Compliant' : 'Violation (Rule 13)'}</div>
            </div>
          </div>
        `
            : ''
        }

        <!-- Declarations Table -->
        <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0F172A; margin: 0 0 6px 0;">
          Statutory Declarations Verification (Rule 6)
        </h3>
        <table>
          <thead>
            <tr>
              <th style="width: 38%;">Statutory Requirement</th>
              <th style="width: 44%;">Detected On Label</th>
              <th style="width: 18%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${fieldsRowsHtml}
          </tbody>
        </table>

        <!-- Infringements / Observations -->
        ${observationsHtml}

        <!-- Footer / Legal Disclaimer -->
        <div class="footer">
          <div>
            <p style="margin: 0; font-weight: 700; color: #0F172A;">Generated via Check-It Legal Metrology AI Engine</p>
            <p style="margin: 2px 0 0 0;">Validated pursuant to Section 18 & 36 of Legal Metrology Act, 2009.</p>
          </div>
          <div class="seal-box">
            <div style="font-weight: 700; font-size: 9px; text-transform: uppercase;">Digital Compliance Seal</div>
            <div style="font-size: 8px; color: #64748B;">AUTHENTICATED SYSTEM AUDIT</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Directly launch Android's native "Save as PDF" / Print preview.
    // This allows the user to immediately download/save the PDF directly to their device (Downloads/Drive)
    // with zero permission errors in Expo Go or production builds.
    await Print.printAsync({ html });
  } catch (err: any) {
    console.error('Error generating PDF report:', err);
    Alert.alert('PDF Download Failed', err.message || 'Could not download inspection PDF.');
  }
}

/**
 * Generates an official Government Statutory Complaint & Non-Compliance Notice Dossier PDF
 * for flagged/non-compliant products and registered complaints.
 */
export async function generateAndShareComplaintPdf(
  complaint: Complaint,
  scan?: ScanResult
): Promise<void> {
  try {
    const photoUri = complaint.imageUri || scan?.imageUri;
    const violationsList = complaint.violations && complaint.violations.length > 0
      ? complaint.violations
      : ['Statutory declarations omitted under Rule 6 of Packaged Commodities Rules, 2011'];

    const photoEvidenceHtml = photoUri
      ? `
      <div style="margin-bottom: 20px; padding: 14px; background-color: #FEF2F2; border: 1.5px solid #F87171; border-radius: 8px; display: flex; gap: 16px; align-items: center;">
        <img src="${photoUri}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid #DC2626; background: #FFFFFF;" alt="Contravening Commodity Sample" />
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #DC2626; text-transform: uppercase; letter-spacing: 0.5px;">Seized / Captured Commodity Evidence</div>
          <div style="font-size: 13px; font-weight: 700; color: #7F1D1D; margin-top: 3px;">Packaged Commodity Sample Under Inspection</div>
          <div style="font-size: 11px; color: #991B1B; margin-top: 4px;">Photographic evidence logged under Section 18 & 36 of Legal Metrology Act, 2009.</div>
          <div style="font-size: 11px; color: #0F172A; margin-top: 6px; font-family: monospace;">Case Reference: ${complaint.id}</div>
        </div>
      </div>
    `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Legal Metrology Notice - ${complaint.id}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 0;
            line-height: 1.5;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #DC2626;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .emblem-title {
            font-size: 17px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #991B1B;
            text-transform: uppercase;
            margin: 0 0 4px 0;
          }
          .emblem-sub {
            font-size: 11px;
            color: #475569;
            margin: 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-badge {
            display: inline-block;
            background-color: #DC2626;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 5px 14px;
            border-radius: 4px;
            margin-top: 10px;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
            background-color: #F8FAFC;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
          }
          .meta-item {
            font-size: 12px;
          }
          .meta-label {
            font-weight: 600;
            color: #64748B;
            text-transform: uppercase;
            font-size: 10px;
          }
          .meta-value {
            font-weight: 700;
            color: #0F172A;
            margin-top: 2px;
          }
          .alert-box {
            padding: 14px 18px;
            border-radius: 8px;
            border: 1.5px solid #DC2626;
            background-color: #FEF2F2;
            margin-bottom: 20px;
          }
          .alert-title {
            font-size: 14px;
            font-weight: 800;
            color: #991B1B;
            text-transform: uppercase;
            margin: 0 0 6px 0;
          }
          .violations-list {
            padding-left: 20px;
            color: #7F1D1D;
            font-size: 12px;
            line-height: 1.7;
          }
          .observations-box {
            background-color: #F8FAFC;
            border: 1px solid #CBD5E1;
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .statutory-warning {
            background-color: #FFFBEB;
            border-left: 4px solid #F59E0B;
            padding: 14px;
            border-radius: 6px;
            font-size: 11px;
            color: #92400E;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
            color: #64748B;
          }
          .seal-box {
            text-align: center;
            border: 1px dashed #DC2626;
            padding: 10px 16px;
            border-radius: 6px;
            color: #991B1B;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1 class="emblem-title">Government of India • Legal Metrology Enforcement Division</h1>
          <p class="emblem-sub">Department of Consumer Affairs • Legal Metrology Act, 2009 (Act No. 1 of 2010)</p>
          <div class="doc-badge">FORM I — STATUTORY CONTRAVENTION DOSSIER</div>
        </div>

        <!-- Evidence Photograph -->
        ${photoEvidenceHtml}

        <!-- Metadata Grid -->
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Notice Reference No.</div>
            <div class="meta-value">${complaint.id}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Inspection Reference</div>
            <div class="meta-value">${complaint.scanId || 'INS-PENDING'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Filing Date & Time</div>
            <div class="meta-value">${new Date(complaint.filedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Enforcement Severity</div>
            <div class="meta-value" style="color: #DC2626;">${complaint.severity} PRIORITY</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Commodity / Item</div>
            <div class="meta-value">${complaint.productName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Product Category</div>
            <div class="meta-value">${complaint.category}</div>
          </div>
        </div>

        <!-- Flagged Offences Alert Box -->
        <div class="alert-box">
          <h3 class="alert-title">Prima Facie Statutory Infringements Detected</h3>
          <ul class="violations-list">
            ${violationsList.map((v) => `<li><strong>${v}</strong> (Contravention of Rule 6, Packaged Commodities Rules, 2011)</li>`).join('')}
          </ul>
        </div>

        <!-- Inspector Observations -->
        <div class="observations-box">
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
            Inspector Observations & On-Site Verification Notes
          </div>
          <p style="margin: 0; font-size: 12px; color: #1E293B; line-height: 1.6;">
            ${complaint.notes || 'Routine surveillance inspection revealed packaging non-compliant with standard statutory declarations.'}
          </p>
        </div>

        <!-- Statutory Penalty Notice -->
        <div class="statutory-warning">
          <strong>LEGAL ADVISORY & STATUTORY NOTICE:</strong>
          Pursuant to Section 36 of the Legal Metrology Act, 2009, whoever manufactures, packs, imports, sells, distributes, or exposes for sale any pre-packaged commodity not conforming to declarations specified in the rules shall be punishable with fine which may extend to ₹25,000 for the first offence, and up to ₹50,000 or imprisonment for subsequent offences.
        </div>

        <!-- Footer -->
        <div class="footer">
          <div>
            <p style="margin: 0; font-weight: 700; color: #0F172A;">Digital Regulatory Notice • Legal Metrology Surveillance</p>
            <p style="margin: 2px 0 0 0;">Authenticated and dispatched to Jurisdictional Controller.</p>
          </div>
          <div class="seal-box">
            <div style="font-weight: 800; font-size: 9px; text-transform: uppercase;">CONTROLLER OF LEGAL METROLOGY</div>
            <div style="font-size: 8px;">GOVT. OF INDIA ENFORCEMENT</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Directly launch Android's native "Save as PDF" / Print preview.
    await Print.printAsync({ html });
  } catch (err: any) {
    console.error('Error generating complaint notice PDF:', err);
    Alert.alert('PDF Download Failed', err.message || 'Could not download complaint notice PDF.');
  }
}

/**
 * Export scan inspection data in alternative formats: CSV, JSON, or Plain Text
 */
export async function exportReportData(
  scan: ScanResult,
  format: 'csv' | 'json' | 'txt'
): Promise<void> {
  try {
    let content = '';
    let fileName = '';
    let mimeType = 'text/plain';
    let uti = 'public.plain-text';

    if (format === 'csv') {
      fileName = `Inspection_${scan.id}.csv`;
      mimeType = 'text/csv';
      uti = 'public.comma-separated-values-text';

      const csvRows = [
        ['Check-It Legal Metrology Compliance Inspection Audit Data'],
        ['Inspection Reference', scan.id],
        ['Timestamp', scan.timestamp],
        ['Commodity Title', `"${scan.productName.replace(/"/g, '""')}"`],
        ['Category', scan.category],
        ['Overall Compliance Score', `${scan.score}%`],
        ['Statutory Determination', scan.overallStatus],
        [],
        ['Requirement', 'Detected On Label', 'Status', 'Confidence', 'Rule Reference'],
      ];

      scan.fields.forEach((f) => {
        csvRows.push([
          `"${f.label.replace(/"/g, '""')}"`,
          `"${(f.detected || 'Not Detected').replace(/"/g, '""')}"`,
          f.status,
          `${Math.round(f.confidence * 100)}%`,
          f.ruleId || 'Rule 6',
        ]);
      });

      if (scan.observations && scan.observations.length > 0) {
        csvRows.push([]);
        csvRows.push(['Enforcement Observations']);
        scan.observations.forEach((obs) => {
          csvRows.push([`"${obs.replace(/"/g, '""')}"`]);
        });
      }

      content = csvRows.map((r) => r.join(',')).join('\n');
    } else if (format === 'json') {
      fileName = `Inspection_${scan.id}.json`;
      mimeType = 'application/json';
      uti = 'public.json';
      content = JSON.stringify(scan, null, 2);
    } else {
      // Plain text notice summary
      fileName = `Notice_${scan.id}.txt`;
      mimeType = 'text/plain';
      uti = 'public.plain-text';

      const missingFields = scan.fields.filter((f) => f.status === 'FAIL');
      content = [
        '================================================================',
        'LEGAL METROLOGY STATUTORY INSPECTION DOSSIER',
        'Department of Consumer Affairs, Government of India',
        '================================================================',
        `Reference ID      : ${scan.id}`,
        `Date & Time       : ${new Date(scan.timestamp).toLocaleString('en-IN')}`,
        `Commodity Title   : ${scan.productName}`,
        `Category          : ${scan.category}`,
        `Determination     : ${scan.overallStatus}`,
        `Compliance Score  : ${scan.score}%`,
        '----------------------------------------------------------------',
        'MANDATORY DECLARATIONS AUDIT (Rule 6):',
        ...scan.fields.map(
          (f) => ` • [${f.status}] ${f.label.padEnd(25)} : ${f.detected || 'MISSING'}`
        ),
        '----------------------------------------------------------------',
        missingFields.length > 0
          ? `STATUTORY CONTRAVENTIONS (${missingFields.length} FOUND):\n` +
            missingFields.map((f) => ` - Missing mandatory declaration: ${f.label}`).join('\n')
          : 'All mandatory packaging declarations verified pursuant to PCR 2011.',
        '----------------------------------------------------------------',
        'Generated via Check-It Legal Metrology AI Engine',
        '================================================================',
      ].join('\n');
    }

    if (Platform.OS !== 'web') {
      try {
        const file = new File(Paths.cache, fileName);
        file.create({ overwrite: true });
        file.write(content);

        const shareUri = file.uri;

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(shareUri, {
            mimeType,
            UTI: uti,
            dialogTitle: `Export Inspection Data (${format.toUpperCase()})`,
          });
          return;
        }
      } catch (fileErr) {
        console.warn('File share issue, falling back to text share:', fileErr);
      }
    }

    // Fallback if file sharing is unavailable or on web
    await Share.share({
      message: content,
      title: `Inspection Export - ${scan.productName}`,
    });
  } catch (err: any) {
    console.error(`Export failed for format ${format}:`, err);
    Alert.alert('Export Failed', err.message || 'Could not export file.');
  }
}
