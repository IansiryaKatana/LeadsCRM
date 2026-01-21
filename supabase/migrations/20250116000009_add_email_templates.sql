-- Migration: Add email templates system
-- This enables email template management and automated email sending

-- Step 1: Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'welcome', 'followup_1', 'followup_2', 'followup_3', 'conversion', 'general'
  is_active BOOLEAN NOT NULL DEFAULT true,
  variables JSONB DEFAULT '[]'::JSONB, -- Array of available variables like ['{{lead_name}}', '{{room_choice}}']
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create email_history table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  sent_to TEXT NOT NULL, -- Email address
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB -- For tracking opens/clicks
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_history_lead_id ON public.email_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON public.email_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_by ON public.email_history(sent_by);

-- Step 4: Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for email_templates
-- All authenticated users can view active templates
CREATE POLICY "All authenticated users can view active templates" 
  ON public.email_templates FOR SELECT 
  TO authenticated 
  USING (is_active = true OR created_by = auth.uid());

-- Only admins can manage templates
CREATE POLICY "Admins can insert templates" 
  ON public.email_templates FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update templates" 
  ON public.email_templates FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete templates" 
  ON public.email_templates FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin')
    )
  );

-- Step 6: RLS Policies for email_history
-- Users can view emails for leads they have access to
CREATE POLICY "Users can view email history for accessible leads" 
  ON public.email_history FOR SELECT 
  TO authenticated 
  USING (true); -- All authenticated users can view (matching leads policy)

-- Authenticated users can insert email history
CREATE POLICY "Authenticated users can create email history" 
  ON public.email_history FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = sent_by);

-- Step 7: Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Step 8: Insert default email templates
INSERT INTO public.email_templates (name, subject, body_html, category, variables) VALUES
(
  'Welcome Email',
  'Welcome to ISKA Student Accommodation - {{lead_name}}',
  '<h2>Hello {{lead_name}},</h2><p>Thank you for your interest in ISKA Student Accommodation!</p><p>We received your inquiry about our {{room_choice}} room option and we''re excited to help you find the perfect accommodation.</p><p>Our team will be in touch with you shortly to discuss your requirements and answer any questions you may have.</p><p>Best regards,<br>ISKA Team</p>',
  'welcome',
  '["{{lead_name}}", "{{room_choice}}", "{{email}}", "{{phone}}"]'::JSONB
),
(
  'Follow-up #1',
  'Following up on your accommodation inquiry - {{lead_name}}',
  '<h2>Hello {{lead_name}},</h2><p>We wanted to follow up on your recent inquiry about our {{room_choice}} accommodation.</p><p>Have you had a chance to review our options? We''d love to answer any questions you might have and help you find the perfect room.</p><p>Please feel free to reply to this email or give us a call at your convenience.</p><p>Best regards,<br>ISKA Team</p>',
  'followup_1',
  '["{{lead_name}}", "{{room_choice}}", "{{email}}", "{{phone}}"]'::JSONB
),
(
  'Follow-up #2',
  'Still interested in ISKA accommodation? - {{lead_name}}',
  '<h2>Hello {{lead_name}},</h2><p>We haven''t heard from you in a while and wanted to check if you''re still interested in our {{room_choice}} accommodation.</p><p>We have limited availability, so we''d love to help you secure your preferred room before it''s taken.</p><p>If you have any questions or concerns, please don''t hesitate to reach out.</p><p>Best regards,<br>ISKA Team</p>',
  'followup_2',
  '["{{lead_name}}", "{{room_choice}}", "{{email}}", "{{phone}}"]'::JSONB
),
(
  'Follow-up #3',
  'Last chance - ISKA Accommodation availability - {{lead_name}}',
  '<h2>Hello {{lead_name}},</h2><p>This is our final follow-up regarding your interest in our {{room_choice}} accommodation.</p><p>We understand you may be considering your options, and we''re here to help make your decision easier. If you''d like to discuss your requirements or schedule a viewing, please let us know.</p><p>If you''re no longer interested, we''d appreciate a quick reply so we can update our records.</p><p>Best regards,<br>ISKA Team</p>',
  'followup_3',
  '["{{lead_name}}", "{{room_choice}}", "{{email}}", "{{phone}}"]'::JSONB
),
(
  'Conversion Confirmation',
  'Congratulations! Your booking is confirmed - {{lead_name}}',
  '<h2>Congratulations {{lead_name}}!</h2><p>We''re thrilled to confirm your booking for our {{room_choice}} accommodation.</p><p>Your booking details:</p><ul><li>Room: {{room_choice}}</li><li>Stay Duration: {{stay_duration}}</li><li>Total: {{revenue}}</li></ul><p>Our team will be in touch shortly with next steps and additional information.</p><p>Welcome to ISKA!</p><p>Best regards,<br>ISKA Team</p>',
  'conversion',
  '["{{lead_name}}", "{{room_choice}}", "{{stay_duration}}", "{{revenue}}", "{{email}}"]'::JSONB
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.email_templates IS 'Email templates for automated and manual email sending';
COMMENT ON TABLE public.email_history IS 'History of all emails sent to leads';

