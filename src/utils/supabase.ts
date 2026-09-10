import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { ScanResult, Complaint, ComplaintStep } from '../types';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pkwexvmbdlpdayetczse.supabase.co';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_gvAO_5yBl50W8f8J2BkPxQ_pHvXkL_o';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const SCANS_STORAGE_KEY = 'checkit_scans';
const COMPLAINTS_STORAGE_KEY = 'checkit_complaints';

const DEFAULT_STEPS: ComplaintStep[] = [
  {
    label: 'Notice Filed',
    description: 'Complaint submitted to the Department of Legal Metrology.',
    status: 'DONE',
  },
  {
    label: 'Jurisdiction Review',
    description: 'Local controller inspecting packaged commodity compliance.',
    status: 'IN_PROGRESS',
  },
  {
    label: 'Manufacturer Hearing',
    description: 'Show-cause notice response from packer/importer.',
    status: 'PENDING',
  },
];

function isDataUri(s?: string): boolean {
  return typeof s === 'string' && s.startsWith('data:image');
}

function sanitizeScanForStorage(scan: ScanResult): ScanResult {
  const safeImageUri = isDataUri(scan.imageUri) ? undefined : scan.imageUri;
  const safeImages = Array.isArray(scan.images)
    ? scan.images.filter((img) => !isDataUri(img))
    : [];

  return {
    ...scan,
    imageUri: safeImageUri,
    images: safeImages.length > 0 ? safeImages : safeImageUri ? [safeImageUri] : [],
  };
}

function sanitizeComplaintForStorage(complaint: Complaint): Complaint {
  return {
    ...complaint,
    imageUri: isDataUri(complaint.imageUri) ? undefined : complaint.imageUri,
  };
}

/**
 * Fetch all scans from Supabase with AsyncStorage local caching.
 */
export async function fetchScans(): Promise<ScanResult[]> {
  // Read local cache first (auto-recovers if SQLite throws CursorWindow / SQLITE_FULL)
  let localScans: ScanResult[] = [];
  try {
    const local = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
    if (local) localScans = JSON.parse(local);
  } catch (err) {
    console.warn('[Storage] Purging oversized/corrupted scans cache from SQLite:', err);
    await AsyncStorage.removeItem(SCANS_STORAGE_KEY).catch(() => {});
    localScans = [];
  }

  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('[Supabase] Error querying scans table:', error.message);
    } else if (data) {
      const localMap = new Map(localScans.map((s) => [s.id, s]));

      const formatted: ScanResult[] = data.map((item: any) => {
        const localItem = localMap.get(item.id);
        const resolvedImage =
          (item.extracted_data?.imageUri && !isDataUri(item.extracted_data.imageUri))
            ? item.extracted_data.imageUri
            : (item.extracted_data?.image && !isDataUri(item.extracted_data.image))
            ? item.extracted_data.image
            : localItem?.imageUri || undefined;

        const rawImages = Array.isArray(item.extracted_data?.images)
          ? item.extracted_data.images.filter((img: string) => !isDataUri(img))
          : [];

        const resolvedImages =
          rawImages.length > 0
            ? rawImages
            : localItem?.images && localItem.images.length > 0
            ? localItem.images.filter((img) => !isDataUri(img))
            : resolvedImage
            ? [resolvedImage]
            : [];

        return {
          id: item.id,
          timestamp: item.created_at || new Date().toISOString(),
          productName: item.product_name || 'Unnamed Product',
          category: item.category || 'General',
          imageUri: resolvedImage,
          images: resolvedImages,
          observations: Array.isArray(item.violations) ? item.violations : [],
          fields: Array.isArray(item.mandatory_declarations) ? item.mandatory_declarations : [],
          score: Number(item.compliance_score ?? 0),
          overallStatus: item.overall_status || 'NEEDS_REVIEW',
          fontReadability: item.extracted_data?.fontReadability || localItem?.fontReadability,
        };
      });

      // Keep any local scans that may not yet have synced to Supabase
      const serverIds = new Set(formatted.map((s) => s.id));
      const unsyncedLocals = localScans.filter((s) => !serverIds.has(s.id));
      const combined = [...unsyncedLocals, ...formatted].map(sanitizeScanForStorage).slice(0, 30);

      try {
        await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(combined));
      } catch (saveErr) {
        console.warn('[Storage] Could not write updated scans to SQLite cache:', saveErr);
        await AsyncStorage.removeItem(SCANS_STORAGE_KEY).catch(() => {});
      }
      return combined;
    }
  } catch (err) {
    console.warn('[Supabase] Error fetching scans, reading cache:', err);
  }

  return localScans;
}

/**
 * Save a new scan to Supabase and update local cache.
 */
