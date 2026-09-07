import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { ScanResult } from '../types';

/**
 * Generates an official Government-standard Legal Metrology Compliance Inspection Report PDF
 * and prompts the native sharing/printing sheet.
 */
export async function generateAndShareInspectionPdf(scan: ScanResult): Promise<void> {
  try {
    const isCompliant = scan.overallStatus === 'COMPLIANT';
    const isNonCompliant = scan.overallStatus === 'NON_COMPLIANT';
    const statusColor = isCompliant ? '#16A34A' : isNonCompliant ? '#DC2626' : '#D97706';
    const statusText = isCompliant ? 'COMPLIANT (PASSED)' : isNonCompliant ? 'NON-COMPLIANT (VIOLATION DETECTED)' : 'REQUIRES MANUAL REVIEW';

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

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Legal Metrology Inspection Report - ${scan.productName}`,
      });
    } else {
      Alert.alert('Report PDF Generated', `Inspection certificate saved to: ${uri}`);
    }
  } catch (err: any) {
    console.error('Error generating PDF report:', err);
    Alert.alert('PDF Export Failed', err.message || 'Could not compile inspection PDF.');
  }
}
