-- Migration: Add WordPress form-specific lead sources
-- This allows tracking leads from different WordPress form types separately

-- First, remove old "Website -" entries if they exist (cleanup)
DELETE FROM public.lead_sources 
WHERE slug IN ('website_contact', 'website_booking', 'website_callback', 'website_deposit');

-- Insert WordPress form-specific lead sources with "Web -" naming
INSERT INTO public.lead_sources (name, slug, icon, color, display_order) VALUES
  ('Web - Contact Form', 'web_contact', '📝', '#10B981', 8),
  ('Web - Book Viewing', 'web_booking', '📅', '#3B82F6', 9),
  ('Web - Schedule Callback', 'web_callback', '📞', '#8B5CF6', 10),
  ('Web - Deposit Payment', 'web_deposit', '💰', '#F59E0B', 11)
ON CONFLICT (slug) DO NOTHING;

-- Add comment for clarity
COMMENT ON TABLE public.lead_sources IS 'Dynamic lead source categories. Includes WordPress form types: contact, booking, callback, and deposit forms.';
