-- Migration: Add system_name setting to system_settings
-- Purpose: Allow the system name to be configurable in settings

INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('system_name', '"ISKA Leads CRM"')
ON CONFLICT (setting_key) DO NOTHING;
