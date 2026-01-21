import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useMonthlyLeadData(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monthly-lead-data", academicYear],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("created_at, lead_status, potential_revenue, academic_year");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by month
      const monthlyMap = new Map<string, { leads: number; converted: number; revenue: number }>();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize last 6 months
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyMap.set(key, { leads: 0, converted: 0, revenue: 0 });
      }

      data?.forEach((lead) => {
        const date = new Date(lead.created_at);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          current.leads += 1;
          if (lead.lead_status === "converted") {
            current.converted += 1;
            current.revenue += Number(lead.potential_revenue) || 0;
          }
        }
      });

      // Convert to array format for charts
      const result: { month: string; leads: number; converted: number; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const data = monthlyMap.get(key) || { leads: 0, converted: 0, revenue: 0 };
        result.push({
          month: months[d.getMonth()],
          ...data,
        });
      }

      return result;
    },
    enabled: !!user,
  });
}

export function useRoomDistribution(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["room-distribution", academicYear],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("room_choice, academic_year");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((lead) => {
        counts[lead.room_choice] = (counts[lead.room_choice] || 0) + 1;
      });

      return counts;
    },
    enabled: !!user,
  });
}

export function useStatusDistribution(academicYear?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["status-distribution", academicYear],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("lead_status, academic_year");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((lead) => {
        counts[lead.lead_status] = (counts[lead.lead_status] || 0) + 1;
      });

      return counts;
    },
    enabled: !!user,
  });
}
