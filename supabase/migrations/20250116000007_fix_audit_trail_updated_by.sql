-- Migration: Fix audit trail function to remove updated_by reference
-- The leads table doesn't have an updated_by column, so we need to remove that reference
-- This migration only fixes the function, the type audit_action_type was already created in 20250116000004

-- Recreate the audit_lead_changes function without updated_by
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
  
  -- Log audit trail (removed updated_by references since leads table doesn't have that column)
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

