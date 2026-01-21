-- Migration: Add email_from_address setting to system_settings
-- Purpose: Allow the email from address to be configurable for verified Resend domains

INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('email_from_address', '"ISKA CRM <noreply@send.portal.urbanhub.uk>"')
ON CONFLICT (setting_key) DO NOTHING;
