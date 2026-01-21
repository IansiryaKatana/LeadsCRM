-- Migration: Convert lead_source enum to dynamic lead_sources table
-- This allows adding/removing lead sources dynamically without code changes

-- Step 1: Create lead_sources table
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_lead_sources_slug ON public.lead_sources(slug);
CREATE INDEX IF NOT EXISTS idx_lead_sources_is_active ON public.lead_sources(is_active);

-- Step 3: Insert all existing sources from enum
-- Map enum values to friendly names and icons
INSERT INTO public.lead_sources (name, slug, icon, color, display_order) VALUES
  ('Google Ads', 'google_ads', '🔍', '#4285F4', 1),
  ('Meta Ads', 'meta', '📘', '#1877F2', 2),
  ('Website', 'website', '🌐', '#10B981', 3),
  ('Referral', 'referral', '👥', '#8B5CF6', 4),
  ('WhatsApp', 'whatsapp', '💬', '#25D366', 5),
  ('Email', 'email', '📧', '#EA4335', 6),
  ('TikTok', 'tiktok', '🎵', '#000000', 7)
ON CONFLICT (slug) DO NOTHING;

-- Step 4: Add a temporary column to store source as TEXT
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_temp TEXT;

-- Step 5: Copy enum values to TEXT column (convert enum to text)
UPDATE public.leads 
SET source_temp = source::text
WHERE source_temp IS NULL;

-- Step 6: Drop the old enum column constraint and rename
-- First, we need to drop the default constraint
ALTER TABLE public.leads ALTER COLUMN source DROP DEFAULT;

-- Step 7: Change the column type from enum to TEXT
-- This requires dropping and recreating the column
ALTER TABLE public.leads DROP COLUMN IF EXISTS source;
ALTER TABLE public.leads RENAME COLUMN source_temp TO source;

-- Step 8: Set default value and NOT NULL constraint
ALTER TABLE public.leads 
  ALTER COLUMN source SET DEFAULT 'website',
  ALTER COLUMN source SET NOT NULL;

-- Step 9: Create trigger function to validate source exists in lead_sources table
CREATE OR REPLACE FUNCTION validate_lead_source()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the source exists in lead_sources table
  IF NOT EXISTS (
    SELECT 1 FROM public.lead_sources 
    WHERE slug = NEW.source
  ) THEN
    RAISE EXCEPTION 'Invalid lead source: % does not exist in lead_sources table', NEW.source;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate source on insert/update
CREATE TRIGGER validate_lead_source_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION validate_lead_source();

-- Step 10: Recreate index on source column
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);

-- Step 11: Create trigger to update updated_at on lead_sources
CREATE OR REPLACE FUNCTION update_lead_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_sources_updated_at();

-- Step 12: Enable RLS on lead_sources table
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies for lead_sources
-- All authenticated users can view active sources
CREATE POLICY "All authenticated users can view active lead sources"
  ON public.lead_sources FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can view all sources (including inactive)
CREATE POLICY "Admins can view all lead sources"
  ON public.lead_sources FOR SELECT
  TO authenticated
  USING (
    is_active = true OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- Only super_admin can insert/update/delete sources
CREATE POLICY "Super admins can manage lead sources"
  ON public.lead_sources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Step 14: Add comment to table
COMMENT ON TABLE public.lead_sources IS 'Dynamic lead source categories that can be managed from the settings page';

