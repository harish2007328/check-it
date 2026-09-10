-- ==============================================================================
-- CHECK-IT: AI LEGAL METROLOGY COMPLIANCE SYSTEM
-- Complete Supabase Schema, Policies, Realtime & Storage Setup
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. SCANS TABLE
-- Stores all AI package scans, compliance scores, OCR data, and image evidence
CREATE TABLE IF NOT EXISTS public.scans (
    id TEXT PRIMARY KEY,                             -- e.g. 'INS-2026-00124' or UUID
    product_name TEXT NOT NULL,
    brand TEXT,
    category TEXT DEFAULT 'General',
    overall_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW', -- 'COMPLIANT', 'NEEDS_REVIEW', 'NON_COMPLIANT'
    compliance_score NUMERIC DEFAULT 0,              -- 0 to 100
    mandatory_declarations JSONB DEFAULT '[]'::jsonb, -- Array of ComplianceField objects
    violations JSONB DEFAULT '[]'::jsonb,            -- Array of detected violation strings
    extracted_data JSONB DEFAULT '{}'::jsonb,        -- imageUri, images array, fontReadability audit
    raw_ocr_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMPLAINTS TABLE
-- Stores registered legal metrology violation notices and enforcement records
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,                             -- e.g. 'CMP-2026-00124'
    scan_id TEXT REFERENCES public.scans(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',         -- 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED'
    authority TEXT DEFAULT 'Department of Legal Metrology',
    violations JSONB DEFAULT '{}'::jsonb,            -- list, notes, severity, category, steps, imageUri
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. AUTOMATIC UPDATED_AT TRIGGER FOR COMPLAINTS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_complaints_updated_at ON public.complaints;
CREATE TRIGGER trigger_complaints_updated_at
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans (overall_status);
CREATE INDEX IF NOT EXISTS idx_scans_category ON public.scans (category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_scan_id ON public.complaints (scan_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints (status);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures mobile app with anon key can read, insert, and update scans and complaints
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Scans Policies (Allow anonymous read and upsert)
DROP POLICY IF EXISTS "Allow public read on scans" ON public.scans;
CREATE POLICY "Allow public read on scans"
    ON public.scans FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public insert/upsert on scans" ON public.scans;
CREATE POLICY "Allow public insert/upsert on scans"
    ON public.scans FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on scans" ON public.scans;
CREATE POLICY "Allow public update on scans"
    ON public.scans FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Complaints Policies (Allow anonymous read and upsert)
DROP POLICY IF EXISTS "Allow public read on complaints" ON public.complaints;
CREATE POLICY "Allow public read on complaints"
    ON public.complaints FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public insert/upsert on complaints" ON public.complaints;
CREATE POLICY "Allow public insert/upsert on complaints"
    ON public.complaints FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on complaints" ON public.complaints;
CREATE POLICY "Allow public update on complaints"
    ON public.complaints FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. ENABLE REALTIME BROADCASTING
-- Allows live syncing between mobile inspections and web dashboard
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 7. SUPABASE STORAGE BUCKET FOR EVIDENCE PHOTOS
-- Creates a public bucket 'evidence-photos' for scanned package images
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-photos', 'evidence-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view and upload photos to the bucket
DROP POLICY IF EXISTS "Public can view evidence photos" ON storage.objects;
CREATE POLICY "Public can view evidence photos"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'evidence-photos');

DROP POLICY IF EXISTS "Public can upload evidence photos" ON storage.objects;
CREATE POLICY "Public can upload evidence photos"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'evidence-photos');

-- 8. USEFUL ANALYTICS VIEWS
-- Instant compliance summary dashboard view
CREATE OR REPLACE VIEW public.view_compliance_summary AS
SELECT
    COUNT(*) AS total_scans,
    COUNT(*) FILTER (WHERE overall_status = 'COMPLIANT') AS compliant_count,
    COUNT(*) FILTER (WHERE overall_status = 'NON_COMPLIANT') AS non_compliant_count,
    COUNT(*) FILTER (WHERE overall_status = 'NEEDS_REVIEW') AS needs_review_count,
    ROUND(AVG(compliance_score), 1) AS avg_compliance_score,
    (SELECT COUNT(*) FROM public.complaints) AS total_complaints_filed
FROM public.scans;
