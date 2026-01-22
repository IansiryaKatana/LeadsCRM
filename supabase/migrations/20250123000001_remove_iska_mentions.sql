-- Migration: Remove ISKA and Lovable mentions from database records
-- Purpose: Ensure no historical data contains the old names

-- 1. Update Email Templates
UPDATE public.email_templates 
SET 
  subject = REPLACE(REPLACE(subject, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub'),
  body_html = REPLACE(REPLACE(body_html, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub'),
  name = REPLACE(REPLACE(name, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub');

-- 2. Update System Settings
UPDATE public.system_settings 
SET setting_value = REPLACE(REPLACE(setting_value::text, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub')::jsonb
WHERE setting_value::text ILIKE '%ISKA%';

-- 3. Update Leads (just in case they contain these names in notes or source names)
UPDATE public.leads
SET 
  notes = REPLACE(REPLACE(notes, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub')
WHERE notes ILIKE '%ISKA%';

-- 4. Update Audit Trail
UPDATE public.audit_trail
SET 
  new_values = REPLACE(REPLACE(new_values::text, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub')::jsonb,
  old_values = REPLACE(REPLACE(old_values::text, 'ISKA', 'Urban Hub'), 'iska', 'Urban Hub')::jsonb
WHERE new_values::text ILIKE '%ISKA%' OR old_values::text ILIKE '%ISKA%';
