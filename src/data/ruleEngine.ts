import { Rule, ComplianceField, ScanResult } from '../types';

// ─── Legal Metrology Rules (Legal Metrology (Packaged Commodities) Rules) ────
export const RULES: Rule[] = [
  {
    id: 'RULE-001',
    field: 'productName',
    label: 'Product / Commodity Name',
    required: true,
    severity: 'HIGH',
    description: 'The name of the commodity must be declared on the package.',
  },
  {
    id: 'RULE-002',
    field: 'manufacturer',
    label: 'Manufacturer / Packer / Importer',
    required: true,
    severity: 'HIGH',
    description: 'Name and address of manufacturer, packer or importer must be declared.',
  },
  {
    id: 'RULE-003',
    field: 'address',
    label: 'Complete Address',
    required: true,
    severity: 'HIGH',
    description: 'Complete postal address including PIN code of manufacturer/packer/importer.',
  },
  {
    id: 'RULE-004',
    field: 'netQuantity',
    label: 'Net Quantity',
    required: true,
    severity: 'CRITICAL',
    description: 'Net quantity by weight, measure or number must be declared in standard units.',
  },
  {
    id: 'RULE-005',
    field: 'mrp',
    label: 'MRP (Incl. all taxes)',
    required: true,
    severity: 'CRITICAL',
    description: 'Maximum Retail Price inclusive of all taxes must be declared.',
  },
  {
    id: 'RULE-006',
    field: 'dateOfManufacture',
    label: 'Date of Manufacture / Packing',
    required: true,
    severity: 'HIGH',
    description: 'Month and year of manufacture or packing must be declared.',
  },
  {
    id: 'RULE-007',
    field: 'bestBefore',
    label: 'Best Before / Use By / Expiry',
    required: true,
    severity: 'HIGH',
    description: 'Best before or expiry date must be declared for perishable commodities.',
  },
  {
    id: 'RULE-008',
    field: 'countryOfOrigin',
    label: 'Country of Origin',
    required: false, // required only for imports
    severity: 'HIGH',
    description: 'Country of origin must be declared for imported products.',
  },
  {
    id: 'RULE-009',
    field: 'consumerCare',
    label: 'Consumer Care Details',
    required: true,
    severity: 'MEDIUM',
    description: 'Consumer care number / email must be declared on the package.',
  },
  {
    id: 'RULE-010',
    field: 'unitSalePrice',
    label: 'Unit Sale Price',
    required: false,
    severity: 'LOW',
    description: 'Unit sale price required where quantity is above the standard limit.',
  },
  {
    id: 'RULE-011',
    field: 'fssaiLicense',
    label: 'FSSAI License No.',
    required: false, // food products only
    severity: 'MEDIUM',
    description: 'FSSAI license/registration number required for food products.',
  },
  {
    id: 'RULE-012',
    field: 'batchNo',
    label: 'Batch / Lot Number',
    required: true,
    severity: 'MEDIUM',
    description: 'Batch number or lot number must be declared for traceability.',
  },
];

// ─── Simulated AI + Rule Engine ───────────────────────────────────────────────

function randomConf(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

export function runComplianceCheck(
  rawFields: Record<string, { value: string | null; confidence: number }>,
  isImported: boolean = false,
  isFood: boolean = true
): { fields: ComplianceField[]; score: number; overallStatus: ScanResult['overallStatus'] } {
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
    if (!detected) {
      status = rule.required ? 'FAIL' : 'REVIEW';
    } else if (confidence < 0.6) {
      status = 'REVIEW';
    } else {
      status = 'PASS';
    }

    return {
      id: rule.id,
      label: rule.label,
      detected,
      confidence,
      status,
      severity: status === 'FAIL' ? rule.severity : undefined,
      ruleId: rule.id,
      note:
        status === 'REVIEW'
          ? confidence < 0.6
            ? `Low OCR confidence (${Math.round(confidence * 100)}%). Manual verification recommended.`
            : 'Value detected but requires manual verification.'
          : undefined,
    };
  });

  const applicable = results.filter((r) => r.status !== 'NA');
  const passed = applicable.filter((r) => r.status === 'PASS').length;
  const score = applicable.length > 0 ? Math.round((passed / applicable.length) * 100) : 0;

  const overallStatus: ScanResult['overallStatus'] =
    score >= 90 ? 'COMPLIANT' :
    score >= 65 ? 'NEEDS_REVIEW' : 'NON_COMPLIANT';

  return { fields: results, score, overallStatus };
}
