-- ==============================================================================
-- 🚀 SUPABASE DATABASE SCHEMA FOR SMART REVIEW STANDEES
-- Run this script in the Supabase SQL Editor (SQL Editor -> New query -> Run)
-- ==============================================================================

-- 1. Create standees table
CREATE TABLE IF NOT EXISTS public.standees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_code TEXT UNIQUE NOT NULL,
  business_name TEXT,
  google_review_url TEXT,
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Design & Customization
  logo_url TEXT,
  theme TEXT DEFAULT 'luxury-dark',
  primary_color TEXT DEFAULT '#F59E0B',
  accent_color TEXT DEFAULT '#D97706',
  background_color TEXT DEFAULT '#0A0E1A',
  headline TEXT DEFAULT 'Rate Your Experience',
  subheadline TEXT DEFAULT 'Point your camera to scan • Rate in 5 seconds',
  cta_text TEXT DEFAULT 'Review us on Google',
  qr_style JSONB DEFAULT '{"dot_color": "#F59E0B", "corner_color": "#D97706", "center_logo": true}'::jsonb,
  qr_target_mode TEXT DEFAULT 'direct_google',
  custom_qr_url TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.standees ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Allow public read access to standees" ON public.standees;
CREATE POLICY "Allow public read access to standees"
ON public.standees FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow full access for all operations" ON public.standees;
CREATE POLICY "Allow full access for all operations"
ON public.standees FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 4. Atomic scan counter increment function
CREATE OR REPLACE FUNCTION increment_standee_scan(p_serial_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.standees
  SET 
    scan_count = COALESCE(scan_count, 0) + 1,
    last_scanned_at = now(),
    updated_at = now()
  WHERE UPPER(serial_code) = UPPER(p_serial_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Pre-seed default starter standees
INSERT INTO public.standees (
  serial_code, business_name, google_review_url, whatsapp_number, is_active, scan_count, theme, primary_color, accent_color, background_color, headline, subheadline, cta_text, qr_target_mode
) VALUES 
(
  'ST-101', 
  'BURMIX', 
  'https://search.google.com/local/writereview?placeid=ChIJUwNMnqBhUjoR-60P8RSKHwo', 
  '919710707522', 
  true, 
  69, 
  'luxury-dark', 
  '#F59E0B', 
  '#D97706', 
  '#0A0E1A', 
  'Rate Your Experience', 
  'Point your camera to scan • Rate in 5 seconds', 
  'Review us on Google', 
  'direct_google'
),
(
  'ST-102', 
  'Apex Dental & Orthodontics', 
  'https://maps.app.goo.gl/dental-example', 
  '919876543211', 
  true, 
  19, 
  'clean-white', 
  '#0D9488', 
  '#14B8A6', 
  '#FFFFFF', 
  'How Was Your Smile Visit?', 
  'Quick feedback helps our clinic care for you even better', 
  'Leave a 5-Star Review', 
  'smart_filter'
),
(
  'ST-103', 
  'Luxe Studio & Day Spa', 
  'https://maps.app.goo.gl/salon-example', 
  '919876543212', 
  true, 
  67, 
  'luxury-dark', 
  '#E11D48', 
  '#FB7185', 
  '#0F172A', 
  'Loving Your Fresh New Look?', 
  'Scan to rate your styling session in 5 seconds', 
  'Rate Your Stylist', 
  'smart_filter'
)
ON CONFLICT (serial_code) DO NOTHING;
