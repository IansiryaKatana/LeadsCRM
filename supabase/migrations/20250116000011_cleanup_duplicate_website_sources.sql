-- Migration: Cleanup duplicate WordPress form lead sources
-- Removes old "Website -" entries if they exist, keeping only "Web -" versions

-- Delete old "Website -" entries if they exist
DELETE FROM public.lead_sources 
WHERE slug IN ('website_contact', 'website_booking', 'website_callback', 'website_deposit');

-- Note: If you have existing leads using the old slugs, you may want to update them first:
-- UPDATE public.leads SET source = 'web_contact' WHERE source = 'website_contact';
-- UPDATE public.leads SET source = 'web_booking' WHERE source = 'website_booking';
-- UPDATE public.leads SET source = 'web_callback' WHERE source = 'website_callback';
-- UPDATE public.leads SET source = 'web_deposit' WHERE source = 'website_deposit';
