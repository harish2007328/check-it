export type ComplianceStatus = 'PASS' | 'FAIL' | 'REVIEW' | 'NA';

export type ViolationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'RESOLVED';

export interface ComplianceField {
  id: string;
  label: string;
  detected: string | null;
  confidence: number;         // 0-1
  status: ComplianceStatus;
  severity?: ViolationSeverity;
  ruleId?: string;
  note?: string;
}

export interface FontReadabilityAudit {
  declaredNetQuantity: string | null;
  prescribedMinHeightMm: number;
  estimatedFontHeightMm: number;
  fontSizeCompliant: boolean;
  contrastScore: number;
  readabilityLevel: 'EXCELLENT' | 'ADEQUATE' | 'POOR_CONTRAST';
  unitCompliant: boolean;
  mrpFormatCompliant: boolean;
  remarks: string[];
}

export interface ScanResult {
  id: string;                 // e.g. INS-2026-00124
  timestamp: string;          // ISO date
  productName: string;
  category: string;
  imageUri?: string;
  images?: string[];
  observations?: string[];
  fields: ComplianceField[];
  score: number;              // 0-100
  overallStatus: 'COMPLIANT' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';
  fontReadability?: FontReadabilityAudit;
}

export interface Complaint {
  id: string;                 // e.g. CMP-2026-00124
  scanId: string;
  productName: string;
  category: string;
  imageUri?: string;
  violations: string[];
  notes: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: ComplaintStatus;
  filedAt: string;
  updatedAt: string;
  steps: ComplaintStep[];
}

export interface ComplaintStep {
  label: string;
  description: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  date?: string;
}

export interface Rule {
  id: string;
  field: string;
  label: string;
  required: boolean;
  severity: ViolationSeverity;
  description: string;
}
