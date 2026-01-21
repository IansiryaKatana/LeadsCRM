-- Migration: Enhance audit trail system
-- This enables automatic audit logging for all lead actions

-- Step 1: Create audit action types enum
CREATE TYPE public.audit_action_type AS ENUM (
  'lead_created',
  'lead_updated',
  'lead_status_changed',
  'lead_assigned',
  'lead_unassigned',
  'lead_deleted',
  'lead_hot_toggled',
  'note_created',
  'note_deleted',
  'followup_created',
  'followup_updated',
  'followup_deleted',
  'exception_requested',
  'exception_approved',
  'exception_rejected'
);

-- Step 2: Enhance audit_trail table (if columns don't exist)
DO $$ 
BEGIN
  -- Add action_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_trail' 
    AND column_name = 'action_type'
  ) THEN
    ALTER TABLE public.audit_trail 
    ADD COLUMN action_type audit_action_type;
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_trail' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.audit_trail 
    ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Step 3: Create function to log audit trail
CREATE OR REPLACE FUNCTION public.log_audit_trail(
  p_lead_id UUID,
  p_action audit_action_type,
  p_user_id UUID,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_trail (
    lead_id,
    action,
    action_type,
    user_id,
    old_value,
    new_value,
    metadata,
    timestamp
  )
  VALUES (
    p_lead_id,
    p_action::TEXT,
    p_action,
    p_user_id,
    p_old_value,
    p_new_value,
    p_metadata,
    now()
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Step 4: Create trigger function for lead changes
CREATE OR REPLACE FUNCTION public.audit_lead_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action_type;
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields JSONB := '{}'::JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'lead_created';
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- Determine specific action
    IF OLD.lead_status IS DISTINCT FROM NEW.lead_status THEN
      v_action := 'lead_status_changed';
      v_changed_fields := jsonb_build_object(
        'old_status', OLD.lead_status,
        'new_status', NEW.lead_status
      );
    ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      IF NEW.assigned_to IS NULL THEN
        v_action := 'lead_unassigned';
      ELSE
        v_action := 'lead_assigned';
      END IF;
      v_changed_fields := jsonb_build_object(
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to
      );
    ELSIF OLD.is_hot IS DISTINCT FROM NEW.is_hot THEN
      v_action := 'lead_hot_toggled';
      v_changed_fields := jsonb_build_object(
        'is_hot', NEW.is_hot
      );
    ELSE
      v_action := 'lead_updated';
      -- Track only changed fields
      SELECT jsonb_object_agg(key, value)
      INTO v_changed_fields
      FROM jsonb_each(v_new_data)
      WHERE value IS DISTINCT FROM (v_old_data->key);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'lead_deleted';
    v_old_data := to_jsonb(OLD);
  END IF;
  
  -- Log audit trail
  PERFORM public.log_audit_trail(
    COALESCE(NEW.id, OLD.id),
    v_action,
    COALESCE(NEW.created_by, OLD.created_by, auth.uid()),
    CASE WHEN TG_OP = 'DELETE' THEN v_old_data ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE v_new_data END,
    CASE WHEN v_changed_fields != '{}'::JSONB THEN v_changed_fields ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 5: Create trigger for lead changes
DROP TRIGGER IF EXISTS audit_lead_changes_trigger ON public.leads;
CREATE TRIGGER audit_lead_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.audit_lead_changes();

-- Step 6: Create trigger function for follow-up changes
CREATE OR REPLACE FUNCTION public.audit_followup_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action_type;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'followup_created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'followup_updated';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'followup_deleted';
  END IF;
  
  PERFORM public.log_audit_trail(
    COALESCE(NEW.lead_id, OLD.lead_id),
    v_action,
    COALESCE(NEW.created_by, OLD.created_by, auth.uid()),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    jsonb_build_object('followup_number', COALESCE(NEW.followup_number, OLD.followup_number))
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 7: Create trigger for follow-up changes
DROP TRIGGER IF EXISTS audit_followup_changes_trigger ON public.lead_followups;
CREATE TRIGGER audit_followup_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.lead_followups
FOR EACH ROW
EXECUTE FUNCTION public.audit_followup_changes();

-- Step 8: Create trigger function for note changes
CREATE OR REPLACE FUNCTION public.audit_note_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_trail(
      NEW.lead_id,
      'note_created',
      NEW.created_by,
      NULL,
      jsonb_build_object('note_id', NEW.id, 'note_preview', left(NEW.note, 50)),
      NULL
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_trail(
      OLD.lead_id,
      'note_deleted',
      OLD.created_by,
      jsonb_build_object('note_id', OLD.id, 'note_preview', left(OLD.note, 50)),
      NULL,
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 9: Create trigger for note changes
DROP TRIGGER IF EXISTS audit_note_changes_trigger ON public.lead_notes;
CREATE TRIGGER audit_note_changes_trigger
AFTER INSERT OR DELETE ON public.lead_notes
FOR EACH ROW
EXECUTE FUNCTION public.audit_note_changes();

-- Step 10: Create trigger function for exception requests
CREATE OR REPLACE FUNCTION public.audit_exception_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action_type;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'exception_requested';
    PERFORM public.log_audit_trail(
      NEW.lead_id,
      v_action,
      NEW.requested_by,
      NULL,
      jsonb_build_object('exception_id', NEW.id, 'reason', NEW.reason),
      NULL
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'approved' THEN
      v_action := 'exception_approved';
    ELSIF NEW.status = 'rejected' THEN
      v_action := 'exception_rejected';
    END IF;
    
    IF v_action IS NOT NULL THEN
      PERFORM public.log_audit_trail(
        NEW.lead_id,
        v_action,
        NEW.reviewed_by,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status, 'review_notes', NEW.review_notes),
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 11: Create trigger for exception changes
DROP TRIGGER IF EXISTS audit_exception_changes_trigger ON public.lead_exception_requests;
CREATE TRIGGER audit_exception_changes_trigger
AFTER INSERT OR UPDATE ON public.lead_exception_requests
FOR EACH ROW
EXECUTE FUNCTION public.audit_exception_changes();

-- Step 12: Add index for audit trail queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_lead_id_action ON public.audit_trail(lead_id, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON public.audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON public.audit_trail(timestamp DESC);

