-- Migration: Add Web Keyworkers lead source

INSERT INTO public.lead_sources (name, slug, icon, color, display_order)
VALUES ('Web - Keyworkers', 'web_keyworkers', 'briefcase', '#0EA5E9', 12)
ON CONFLICT (slug) DO NOTHING;

