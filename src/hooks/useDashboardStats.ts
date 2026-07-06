import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchRoomPricesByYear } from "@/utils/leadPotentialRevenue";
import {
  aggregateLeadRevenueStats,
  getEffectivePotentialRevenue,
  type LeadRevenueRow,
} from "@/utils/leadRevenueStats";

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
  pipelineRevenue: number;
  statusRevenue: Record<string, number>;
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
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<DashboardStats> => {
      const roomPricesByYear = await fetchRoomPricesByYear(supabase);

      let query = supabase
        .from("leads")
        .select(
          "lead_status, potential_revenue, room_choice, stay_duration, source, metadata, academic_year, created_at",
        );

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data: leads, error } = await query;

      if (error) throw error;

      return aggregateLeadRevenueStats((leads ?? []) as LeadRevenueRow[], roomPricesByYear);
    },
    enabled: !!user && academicYear !== null,
  });
}

export function useChannelPerformance(
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["channel-performance", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async (): Promise<ChannelPerformance[]> => {
      const roomPricesByYear = await fetchRoomPricesByYear(supabase);

      let query = supabase
        .from("leads")
        .select(
          "source, lead_status, potential_revenue, room_choice, stay_duration, metadata, academic_year, created_at",
        );

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data: leads, error } = await query;

      if (error) throw error;

      const sourceMap = new Map<string, { leads: number; converted: number; revenue: number }>();

      leads?.forEach((lead) => {
        const existing = sourceMap.get(lead.source) || { leads: 0, converted: 0, revenue: 0 };
        existing.leads++;
        if (lead.lead_status === "converted") {
          existing.converted++;
          existing.revenue += getEffectivePotentialRevenue(
            lead as LeadRevenueRow,
            roomPricesByYear,
          );
        }
        sourceMap.set(lead.source, existing);
      });

      return Array.from(sourceMap.entries()).map(([source, stats]) => ({
        source,
        ...stats,
      }));
    },
    enabled: !!user && academicYear !== null,
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
