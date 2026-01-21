-- Migration: Add follow-up tracking system for leads
-- This enables mandatory 3-follow-up process before closing leads

-- Step 1: Create follow-up type enum
CREATE TYPE public.followup_type AS ENUM (
  'call',
  'email',
  'whatsapp',
  'in_person',
  'other'
);

-- Step 2: Create follow-up outcome enum
CREATE TYPE public.followup_outcome AS ENUM (
  'contacted',
  'no_answer',
  'voicemail',
  'not_interested',
  'interested',
  'callback_requested',
  'wrong_contact_info'
);

-- Step 3: Create lead_followups table
CREATE TABLE IF NOT EXISTS public.lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  followup_number INTEGER NOT NULL CHECK (followup_number >= 1 AND followup_number <= 10),
  followup_type followup_type NOT NULL,
  followup_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome followup_outcome NOT NULL,
  notes TEXT,
  next_action_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique follow-up number per lead
  CONSTRAINT unique_lead_followup_number UNIQUE (lead_id, followup_number)
);

-- Step 4: Add follow-up tracking columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS followup_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_followup_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMPTZ;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON public.lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_created_at ON public.lead_followups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_followups_next_action ON public.lead_followups(next_action_date) WHERE next_action_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_followup_count ON public.leads(followup_count);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON public.leads(next_followup_date) WHERE next_followup_date IS NOT NULL;

-- Step 6: Create function to update lead follow-up count
CREATE OR REPLACE FUNCTION public.update_lead_followup_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update follow-up count and last follow-up date
  UPDATE public.leads
  SET 
    followup_count = (
      SELECT COUNT(*) 
      FROM public.lead_followups 
      WHERE lead_id = COALESCE(NEW.lead_id, OLD.lead_id)
    ),
    last_followup_date = (
      SELECT MAX(followup_date)
      FROM public.lead_followups
      WHERE lead_id = COALESCE(NEW.lead_id, OLD.lead_id)
    ),
    next_followup_date = (
      SELECT MAX(next_action_date)
      FROM public.lead_followups
      WHERE lead_id = COALESCE(NEW.lead_id, OLD.lead_id)
        AND next_action_date IS NOT NULL
    )
  WHERE id = COALESCE(NEW.lead_id, OLD.lead_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 7: Create trigger to auto-update follow-up count
DROP TRIGGER IF EXISTS update_followup_count_trigger ON public.lead_followups;
CREATE TRIGGER update_followup_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.lead_followups
FOR EACH ROW EXECUTE FUNCTION public.update_lead_followup_count();

-- Step 8: Enable RLS on lead_followups table
ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;

-- Step 9: RLS Policies for lead_followups
-- Users can view follow-ups for leads they can access
CREATE POLICY "Users can view follow-ups for accessible leads"
  ON public.lead_followups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_followups.lead_id 
      AND (
        public.has_elevated_role(auth.uid()) 
        OR leads.assigned_to = auth.uid()
      )
    )
  );

-- Authenticated users can create follow-ups
CREATE POLICY "Authenticated users can create follow-ups"
  ON public.lead_followups FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_followups.lead_id 
      AND (
        public.has_elevated_role(auth.uid()) 
        OR leads.assigned_to = auth.uid()
      )
    )
  );

-- Users can update their own follow-ups or if they have elevated role
CREATE POLICY "Users can update accessible follow-ups"
  ON public.lead_followups FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR public.has_elevated_role(auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid() 
    OR public.has_elevated_role(auth.uid())
  );

-- Users can delete their own follow-ups or if they have elevated role
CREATE POLICY "Users can delete accessible follow-ups"
  ON public.lead_followups FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR public.has_elevated_role(auth.uid())
  );

-- Step 10: Create function to validate status change (for use in application logic)
CREATE OR REPLACE FUNCTION public.can_close_lead(_lead_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _followup_count INTEGER;
BEGIN
  SELECT followup_count INTO _followup_count
  FROM public.leads
  WHERE id = _lead_id;
  
  -- Can close if 3+ follow-ups completed
  RETURN COALESCE(_followup_count, 0) >= 3;
END;
$$;

