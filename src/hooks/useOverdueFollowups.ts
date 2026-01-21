import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export interface OverdueFollowUp {
  lead: Lead;
  daysOverdue: number;
  nextFollowUpDate: string | null;
  followUpCount: number;
}

export function useOverdueFollowups(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["overdue-followups", academicYear],
    queryFn: async (): Promise<OverdueFollowUp[]> => {
      const now = new Date();
      
      // Fetch leads that need follow-ups
      let query = supabase
        .from("leads")
        .select("*")
        .in("lead_status", ["new", "awaiting_outreach", "low_engagement", "high_interest"])
        .or("next_followup_date.lt." + now.toISOString() + ",and(next_followup_date.is.null,created_at.lt." + new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() + ")")
        .order("next_followup_date", { ascending: true, nullsFirst: false });

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data: leads, error } = await query;

      if (error) {
        console.error("Error fetching overdue follow-ups:", error);
        throw error;
      }

      if (!leads || leads.length === 0) {
        return [];
      }

      // Calculate days overdue for each lead
      return leads
        .map((lead) => {
          let daysOverdue = 0;
          
          if (lead.next_followup_date) {
            const nextDate = new Date(lead.next_followup_date);
            daysOverdue = Math.floor((now.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
          } else if (lead.created_at) {
            // If no next follow-up date, check if created more than 24 hours ago
            const createdDate = new Date(lead.created_at);
            const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreation > 24) {
              daysOverdue = Math.floor(hoursSinceCreation / 24);
            }
          }

          return {
            lead,
            daysOverdue: Math.max(0, daysOverdue),
            nextFollowUpDate: lead.next_followup_date,
            followUpCount: lead.followup_count || 0,
          };
        })
        .filter((item) => item.daysOverdue > 0 || (item.followUpCount === 0 && item.lead.created_at && new Date(item.lead.created_at) < new Date(now.getTime() - 24 * 60 * 60 * 1000)))
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

