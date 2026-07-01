-- Reply-To and CC settings for student-facing outbound emails.
-- Reply-To controls where the email client's Reply button sends mail.
-- CC copies internal team addresses on every student email.

INSERT INTO public.system_settings (setting_key, setting_value)
VALUES
  ('email_reply_to_address', '"operations@urbanhub.uk"'),
  ('email_cc_addresses', '["Leads@urbanhub.uk"]')
ON CONFLICT (setting_key) DO NOTHING;
