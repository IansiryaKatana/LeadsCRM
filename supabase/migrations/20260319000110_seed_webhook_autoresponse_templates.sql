-- Seed website webhook auto-response templates keyed by webhook resolver names.
-- Name is intentionally the template key used by webhook (resolvedEmailTemplate).

INSERT INTO public.email_templates (name, subject, body_html, body_text, category, variables, is_active)
VALUES
(
  'viewing_confirmation',
  'Viewing Request Received - {{preferred_date}} {{preferred_time}}',
  '<p>Hello {{lead_name}},</p><p>We received your viewing request for {{preferred_date}} {{preferred_time}}.</p><p>Our team will confirm shortly.</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, we received your viewing request for {{preferred_date}} {{preferred_time}}. Our team will confirm shortly.',
  'website_autoresponse',
  '["{{lead_name}}","{{preferred_date}}","{{preferred_time}}"]'::jsonb,
  true
),
(
  'callback_confirmation',
  'Callback Request Received - Urban Hub',
  '<p>Hello {{lead_name}},</p><p>Your callback request has been received. Preferred date/time: {{preferred_date}} {{preferred_time}}.</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, your callback request has been received. Preferred date/time: {{preferred_date}} {{preferred_time}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{preferred_date}}","{{preferred_time}}"]'::jsonb,
  true
),
(
  'inquiry_confirmation',
  'We Received Your Inquiry - Urban Hub',
  '<p>Hello {{lead_name}},</p><p>We have received your inquiry.</p><p><strong>Reason:</strong> {{reason}}</p><p><strong>Message:</strong> {{message}}</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, we received your inquiry. Reason: {{reason}}. Message: {{message}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{reason}}","{{message}}"]'::jsonb,
  true
),
(
  'resident_support_confirmation',
  'Resident Support Request Logged - Urban Hub',
  '<p>Hello {{lead_name}},</p><p>Your resident support request has been logged.</p><p><strong>Reason:</strong> {{reason}}</p><p><strong>Message:</strong> {{message}}</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, your resident support request has been logged. Reason: {{reason}}. Message: {{message}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{reason}}","{{message}}"]'::jsonb,
  true
),
(
  'shortstay_tourist_confirmation',
  'Short Stay Request Received - Tourist ({{start_date}} to {{end_date}})',
  '<p>Hello {{lead_name}},</p><p>We received your tourist short-stay request from {{start_date}} to {{end_date}}.</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, we received your tourist short-stay request from {{start_date}} to {{end_date}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{start_date}}","{{end_date}}"]'::jsonb,
  true
),
(
  'shortstay_keyworker_confirmation',
  'Short Stay Request Received - Keyworker ({{start_date}} to {{end_date}})',
  '<p>Hello {{lead_name}},</p><p>We received your keyworker short-stay request from {{start_date}} to {{end_date}}.</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, we received your keyworker short-stay request from {{start_date}} to {{end_date}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{start_date}}","{{end_date}}"]'::jsonb,
  true
),
(
  'refer_friend_deposit_confirmation',
  'Deposit Received - Refer a Friend Application',
  '<p>Hello {{lead_name}},</p><p>We have received your referral deposit.</p><p><strong>Payment reference:</strong> {{payment_intent_id}}</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, we have received your referral deposit. Payment reference: {{payment_intent_id}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{payment_intent_id}}"]'::jsonb,
  true
),
(
  'pay_deposit',
  'Deposit Payment Received - Booking Secured',
  '<p>Hello {{lead_name}},</p><p>Your booking deposit payment has been received.</p><p><strong>Amount:</strong> GBP {{amount_gbp}}</p><p><strong>Payment reference:</strong> {{payment_intent_id}}</p><p><strong>Studio preference:</strong> {{studio_preference}}</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, your booking deposit payment has been received. Amount: GBP {{amount_gbp}}. Payment reference: {{payment_intent_id}}. Studio preference: {{studio_preference}}.',
  'website_autoresponse',
  '["{{lead_name}}","{{amount_gbp}}","{{payment_intent_id}}","{{studio_preference}}"]'::jsonb,
  true
),
(
  'content_creator_confirmation',
  'Content Creator Application Received - Urban Hub',
  '<p>Hello {{lead_name}},</p><p>Thank you for your content creator application. Our team will review and get back to you.</p><p>Urban Hub Team</p>',
  'Hello {{lead_name}}, thank you for your content creator application. Our team will review and get back to you.',
  'website_autoresponse',
  '["{{lead_name}}"]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
