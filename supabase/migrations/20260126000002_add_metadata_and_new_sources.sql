-- Add metadata column to leads if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add new lead sources
INSERT INTO public.lead_sources (name, slug, icon, color, display_order) VALUES
  ('Web - Tourist Inquiry', 'web_tourist', '🏨', '#EC4899', 13),
  ('Web - Keyworker Inquiry', 'web_keyworker', '🚑', '#0EA5E9', 14),
  ('Web - Content Creator', 'web_creator', '📸', '#F472B6', 15),
  ('Web - Secure Booking', 'web_secure_booking', '🔒', '#10B981', 16),
  ('Web - Refer a Friend', 'web_refer_friend', '🤝', '#8B5CF6', 17)
ON CONFLICT (slug) DO NOTHING;
