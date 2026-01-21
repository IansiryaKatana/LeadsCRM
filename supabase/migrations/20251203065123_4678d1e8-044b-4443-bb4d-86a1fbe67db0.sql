-- Add academic_year column to leads table
ALTER TABLE public.leads 
ADD COLUMN academic_year TEXT NOT NULL DEFAULT '2024/2025';

-- Create index for filtering by academic year
CREATE INDEX idx_leads_academic_year ON public.leads (academic_year);

-- Add academic_years to system_settings to track available years
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('academic_years', '["2024/2025", "2025/2026"]'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Add default_academic_year setting
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('default_academic_year', '"2025/2026"'::jsonb)
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;