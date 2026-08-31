import { ScanResult, Complaint } from '../types';

// ─── Sample Scan Results for Demo ─────────────────────────────────────────────

export const MOCK_SCANS: ScanResult[] = [
  {
    id: 'INS-2026-00124',
    timestamp: '2026-08-31T09:15:00Z',
    productName: 'India Gate Basmati Rice',
    category: 'Food',
    score: 92,
    overallStatus: 'COMPLIANT',
    fields: [
      { id: 'RULE-001', label: 'Product / Commodity Name', detected: 'Basmati Rice (Extra Long Grain)', confidence: 0.98, status: 'PASS', ruleId: 'RULE-001' },
      { id: 'RULE-002', label: 'Manufacturer / Packer / Importer', detected: 'KRBL Ltd.', confidence: 0.96, status: 'PASS', ruleId: 'RULE-002' },
      { id: 'RULE-003', label: 'Complete Address', detected: 'KRBL Ltd., 5190 Lahori Gate, Delhi - 110006', confidence: 0.91, status: 'PASS', ruleId: 'RULE-003' },
      { id: 'RULE-004', label: 'Net Quantity', detected: '5 kg', confidence: 0.99, status: 'PASS', ruleId: 'RULE-004' },
      { id: 'RULE-005', label: 'MRP (Incl. all taxes)', detected: '₹650', confidence: 0.97, status: 'PASS', ruleId: 'RULE-005' },
      { id: 'RULE-006', label: 'Date of Manufacture / Packing', detected: 'Jul 2026', confidence: 0.94, status: 'PASS', ruleId: 'RULE-006' },
      { id: 'RULE-007', label: 'Best Before / Use By / Expiry', detected: 'Jul 2027', confidence: 0.93, status: 'PASS', ruleId: 'RULE-007' },
      { id: 'RULE-008', label: 'Country of Origin', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-008' },
      { id: 'RULE-009', label: 'Consumer Care Details', detected: '1800-103-1208', confidence: 0.88, status: 'PASS', ruleId: 'RULE-009' },
      { id: 'RULE-010', label: 'Unit Sale Price', detected: null, confidence: 0.55, status: 'REVIEW', ruleId: 'RULE-010', note: 'Low OCR confidence (55%). Manual verification recommended.' },
      { id: 'RULE-011', label: 'FSSAI License No.', detected: '10013022002765', confidence: 0.95, status: 'PASS', ruleId: 'RULE-011' },
      { id: 'RULE-012', label: 'Batch / Lot Number', detected: 'B2607004', confidence: 0.92, status: 'PASS', ruleId: 'RULE-012' },
    ],
  },
  {
    id: 'INS-2026-00123',
    timestamp: '2026-08-31T08:42:00Z',
    productName: 'Dove Beauty Bar Soap',
    category: 'Personal Care',
    score: 71,
    overallStatus: 'NEEDS_REVIEW',
    fields: [
      { id: 'RULE-001', label: 'Product / Commodity Name', detected: 'Beauty Bar', confidence: 0.96, status: 'PASS', ruleId: 'RULE-001' },
      { id: 'RULE-002', label: 'Manufacturer / Packer / Importer', detected: 'Hindustan Unilever Ltd.', confidence: 0.95, status: 'PASS', ruleId: 'RULE-002' },
      { id: 'RULE-003', label: 'Complete Address', detected: 'Andheri East, Mumbai', confidence: 0.58, status: 'REVIEW', ruleId: 'RULE-003', note: 'Low OCR confidence (58%). Manual verification recommended.' },
      { id: 'RULE-004', label: 'Net Quantity', detected: '100 g', confidence: 0.98, status: 'PASS', ruleId: 'RULE-004' },
      { id: 'RULE-005', label: 'MRP (Incl. all taxes)', detected: '₹55', confidence: 0.93, status: 'PASS', ruleId: 'RULE-005' },
      { id: 'RULE-006', label: 'Date of Manufacture / Packing', detected: null, confidence: 0.22, status: 'FAIL', severity: 'HIGH', ruleId: 'RULE-006' },
      { id: 'RULE-007', label: 'Best Before / Use By / Expiry', detected: null, confidence: 0.18, status: 'FAIL', severity: 'HIGH', ruleId: 'RULE-007' },
      { id: 'RULE-008', label: 'Country of Origin', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-008' },
      { id: 'RULE-009', label: 'Consumer Care Details', detected: '1800-22-0022', confidence: 0.87, status: 'PASS', ruleId: 'RULE-009' },
      { id: 'RULE-010', label: 'Unit Sale Price', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-010' },
      { id: 'RULE-011', label: 'FSSAI License No.', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-011' },
      { id: 'RULE-012', label: 'Batch / Lot Number', detected: 'B26H41', confidence: 0.9, status: 'PASS', ruleId: 'RULE-012' },
    ],
  },
  {
    id: 'INS-2026-00122',
    timestamp: '2026-08-30T15:20:00Z',
    productName: 'Fortune Sunflower Oil',
    category: 'Food',
    score: 54,
    overallStatus: 'NON_COMPLIANT',
    fields: [
      { id: 'RULE-001', label: 'Product / Commodity Name', detected: 'Refined Sunflower Oil', confidence: 0.95, status: 'PASS', ruleId: 'RULE-001' },
      { id: 'RULE-002', label: 'Manufacturer / Packer / Importer', detected: null, confidence: 0.21, status: 'FAIL', severity: 'HIGH', ruleId: 'RULE-002' },
      { id: 'RULE-003', label: 'Complete Address', detected: null, confidence: 0.15, status: 'FAIL', severity: 'HIGH', ruleId: 'RULE-003' },
      { id: 'RULE-004', label: 'Net Quantity', detected: '1 L', confidence: 0.97, status: 'PASS', ruleId: 'RULE-004' },
      { id: 'RULE-005', label: 'MRP (Incl. all taxes)', detected: '₹165', confidence: 0.92, status: 'PASS', ruleId: 'RULE-005' },
      { id: 'RULE-006', label: 'Date of Manufacture / Packing', detected: 'Jun 2026', confidence: 0.88, status: 'PASS', ruleId: 'RULE-006' },
      { id: 'RULE-007', label: 'Best Before / Use By / Expiry', detected: 'Jun 2027', confidence: 0.85, status: 'PASS', ruleId: 'RULE-007' },
      { id: 'RULE-008', label: 'Country of Origin', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-008' },
      { id: 'RULE-009', label: 'Consumer Care Details', detected: null, confidence: 0.3, status: 'FAIL', severity: 'MEDIUM', ruleId: 'RULE-009' },
      { id: 'RULE-010', label: 'Unit Sale Price', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-010' },
      { id: 'RULE-011', label: 'FSSAI License No.', detected: null, confidence: 0.2, status: 'FAIL', severity: 'MEDIUM', ruleId: 'RULE-011' },
      { id: 'RULE-012', label: 'Batch / Lot Number', detected: null, confidence: 0.19, status: 'FAIL', severity: 'MEDIUM', ruleId: 'RULE-012' },
    ],
  },
  {
    id: 'INS-2026-00121',
    timestamp: '2026-08-30T11:00:00Z',
    productName: 'Britannia Good Day Biscuits',
    category: 'Food',
    score: 96,
    overallStatus: 'COMPLIANT',
    fields: [
      { id: 'RULE-001', label: 'Product / Commodity Name', detected: 'Good Day Butter Cookies', confidence: 0.99, status: 'PASS', ruleId: 'RULE-001' },
      { id: 'RULE-002', label: 'Manufacturer / Packer / Importer', detected: 'Britannia Industries Ltd.', confidence: 0.98, status: 'PASS', ruleId: 'RULE-002' },
      { id: 'RULE-003', label: 'Complete Address', detected: '5/1A, Hungerford Street, Kolkata - 700017', confidence: 0.94, status: 'PASS', ruleId: 'RULE-003' },
      { id: 'RULE-004', label: 'Net Quantity', detected: '216 g', confidence: 0.99, status: 'PASS', ruleId: 'RULE-004' },
      { id: 'RULE-005', label: 'MRP (Incl. all taxes)', detected: '₹40', confidence: 0.98, status: 'PASS', ruleId: 'RULE-005' },
      { id: 'RULE-006', label: 'Date of Manufacture / Packing', detected: 'Aug 2026', confidence: 0.97, status: 'PASS', ruleId: 'RULE-006' },
      { id: 'RULE-007', label: 'Best Before / Use By / Expiry', detected: 'Feb 2027', confidence: 0.96, status: 'PASS', ruleId: 'RULE-007' },
      { id: 'RULE-008', label: 'Country of Origin', detected: null, confidence: 1, status: 'NA', ruleId: 'RULE-008' },
      { id: 'RULE-009', label: 'Consumer Care Details', detected: '1800-103-1234', confidence: 0.91, status: 'PASS', ruleId: 'RULE-009' },
      { id: 'RULE-010', label: 'Unit Sale Price', detected: '₹18.52/100g', confidence: 0.89, status: 'PASS', ruleId: 'RULE-010' },
      { id: 'RULE-011', label: 'FSSAI License No.', detected: '10013022001234', confidence: 0.96, status: 'PASS', ruleId: 'RULE-011' },
      { id: 'RULE-012', label: 'Batch / Lot Number', detected: 'B260811', confidence: 0.95, status: 'PASS', ruleId: 'RULE-012' },
    ],
  },
];

// ─── Sample Complaints ─────────────────────────────────────────────────────────

export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'CMP-2026-00087',
    scanId: 'INS-2026-00122',
    productName: 'Fortune Sunflower Oil',
    category: 'Food',
    violations: ['Manufacturer/Packer not declared', 'FSSAI license missing', 'Consumer care details missing'],
    notes: 'Product found at Reliance Fresh, Whitefield, Bengaluru. Multiple mandatory declarations absent.',
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    filedAt: '2026-08-30T15:45:00Z',
    updatedAt: '2026-08-31T08:00:00Z',
    steps: [
      { label: 'Complaint Submitted', description: 'Complaint registered with reference ID', status: 'DONE', date: '30 Aug 2026, 09:15 PM' },
      { label: 'Under Review', description: 'Assigned to Legal Metrology Officer', status: 'IN_PROGRESS', date: '31 Aug 2026, 08:00 AM' },
      { label: 'Manufacturer Notified', description: 'Show cause notice to be issued', status: 'PENDING' },
      { label: 'Resolution', description: 'Case closed with order', status: 'PENDING' },
    ],
  },
  {
    id: 'CMP-2026-00086',
    scanId: 'INS-2026-00123',
    productName: 'Dove Beauty Bar Soap',
    category: 'Personal Care',
    violations: ['Date of manufacture missing', 'Best before date missing'],
    notes: 'Date information completely absent on outer packaging.',
    severity: 'MEDIUM',
    status: 'ASSIGNED',
    filedAt: '2026-08-31T08:55:00Z',
    updatedAt: '2026-08-31T09:30:00Z',
    steps: [
      { label: 'Complaint Submitted', description: 'Complaint registered with reference ID', status: 'DONE', date: '31 Aug 2026, 08:55 AM' },
      { label: 'Under Review', description: 'Initial review completed', status: 'DONE', date: '31 Aug 2026, 09:20 AM' },
      { label: 'Manufacturer Notified', description: 'Assigned to field inspector', status: 'IN_PROGRESS', date: '31 Aug 2026, 09:30 AM' },
      { label: 'Resolution', description: 'Awaiting manufacturer response', status: 'PENDING' },
    ],
  },
];

// ─── Simulate new scan from camera ────────────────────────────────────────────

export function simulateScan(imageUri: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Randomly pick from predefined scans to vary demo results
      const templates = MOCK_SCANS;
      const template = templates[Math.floor(Math.random() * templates.length)];
      const now = new Date().toISOString();
      const id = `INS-2026-${String(Date.now()).slice(-5)}`;
      resolve({ ...template, id, timestamp: now, imageUri });
    }, 3000); // 3 second simulated processing
  });
}
