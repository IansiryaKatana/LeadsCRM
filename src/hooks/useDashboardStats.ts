import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  awaitingOutreach: number;
  lowEngagement: number;
  highInterest: number;
  converted: number;
  closed: number;
  conversionRate: number;
  totalRevenue: number;
  forecastRevenue: number;
}

export interface ChannelPerformance {
  source: string;
  leads: number;
  converted: number;
  revenue: number;
}

function applyLeadDateFilters<T extends { gte: (col: string, val: string) => T; lte: (col: string, val: string) => T }>(
  query: T,
  startDate?: Date | null,
  endDate?: Date | null
): T {
  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }
  if (endDate) {
    query = query.lte("created_at", endDate.toISOString());
  }
  return query;
}

export function useDashboardStats(
  academicYear?: string,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<DashboardStats> => {
      let query = supabase
        .from("leads")
        .select("lead_status, potential_revenue, is_hot, academic_year, created_at");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data: leads, error } = await query;

      if (error) throw error;

      const totalLeads = leads?.length || 0;
      const newLeads = leads?.filter(l => l.lead_status === "new").length || 0;
      const awaitingOutreach = leads?.filter(l => l.lead_status === "awaiting_outreach").length || 0;
      const lowEngagement = leads?.filter(l => l.lead_status === "low_engagement").length || 0;
      const highInterest = leads?.filter(l => l.lead_status === "high_interest").length || 0;
      const converted = leads?.filter(l => l.lead_status === "converted").length || 0;
      const closed = leads?.filter(l => l.lead_status === "closed").length || 0;

      const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
      
      const totalRevenue = leads
        ?.filter(l => l.lead_status === "converted")
        .reduce((sum, l) => sum + (l.potential_revenue || 0), 0) || 0;

      const forecastRevenue = leads
        ?.filter(l => l.lead_status === "high_interest")
        .reduce((sum, l) => sum + (l.potential_revenue || 0), 0) || 0;

      return {
        totalLeads,
        newLeads,
        awaitingOutreach,
        lowEngagement,
        highInterest,
        converted,
        closed,
        conversionRate,
        totalRevenue,
        forecastRevenue,
      };
    },
    enabled: !!user,
  });
}

export function useChannelPerformance(
  academicYear?: string,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["channel-performance", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<ChannelPerformance[]> => {
      let query = supabase
        .from("leads")
        .select("source, lead_status, potential_revenue, academic_year, created_at");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data: leads, error } = await query;

      if (error) throw error;

      const sourceMap = new Map<string, { leads: number; converted: number; revenue: number }>();

      leads?.forEach(lead => {
        const existing = sourceMap.get(lead.source) || { leads: 0, converted: 0, revenue: 0 };
        existing.leads++;
        if (lead.lead_status === "converted") {
          existing.converted++;
          existing.revenue += lead.potential_revenue || 0;
        }
        sourceMap.set(lead.source, existing);
      });

      return Array.from(sourceMap.entries()).map(([source, stats]) => ({
        source,
        ...stats,
      }));
    },
    enabled: !!user,
  });
}

export function useTeamMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      if (error) throw error;

      // Get roles for each user
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]));

      return profiles?.map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) || "viewer",
      })) || [];
    },
    enabled: !!user,
  });
}
