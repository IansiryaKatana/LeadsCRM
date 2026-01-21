-- Migration: Add landing_page metadata to leads
-- Purpose: Store landing page / form name for web leads

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS landing_page TEXT;

-- Optional index if we filter by landing_page later
CREATE INDEX IF NOT EXISTS idx_leads_landing_page ON public.leads(landing_page);

