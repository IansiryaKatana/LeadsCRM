import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FollowUpAnalytics {
  totalLeads: number;
  leadsWith3PlusFollowups: number;
  complianceRate: number;
  averageFollowupsToConversion: number;
  averageTimeToFirstFollowup: number; // in hours
  averageFollowupInterval: number; // in hours
  followupResponseRate: number;
  followupTypeEffectiveness: {
    type: string;
    count: number;
    conversionRate: number;
  }[];
  overdueFollowups: number;
  upcomingFollowups: number;
}

export function useFollowUpAnalytics(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followup-analytics", academicYear],
    queryFn: async (): Promise<FollowUpAnalytics> => {
      let query = supabase
        .from("leads")
        .select(`
          id,
          lead_status,
          followup_count,
          created_at,
          last_followup_date,
          next_followup_date,
          lead_followups (
            id,
            followup_type,
            outcome,
            followup_date,
            lead_id
          )
        `);

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data: leads, error } = await query;

      if (error) throw error;

      const totalLeads = leads?.length || 0;
      const closedLeads = leads?.filter((l) => l.lead_status === "closed") || [];
      const convertedLeads = leads?.filter((l) => l.lead_status === "converted") || [];
      const leadsWith3Plus = closedLeads.filter((l) => (l.followup_count || 0) >= 3);
      const complianceRate =
        closedLeads.length > 0 ? (leadsWith3Plus.length / closedLeads.length) * 100 : 0;

      // Calculate average follow-ups to conversion
      const convertedWithFollowups = convertedLeads.filter((l) => (l.followup_count || 0) > 0);
      const averageFollowupsToConversion =
        convertedWithFollowups.length > 0
          ? convertedWithFollowups.reduce((sum, l) => sum + (l.followup_count || 0), 0) /
            convertedWithFollowups.length
          : 0;

      // Calculate average time to first follow-up
      const leadsWithFirstFollowup = leads?.filter(
        (l) => l.lead_followups && l.lead_followups.length > 0
      ) || [];
      let totalHoursToFirst = 0;
      leadsWithFirstFollowup.forEach((lead) => {
        if (lead.lead_followups && lead.lead_followups.length > 0) {
          const firstFollowup = lead.lead_followups.sort(
            (a: any, b: any) =>
              new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime()
          )[0];
          const hours =
            (new Date(firstFollowup.followup_date).getTime() -
              new Date(lead.created_at).getTime()) /
            (1000 * 60 * 60);
          totalHoursToFirst += hours;
        }
      });
      const averageTimeToFirstFollowup =
        leadsWithFirstFollowup.length > 0 ? totalHoursToFirst / leadsWithFirstFollowup.length : 0;

      // Calculate average follow-up interval
      const leadsWithMultipleFollowups = leads?.filter(
        (l) => l.lead_followups && l.lead_followups.length > 1
      ) || [];
      let totalIntervalHours = 0;
      let intervalCount = 0;
      leadsWithMultipleFollowups.forEach((lead) => {
        if (lead.lead_followups && lead.lead_followups.length > 1) {
          const sortedFollowups = lead.lead_followups.sort(
            (a: any, b: any) =>
              new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime()
          );
          for (let i = 1; i < sortedFollowups.length; i++) {
            const hours =
              (new Date(sortedFollowups[i].followup_date).getTime() -
                new Date(sortedFollowups[i - 1].followup_date).getTime()) /
              (1000 * 60 * 60);
            totalIntervalHours += hours;
            intervalCount++;
          }
        }
      });
      const averageFollowupInterval =
        intervalCount > 0 ? totalIntervalHours / intervalCount : 0;

      // Calculate follow-up response rate
      const allFollowups = leads?.flatMap((l) => l.lead_followups || []) || [];
      const contactedFollowups = allFollowups.filter(
        (f: any) => f.outcome === "contacted" || f.outcome === "interested"
      );
      const followupResponseRate =
        allFollowups.length > 0 ? (contactedFollowups.length / allFollowups.length) * 100 : 0;

      // Calculate follow-up type effectiveness
      const typeMap = new Map<string, { count: number; conversions: number }>();
      leads?.forEach((lead) => {
        if (lead.lead_followups) {
          lead.lead_followups.forEach((followup: any) => {
            const existing = typeMap.get(followup.followup_type) || { count: 0, conversions: 0 };
            existing.count++;
            if (lead.lead_status === "converted") {
              existing.conversions++;
            }
            typeMap.set(followup.followup_type, existing);
          });
        }
      });
      const followupTypeEffectiveness = Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        conversionRate: data.count > 0 ? (data.conversions / data.count) * 100 : 0,
      }));

      // Count overdue and upcoming follow-ups
      const now = new Date();
      const overdueFollowups =
        leads?.filter(
          (l) =>
            l.lead_status !== "converted" &&
            l.lead_status !== "closed" &&
            l.next_followup_date &&
            new Date(l.next_followup_date) < now
        ).length || 0;

      const upcomingFollowups =
        leads?.filter(
          (l) =>
            l.lead_status !== "converted" &&
            l.lead_status !== "closed" &&
            l.next_followup_date &&
            new Date(l.next_followup_date) > now &&
            new Date(l.next_followup_date) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        ).length || 0;

      return {
        totalLeads,
        leadsWith3PlusFollowups: leadsWith3Plus.length,
        complianceRate,
        averageFollowupsToConversion,
        averageTimeToFirstFollowup,
        averageFollowupInterval,
        followupResponseRate,
        followupTypeEffectiveness,
        overdueFollowups,
        upcomingFollowups,
      };
    },
    enabled: !!user,
  });
}

export function useOverdueFollowups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["overdue-followups"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_overdue_followups");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}

