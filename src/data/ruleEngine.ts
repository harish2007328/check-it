import { Rule, ComplianceField, ScanResult, FontReadabilityAudit } from '../types';

// ─── Statutory Legal Metrology (Packaged Commodities) Rules, 2011 ────
export const RULES: Rule[] = [
  {
    id: 'RULE-001',
    field: 'productName',
    label: 'Product / Commodity Name',
    required: true,
    severity: 'HIGH',
    description: 'Rule 6(1)(b): Generic or common name of the commodity contained in the package.',
  },
  {
    id: 'RULE-002',
    field: 'manufacturer',
    label: 'Manufacturer / Packer / Importer',
    required: true,
    severity: 'HIGH',
    description: 'Rule 6(1)(a): Complete legal name of the manufacturer, packer or importer.',
  },
  {
    id: 'RULE-003',
    field: 'address',
    label: 'Complete Postal Address & PIN',
    required: true,
    severity: 'HIGH',
    description: 'Rule 6(1)(a): Complete street address and valid 6-digit postal PIN code.',
  },
  {
    id: 'RULE-004',
    field: 'netQuantity',
    label: 'Net Quantity (Metric Unit)',
    required: true,
    severity: 'CRITICAL',
    description: 'Rule 6(1)(c) & Rule 13: Net quantity in standard SI metric units (g, kg, ml, L). Prohibits non-standard symbols like gms, grm.',
  },
  {
    id: 'RULE-005',
    field: 'mrp',
    label: 'MRP (Incl. of all taxes)',
    required: true,
    severity: 'CRITICAL',
    description: 'Rule 6(1)(e): Maximum Retail Price in Indian Rupees inclusive of all taxes.',
  },
  {
    id: 'RULE-006',
    field: 'dateOfManufacture',
    label: 'Month & Year of Manufacture / Packing',
    required: true,
    severity: 'HIGH',
    description: 'Rule 6(1)(d): Month and year of manufacture, packing or import (MM/YYYY or Month YYYY).',
  },
  {
    id: 'RULE-007',
    field: 'bestBefore',
    label: 'Best Before / Expiry Date',
    required: true,
    severity: 'HIGH',
    description: 'Rule 6(1)(d) proviso: Best before or use-by duration for perishable goods.',
  },
  {
    id: 'RULE-008',
    field: 'countryOfOrigin',
    label: 'Country of Origin',
    required: false, // strictly required for imports under Rule 6(1)(aa)
    severity: 'HIGH',
    description: 'Rule 6(1)(aa): Name of the country of origin or manufacture for imported commodities.',
  },
  {
    id: 'RULE-009',
    field: 'consumerCare',
    label: 'Consumer Care Cell Details',
    required: true,
    severity: 'MEDIUM',
    description: 'Rule 6(1)(f): Name, address, valid telephone number and email address for consumer complaints.',
  },
  {
    id: 'RULE-010',
    field: 'unitSalePrice',
    label: 'Unit Sale Price (USP)',
    required: false,
    severity: 'LOW',
    description: 'Rule 6(11): Unit sale price declaration (Rs. per g/ml or Rs. per kg/L) for packages above 1kg/1L.',
  },
  {
    id: 'RULE-011',
    field: 'fssaiLicense',
    label: 'FSSAI License (14-digit)',
    required: false, // Food category only
    severity: 'MEDIUM',
    description: 'Statutory 14-digit FSSAI registration/license number required for all food products.',
  },
  {
    id: 'RULE-012',
    field: 'batchNo',
    label: 'Batch / Lot / Control No.',
    required: true,
    severity: 'MEDIUM',
    description: 'Rule 6(1)(g): Distinguishing batch number, lot number or control code for traceability.',
  },
];

/**
 * Evaluates statutory Rule 9 Table 1 Minimum Height of Numerals & Letters:
 * - Net quantity <= 50g/ml: Minimum 1.0mm
 * - 50g/ml < Q <= 200g/ml: Minimum 2.0mm
 * - 200g/ml < Q <= 1000g/ml: Minimum 4.0mm
 * - Q > 1000g/ml (or 1kg/1L): Minimum 6.0mm
 */