export async function saveScan(scan: ScanResult): Promise<void> {
  // Update local cache first for instant UI response without network delay
  try {
    let current: ScanResult[] = [];
    try {
      const local = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
      if (local) current = JSON.parse(local);
    } catch {
      await AsyncStorage.removeItem(SCANS_STORAGE_KEY).catch(() => {});
      current = [];
    }

    const cleanScan = sanitizeScanForStorage(scan);
    const updated = [cleanScan, ...current.filter((s) => s.id !== scan.id)].slice(0, 30);
    await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[Storage] Error caching scan locally, resetting key:', e);
    await AsyncStorage.removeItem(SCANS_STORAGE_KEY).catch(() => {});
  }

  // Insert or upsert to Supabase matching public.scans schema
  try {
    const brandField = scan.fields?.find(
      (f) => f.id === 'manufacturer' || f.id === 'brand' || f.label?.toLowerCase().includes('brand')
    );

    // Strip out raw base64 data URIs so Supabase JSONB does not balloon into multi-megabytes
    const safeImageUri = isDataUri(scan.imageUri) ? null : scan.imageUri ?? null;
    const safeImages = Array.isArray(scan.images)
      ? scan.images.filter((img) => !isDataUri(img))
      : safeImageUri
      ? [safeImageUri]
      : [];

    const payload = {
      id: scan.id,
      product_name: scan.productName,
      brand: brandField?.detected || null,
      category: scan.category,
      overall_status: scan.overallStatus,
      compliance_score: scan.score,
      mandatory_declarations: scan.fields ?? [],
      violations: scan.observations ?? [],
      extracted_data: {
        imageUri: safeImageUri,
        images: safeImages,
        fontReadability: scan.fontReadability ?? null,
      },
      raw_ocr_text: null,
      created_at: scan.timestamp || new Date().toISOString(),
    };

    const { error } = await supabase.from('scans').upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Failed to save scan to database:', error.message, error.details);
    } else {
      console.log('[Supabase] Successfully saved scan to database:', scan.id);
    }
  } catch (err) {
    console.warn('[Supabase] Unexpected error saving scan:', err);
  }
}

/**
 * Fetch registered complaints from Supabase with AsyncStorage local caching.
 */
export async function fetchComplaints(): Promise<Complaint[]> {
  // Read local cache first (auto-recovers from SQLite errors)
  let localComplaints: Complaint[] = [];
  try {
    const local = await AsyncStorage.getItem(COMPLAINTS_STORAGE_KEY);
    if (local) localComplaints = JSON.parse(local);
  } catch (err) {
    console.warn('[Storage] Purging oversized/corrupted complaints cache from SQLite:', err);
    await AsyncStorage.removeItem(COMPLAINTS_STORAGE_KEY).catch(() => {});
    localComplaints = [];
  }

  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('[Supabase] Error querying complaints table:', error.message);
    } else if (data) {
      const localMap = new Map(localComplaints.map((c) => [c.id, c]));

      const formatted: Complaint[] = data.map((item: any) => {
        const localItem = localMap.get(item.id);
        const v = item.violations;
        const violationsList: string[] = Array.isArray(v)
          ? v
          : Array.isArray(v?.list)
          ? v.list
          : [];
        const notes = (!Array.isArray(v) && v?.notes) ? v.notes : '';
        const severity = (!Array.isArray(v) && v?.severity) ? v.severity : 'MEDIUM';
        const category = (!Array.isArray(v) && v?.category) ? v.category : 'General';
        const steps = (!Array.isArray(v) && Array.isArray(v?.steps)) ? v.steps : DEFAULT_STEPS;
        const resolvedImage =
          (v?.imageUri && !isDataUri(v.imageUri))
            ? v.imageUri
            : localItem?.imageUri || undefined;

        return {
          id: item.id,
          scanId: item.scan_id || '',
          productName: item.product_name || 'Unnamed Product',
          category,
          imageUri: resolvedImage,
          violations: violationsList,
          notes,
          severity,
          status: item.status || 'SUBMITTED',
          filedAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
          steps,
        };
      });

      const serverIds = new Set(formatted.map((c) => c.id));
      const unsyncedLocals = localComplaints.filter((c) => !serverIds.has(c.id));
      const combined = [...unsyncedLocals, ...formatted].map(sanitizeComplaintForStorage).slice(0, 30);

      try {
        await AsyncStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(combined));
      } catch (saveErr) {
        console.warn('[Storage] Could not write updated complaints to SQLite cache:', saveErr);
        await AsyncStorage.removeItem(COMPLAINTS_STORAGE_KEY).catch(() => {});
      }
      return combined;
    }
  } catch (err) {
    console.warn('[Supabase] Error fetching complaints, reading cache:', err);
  }

  return localComplaints;
}

/**
 * Save a newly filed complaint to Supabase and update local cache.
 */
export async function saveComplaint(complaint: Complaint): Promise<void> {
  // Update local cache first
  try {
    let current: Complaint[] = [];
    try {
      const local = await AsyncStorage.getItem(COMPLAINTS_STORAGE_KEY);
      if (local) current = JSON.parse(local);
    } catch {
      await AsyncStorage.removeItem(COMPLAINTS_STORAGE_KEY).catch(() => {});
      current = [];
    }

    const cleanComplaint = sanitizeComplaintForStorage(complaint);
    const updated = [cleanComplaint, ...current.filter((c) => c.id !== complaint.id)].slice(0, 30);
    await AsyncStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[Storage] Error caching complaint locally, resetting key:', e);
    await AsyncStorage.removeItem(COMPLAINTS_STORAGE_KEY).catch(() => {});
  }

  // Insert or upsert to Supabase matching public.complaints schema
  try {
    const safeImageUri = (complaint.imageUri && !isDataUri(complaint.imageUri)) ? complaint.imageUri : null;
    const payload = {
      id: complaint.id,
      scan_id: complaint.scanId,
      product_name: complaint.productName,
      brand: null,
      status: complaint.status,
      authority: 'Department of Legal Metrology',
      violations: {
        list: complaint.violations,
        notes: complaint.notes,
        severity: complaint.severity,
        category: complaint.category,
        steps: complaint.steps,
        imageUri: safeImageUri,
      },
      created_at: complaint.filedAt || new Date().toISOString(),
      updated_at: complaint.updatedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('complaints').upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Failed to save complaint to database:', error.message, error.details);
    } else {
      console.log('[Supabase] Successfully saved complaint to database:', complaint.id);
    }
  } catch (err) {
    console.warn('[Supabase] Unexpected error saving complaint:', err);
  }
}
