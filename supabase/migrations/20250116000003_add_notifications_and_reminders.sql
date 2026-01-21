-- Migration: Add notifications system and follow-up reminders
-- This enables in-app notifications, user preferences, and automated reminders

-- Step 1: Create notification types enum
CREATE TYPE public.notification_type AS ENUM (
  'new_lead_assigned',
  'followup_reminder',
  'followup_overdue',
  'lead_converted',
  'lead_status_changed',
  'hot_lead_update',
  'exception_requested',
  'exception_approved',
  'exception_rejected',
  'daily_summary'
);

-- Step 2: Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to related resource (e.g., /leads/{lead_id})
  metadata JSONB, -- Additional data (lead_id, etc.)
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index for efficient queries
  CONSTRAINT idx_notifications_user_read UNIQUE NULLS NOT DISTINCT (user_id, id, read)
);

-- Step 3: Create user notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  new_lead_assigned BOOLEAN NOT NULL DEFAULT true,
  followup_reminder BOOLEAN NOT NULL DEFAULT true,
  followup_overdue BOOLEAN NOT NULL DEFAULT true,
  lead_converted BOOLEAN NOT NULL DEFAULT true,
  lead_status_changed BOOLEAN NOT NULL DEFAULT true,
  hot_lead_update BOOLEAN NOT NULL DEFAULT true,
  exception_requested BOOLEAN NOT NULL DEFAULT true,
  exception_approved BOOLEAN NOT NULL DEFAULT true,
  exception_rejected BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT false,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Create follow-up reminders table
CREATE TABLE IF NOT EXISTS public.followup_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL, -- 'first_followup', 'interval_reminder', 'overdue'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one active reminder per lead per type
  CONSTRAINT unique_active_reminder UNIQUE (lead_id, reminder_type, dismissed)
);

-- Step 5: Create exception requests table
CREATE TABLE IF NOT EXISTS public.lead_exception_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  reason TEXT NOT NULL,
  justification TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_lead_id ON public.followup_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_scheduled ON public.followup_reminders(scheduled_for) WHERE dismissed = false AND sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exception_requests_lead_id ON public.lead_exception_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_exception_requests_status ON public.lead_exception_requests(status) WHERE status = 'pending';

-- Step 7: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_exception_requests ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be controlled by service role in edge functions

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 9: RLS Policies for user notification preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.user_notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 10: RLS Policies for follow-up reminders
CREATE POLICY "Users can view reminders for accessible leads"
  ON public.followup_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = followup_reminders.lead_id 
      AND (
        public.has_elevated_role(auth.uid()) 
        OR leads.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage reminders"
  ON public.followup_reminders FOR ALL
  TO authenticated
  USING (true); -- Controlled by service role in edge functions

-- Step 11: RLS Policies for exception requests
CREATE POLICY "Users can view exception requests for accessible leads"
  ON public.lead_exception_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_exception_requests.lead_id 
      AND (
        public.has_elevated_role(auth.uid()) 
        OR leads.assigned_to = auth.uid()
        OR lead_exception_requests.requested_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create exception requests"
  ON public.lead_exception_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_exception_requests.lead_id 
      AND (
        public.has_elevated_role(auth.uid()) 
        OR leads.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can update exception requests"
  ON public.lead_exception_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_elevated_role(auth.uid())
    OR requested_by = auth.uid()
  )
  WITH CHECK (
    public.has_elevated_role(auth.uid())
    OR requested_by = auth.uid()
  );

-- Step 12: Create function to get overdue follow-ups
CREATE OR REPLACE FUNCTION public.get_overdue_followups()
RETURNS TABLE (
  lead_id UUID,
  lead_name TEXT,
  assigned_to UUID,
  followup_count INTEGER,
  days_since_last_followup INTEGER,
  next_followup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.full_name,
    l.assigned_to,
    l.followup_count,
    EXTRACT(DAY FROM (now() - COALESCE(l.last_followup_date, l.created_at)))::INTEGER,
    l.next_followup_date
  FROM public.leads l
  WHERE l.lead_status NOT IN ('converted', 'closed')
    AND l.followup_count < 3
    AND (
      -- No follow-up in 48+ hours for new leads
      (l.followup_count = 0 AND now() - l.created_at > INTERVAL '48 hours')
      OR
      -- No follow-up in 5+ days since last follow-up
      (l.followup_count > 0 AND l.last_followup_date IS NOT NULL AND now() - l.last_followup_date > INTERVAL '5 days')
      OR
      -- Next follow-up date has passed
      (l.next_followup_date IS NOT NULL AND l.next_followup_date < now())
    );
END;
$$;

-- Step 13: Create function to suggest next follow-up date
CREATE OR REPLACE FUNCTION public.suggest_next_followup_date(_lead_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_followup_date TIMESTAMPTZ;
  _followup_count INTEGER;
  _lead_status TEXT;
BEGIN
  SELECT last_followup_date, followup_count, lead_status
  INTO _last_followup_date, _followup_count, _lead_status
  FROM public.leads
  WHERE id = _lead_id;
  
  -- If no follow-ups yet, suggest 24-48 hours from creation
  IF _followup_count = 0 THEN
    RETURN now() + INTERVAL '36 hours';
  END IF;
  
  -- If last follow-up exists, suggest 3-5 days after
  IF _last_followup_date IS NOT NULL THEN
    -- High interest leads: 2-3 days
    IF _lead_status = 'high_interest' THEN
      RETURN _last_followup_date + INTERVAL '2.5 days';
    -- Low engagement: 4-5 days
    ELSIF _lead_status = 'low_engagement' THEN
      RETURN _last_followup_date + INTERVAL '4.5 days';
    -- Default: 3-4 days
    ELSE
      RETURN _last_followup_date + INTERVAL '3.5 days';
    END IF;
  END IF;
  
  -- Fallback
  RETURN now() + INTERVAL '3 days';
END;
$$;

-- Step 14: Create trigger to update updated_at for exception requests
CREATE OR REPLACE FUNCTION public.update_exception_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_exception_request_updated_at_trigger
BEFORE UPDATE ON public.lead_exception_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_exception_request_updated_at();

-- Step 15: Create trigger to update updated_at for notification preferences
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notification_preferences_updated_at_trigger
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_notification_preferences_updated_at();

