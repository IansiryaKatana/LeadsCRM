-- Create branding storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for branding bucket
-- Allow public access to view branding assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding');

-- Allow authenticated users with elevated roles to upload/update/delete branding assets
CREATE POLICY "Admins can manage branding assets"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'branding' AND 
  (public.has_elevated_role(auth.uid()))
)
WITH CHECK (
  bucket_id = 'branding' AND 
  (public.has_elevated_role(auth.uid()))
);

-- Ensure notification_emails setting exists in system_settings
-- We use a JSONB array to store the list of emails
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES (
  'notification_emails', 
  '[]'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
