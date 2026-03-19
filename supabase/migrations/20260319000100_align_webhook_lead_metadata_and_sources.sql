-- Align webhook payload storage with live website forms and payment dedupe support

-- Ensure required web lead source slugs exist for all active website form flows.
INSERT INTO public.lead_sources (name, slug, icon, color, display_order) VALUES
  ('Web - Contact Form', 'web_contact', '📝', '#10B981', 8),
  ('Web - Book Viewing', 'web_booking', '📅', '#3B82F6', 9),
  ('Web - Schedule Callback', 'web_callback', '📞', '#8B5CF6', 10),
  ('Web - Deposit Payment', 'web_deposit', '💰', '#F59E0B', 11),
  ('Web - Tourist Inquiry', 'web_tourist', '🏨', '#EC4899', 13),
  ('Web - Keyworker Inquiry', 'web_keyworker', '🚑', '#0EA5E9', 14),
  ('Web - Content Creator', 'web_creator', '📸', '#F472B6', 15),
  ('Web - Secure Booking', 'web_secure_booking', '🔒', '#10B981', 16),
  ('Web - Refer a Friend', 'web_refer_friend', '🤝', '#8B5CF6', 17)
ON CONFLICT (slug) DO NOTHING;

-- Add metadata helpers used by webhook normalization and support/debug views.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Speeds up payment-intent dedupe and metadata exploration.
CREATE INDEX IF NOT EXISTS idx_leads_metadata_gin ON public.leads USING GIN (metadata);

-- Speeds up same-day non-payment dedupe by email/created_at.
CREATE INDEX IF NOT EXISTS idx_leads_email_created_at ON public.leads (email, created_at DESC);
