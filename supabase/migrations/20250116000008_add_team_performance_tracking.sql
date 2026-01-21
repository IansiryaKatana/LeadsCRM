-- Migration: Add team performance tracking capabilities
-- This enables tracking user activity and performance metrics

-- Step 1: Create user_activity_log table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL, -- 'lead_created', 'lead_updated', 'followup_recorded', 'lead_converted', etc.
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action_type ON public.user_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_lead_id ON public.user_activity_log(lead_id);

-- Step 3: Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies for user_activity_log
-- All authenticated users can view activity logs (for team performance)
CREATE POLICY "All authenticated users can view activity logs" 
  ON public.user_activity_log FOR SELECT 
  TO authenticated 
  USING (true);

-- System can insert activity logs
CREATE POLICY "System can insert activity logs" 
  ON public.user_activity_log FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Create function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_lead_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity_log (user_id, action_type, lead_id, metadata)
  VALUES (p_user_id, p_action_type, p_lead_id, p_metadata);
END;
$$;

-- Step 6: Create function to get team performance metrics
CREATE OR REPLACE FUNCTION public.get_team_performance_metrics(
  p_academic_year TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  total_leads_assigned INTEGER,
  total_leads_created INTEGER,
  total_followups_recorded INTEGER,
  total_conversions INTEGER,
  total_revenue NUMERIC,
  conversion_rate NUMERIC,
  avg_time_to_first_followup_hours NUMERIC,
  followup_compliance_rate NUMERIC,
  avg_followups_per_lead NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_metrics AS (
    SELECT 
      p.user_id,
      p.full_name,
      p.email,
      COALESCE(ur.role, 'viewer')::TEXT as role,
      -- Total leads assigned
      COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id THEN l.id END)::INTEGER as total_leads_assigned,
      -- Total leads created
      COUNT(DISTINCT CASE WHEN l.created_by = p.user_id THEN l.id END)::INTEGER as total_leads_created,
      -- Total followups recorded
      COUNT(DISTINCT CASE WHEN fu.created_by = p.user_id THEN fu.id END)::INTEGER as total_followups_recorded,
      -- Total conversions
      COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id AND l.lead_status = 'converted' THEN l.id END)::INTEGER as total_conversions,
      -- Total revenue
      COALESCE(SUM(CASE WHEN l.assigned_to = p.user_id AND l.lead_status = 'converted' THEN l.potential_revenue ELSE 0 END), 0)::NUMERIC as total_revenue,
      -- Average time to first followup (in hours)
      AVG(
        CASE 
          WHEN l.assigned_to = p.user_id AND fu.followup_number = 1 
          THEN EXTRACT(EPOCH FROM (fu.followup_date - l.created_at)) / 3600
          ELSE NULL
        END
      )::NUMERIC as avg_time_to_first_followup_hours,
      -- Followup compliance rate (leads with 3+ followups before close)
      CASE 
        WHEN COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id AND l.lead_status = 'closed' THEN l.id END) > 0
        THEN (
          COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id AND l.lead_status = 'closed' AND l.followup_count >= 3 THEN l.id END)::NUMERIC /
          COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id AND l.lead_status = 'closed' THEN l.id END)::NUMERIC
        ) * 100
        ELSE 0
      END::NUMERIC as followup_compliance_rate,
      -- Average followups per lead
      CASE 
        WHEN COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id THEN l.id END) > 0
        THEN (
          COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id THEN fu.id END)::NUMERIC /
          COUNT(DISTINCT CASE WHEN l.assigned_to = p.user_id THEN l.id END)::NUMERIC
        )
        ELSE 0
      END::NUMERIC as avg_followups_per_lead
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN public.leads l ON (
      (l.assigned_to = p.user_id OR l.created_by = p.user_id)
      AND (p_academic_year IS NULL OR l.academic_year = p_academic_year)
      AND (p_start_date IS NULL OR l.created_at >= p_start_date)
      AND (p_end_date IS NULL OR l.created_at <= p_end_date)
    )
    LEFT JOIN public.lead_followups fu ON (
      fu.lead_id = l.id
      AND (p_start_date IS NULL OR fu.created_at >= p_start_date)
      AND (p_end_date IS NULL OR fu.created_at <= p_end_date)
    )
    WHERE ur.role IN ('salesperson', 'manager', 'admin', 'super_admin')
    GROUP BY p.user_id, p.full_name, p.email, ur.role
  )
  SELECT 
    um.user_id,
    um.full_name,
    um.email,
    um.role,
    um.total_leads_assigned,
    um.total_leads_created,
    um.total_followups_recorded,
    um.total_conversions,
    um.total_revenue,
    -- Conversion rate
    CASE 
      WHEN um.total_leads_assigned > 0
      THEN (um.total_conversions::NUMERIC / um.total_leads_assigned::NUMERIC) * 100
      ELSE 0
    END::NUMERIC as conversion_rate,
    um.avg_time_to_first_followup_hours,
    um.followup_compliance_rate,
    um.avg_followups_per_lead
  FROM user_metrics um
  WHERE um.total_leads_assigned > 0 OR um.total_leads_created > 0
  ORDER BY um.total_revenue DESC, um.total_conversions DESC;
END;
$$;

-- Step 7: Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_team_performance_metrics TO authenticated;

COMMENT ON TABLE public.user_activity_log IS 'Tracks user activity for performance analytics';
COMMENT ON FUNCTION public.get_team_performance_metrics IS 'Returns team performance metrics for all users';

