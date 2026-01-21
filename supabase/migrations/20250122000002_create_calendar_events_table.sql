-- Create calendar_events table for calendar integration
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('viewing', 'callback', 'followup', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  google_calendar_id TEXT,
  outlook_calendar_id TEXT,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_lead_id ON public.calendar_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON public.calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view events for their leads"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = calendar_events.lead_id
      AND (leads.assigned_to = auth.uid() OR leads.created_by = auth.uid())
    ) OR
    created_by = auth.uid() OR
    (created_by IS NULL AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = calendar_events.lead_id
      AND (leads.assigned_to = auth.uid() OR leads.created_by = auth.uid())
    ))
  );

CREATE POLICY "Admins can view all events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

CREATE POLICY "Users can create events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = calendar_events.lead_id
      AND (leads.assigned_to = auth.uid() OR leads.created_by = auth.uid())
    ) OR
    public.has_elevated_role(auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = calendar_events.lead_id
      AND (leads.assigned_to = auth.uid() OR leads.created_by = auth.uid())
    ) OR
    public.has_elevated_role(auth.uid())
  );

CREATE POLICY "Users can delete their events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.has_elevated_role(auth.uid())
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_events_updated_at();
