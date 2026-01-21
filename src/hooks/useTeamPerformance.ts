import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeamPerformanceMetrics {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  total_leads_assigned: number;
  total_leads_created: number;
  total_followups_recorded: number;
  total_conversions: number;
  total_revenue: number;
  conversion_rate: number;
  avg_time_to_first_followup_hours: number;
  followup_compliance_rate: number;
  avg_followups_per_lead: number;
}

export function useTeamPerformance(
  academicYear?: string,
  startDate?: Date,
  endDate?: Date
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team-performance", academicYear, startDate, endDate],
    queryFn: async (): Promise<TeamPerformanceMetrics[]> => {
      const { data, error } = await supabase.rpc("get_team_performance_metrics", {
        p_academic_year: academicYear || null,
        p_start_date: startDate?.toISOString() || null,
        p_end_date: endDate?.toISOString() || null,
      });

      if (error) {
        console.error("Error fetching team performance:", error);
        throw error;
      }

      return (data || []) as TeamPerformanceMetrics[];
    },
    enabled: !!user,
  });
}

