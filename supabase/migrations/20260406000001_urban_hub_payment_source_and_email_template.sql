-- Pay Urban Hub (balance) payments: lead source + customer auto-response template
--
-- Intended for the Leads CRM Supabase project (tables: lead_sources, email_templates).
-- The public website database does not have these tables; if you run this there, inserts are skipped.

-- Lead source (CRM only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lead_sources'
  ) THEN
    INSERT INTO public.lead_sources (name, slug, icon, color, display_order)
    VALUES ('Web - Pay Urban Hub', 'web_urban_hub_payment', '💳', '#059669', 18)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Email template (CRM only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_templates'
  )
     AND NOT EXISTS (SELECT 1 FROM public.email_templates WHERE name = 'urban_hub_payment_confirmation')
  THEN
    INSERT INTO public.email_templates (name, subject, body_html, body_text, category, variables, is_active)
    VALUES (
      'urban_hub_payment_confirmation',
      'Payment received — {{payment_type_label}}',
      '<p>Hello {{lead_name}},</p>'
        || '<p>We have received your payment to Urban Hub.</p>'
        || '<p><strong>Payment type:</strong> {{payment_type_label}}</p>'
        || '<p><strong>Amount:</strong> {{currency}} {{amount_gbp}}</p>'
        || '<p><strong>Payment reference:</strong> {{payment_intent_id}}</p>'
        || '<p>Thank you — our team will record this against your account.</p>'
        || '<p>Urban Hub Team</p>',
      'Hello {{lead_name}}, we have received your payment to Urban Hub. Payment type: {{payment_type_label}}. Amount: {{currency}} {{amount_gbp}}. Reference: {{payment_intent_id}}. Thank you.',
      'website_autoresponse',
      '["{{lead_name}}","{{payment_type_label}}","{{payment_type_key}}","{{amount_gbp}}","{{currency}}","{{payment_intent_id}}"]'::jsonb,
      true
    );
  END IF;
END $$;