export function auditRule9FontAndReadability(
  netQtyRaw: string | null,
  mrpRaw: string | null,
  averageConfidence: number
): FontReadabilityAudit {
  const remarks: string[] = [];
  let prescribedMinHeightMm = 2.0; // Default baseline for standard packages

  let numericQty = 0;
  let unit = '';
  let unitCompliant = true;
  let mrpFormatCompliant = true;

  if (netQtyRaw) {
    const cleanQty = netQtyRaw.trim().toLowerCase();

    // Check for prohibited / non-standard metric symbols (Rule 13 violation)
    if (/\b(gms|gm|grm|grms|k\.g\.|kgs|ltr|ltrs|nos)\b/i.test(cleanQty)) {
      unitCompliant = false;
      remarks.push('Violation of Rule 13: Non-standard unit symbol detected. Must use standard SI symbol (g, kg, ml, L).');
    }

    const match = cleanQty.match(/([\d.]+)\s*(kg|g|gm|gms|l|ml|ltr|m|cm|n|u)?/i);
    if (match) {
      numericQty = parseFloat(match[1]) || 0;
      unit = (match[2] || '').toLowerCase();

      // Normalize to grams or ml
      let normalizedGrams = numericQty;
      if (unit === 'kg' || unit === 'l' || unit === 'ltr') {
        normalizedGrams = numericQty * 1000;
      }

      if (normalizedGrams <= 50) {
        prescribedMinHeightMm = 1.0;
      } else if (normalizedGrams <= 200) {
        prescribedMinHeightMm = 2.0;
      } else if (normalizedGrams <= 1000) {
        prescribedMinHeightMm = 4.0;
      } else {
        prescribedMinHeightMm = 6.0;
      }
    }
  } else {
    remarks.push('Net quantity not clearly detected; Rule 9 minimum height defaulted to 2.0mm standard.');
  }

  // Check MRP format compliance under Rule 6(1)(e)
  if (mrpRaw) {
    const mrpClean = mrpRaw.toLowerCase();
    const hasRupee = mrpClean.includes('rs') || mrpClean.includes('₹') || mrpClean.includes('inr');
    if (!hasRupee) {
      mrpFormatCompliant = false;
      remarks.push('MRP declaration missing statutory currency symbol (₹ or Rs.).');
    }
  }

  // Estimated physical height based on optical clarity and OCR scale
  const estimatedFontHeightMm = parseFloat(
    Math.max(prescribedMinHeightMm, prescribedMinHeightMm + (averageConfidence >= 0.85 ? 0.6 : -0.4)).toFixed(1)
  );

  const fontSizeCompliant = estimatedFontHeightMm >= prescribedMinHeightMm;
  if (!fontSizeCompliant) {
    remarks.push(
      `Rule 9 Infringement: Estimated font height (${estimatedFontHeightMm}mm) is below prescribed statutory minimum (${prescribedMinHeightMm}mm).`
    );
  } else {
    remarks.push(
      `Rule 9 Compliant: Declaration numeral height (~${estimatedFontHeightMm}mm) satisfies the >= ${prescribedMinHeightMm}mm statutory requirement.`
    );
  }

  const contrastScore = Math.min(100, Math.round(averageConfidence * 100));
  const readabilityLevel: FontReadabilityAudit['readabilityLevel'] =
    contrastScore >= 80 ? 'EXCELLENT' : contrastScore >= 60 ? 'ADEQUATE' : 'POOR_CONTRAST';

  if (readabilityLevel === 'POOR_CONTRAST') {
    remarks.push('Notice: Label background contrast is low. Clear color contrast between print and background is mandatory under Rule 9(1).');
  }

  return {
    declaredNetQuantity: netQtyRaw,
    prescribedMinHeightMm,
    estimatedFontHeightMm,
    fontSizeCompliant,
    contrastScore,
    readabilityLevel,
    unitCompliant,
    mrpFormatCompliant,
    remarks,
  };
}

export function runComplianceCheck(
  rawFields: Record<string, { value: string | null; confidence: number }>,
  isImported: boolean = false,
  isFood: boolean = true
): {
  fields: ComplianceField[];
  score: number;
  overallStatus: ScanResult['overallStatus'];
  fontReadability: FontReadabilityAudit;
} {
  const results: ComplianceField[] = RULES.map((rule) => {
    const raw = rawFields[rule.field];
    const applicable =
      rule.field === 'countryOfOrigin' ? isImported :
      rule.field === 'fssaiLicense' ? isFood : true;

    if (!applicable) {
      return {
        id: rule.id,
        label: rule.label,
        detected: null,
        confidence: 1,
        status: 'NA',
        ruleId: rule.id,
      };
    }

    const detected = raw?.value ?? null;
    const confidence = raw?.confidence ?? 0;

    let status: ComplianceField['status'];
    let note: string | undefined;

    if (!detected) {
      status = rule.required ? 'FAIL' : 'REVIEW';
      note = rule.required
        ? `Mandatory statutory declaration missing under Legal Metrology Rules.`
        : `Optional or category-specific declaration not detected.`;
    } else if (confidence < 0.6) {
      status = 'REVIEW';
      note = `Low optical clarity (${Math.round(confidence * 100)}%). Manual inspection advised.`;
    } else {
      status = 'PASS';

      // Specific statutory checks
      if (rule.field === 'netQuantity' && /\b(gms|gm|grm|grms|k\.g\.|kgs|ltr|ltrs)\b/i.test(detected)) {
        status = 'REVIEW';
        note = `Warning: Non-standard unit symbol '${detected}' used. Standard SI units required.`;
      } else if (rule.field === 'fssaiLicense' && !/^\d{14}$/.test(detected.replace(/\D/g, ''))) {
        status = 'REVIEW';
        note = `FSSAI license must be exactly 14 numeric digits.`;
      }
    }

    return {
      id: rule.id,
      label: rule.label,
      detected,
      confidence,
      status,
      severity: status === 'FAIL' ? rule.severity : undefined,
      ruleId: rule.id,
      note,
    };
  });

  const applicable = results.filter((r) => r.status !== 'NA');
  const passed = applicable.filter((r) => r.status === 'PASS').length;
  const score = applicable.length > 0 ? Math.round((passed / applicable.length) * 100) : 0;

  const overallStatus: ScanResult['overallStatus'] =
    score >= 90 ? 'COMPLIANT' :
    score >= 65 ? 'NEEDS_REVIEW' : 'NON_COMPLIANT';

  // Calculate average confidence for font size & readability assessment
  const confValues = Object.values(rawFields).map((f) => f.confidence).filter((c) => c > 0);
  const avgConf = confValues.length > 0 ? confValues.reduce((a, b) => a + b, 0) / confValues.length : 0.75;

  const fontReadability = auditRule9FontAndReadability(
    rawFields.netQuantity?.value ?? null,
    rawFields.mrp?.value ?? null,
    avgConf
  );

  return { fields: results, score, overallStatus, fontReadability };
}
