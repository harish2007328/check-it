import { ScanResult, Complaint } from '../types';

// ─── Real Database Storage Datasets (Initial Mock Data Removed) ────────────────
export const MOCK_SCANS: ScanResult[] = [];

export const MOCK_COMPLAINTS: Complaint[] = [];

// Fallback simulate function
export function simulateScan(imageUri: string): Promise<ScanResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      const id = `INS-2026-${String(Date.now()).slice(-5)}`;
      resolve({
        id,
        timestamp: now,
        productName: 'Sample Commodity',
        category: 'General',
        imageUri,
        fields: [],
        score: 100,
        overallStatus: 'COMPLIANT',
      });
    }, 1500);
  });
}
