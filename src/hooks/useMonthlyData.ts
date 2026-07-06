import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildNationalityDistribution } from "@/utils/phoneNationality";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function buildMonthBuckets(startDate: Date | null, endDate: Date): Date[] {
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const start = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    : new Date(end.getFullYear(), end.getMonth() - 5, 1);

  const buckets: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    buckets.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (buckets.length === 0) {
    buckets.push(new Date(end));
  }
  if (buckets.length > 12) {
    return buckets.slice(-12);
  }
  return buckets;
}

export function useMonthlyLeadData(
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();
  const rangeEnd = endDate ?? new Date();

  return useQuery({
    queryKey: ["monthly-lead-data", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("created_at, lead_status, potential_revenue, academic_year");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate ?? rangeEnd);

      const { data, error } = await query;

      if (error) throw error;

      const monthBuckets = buildMonthBuckets(startDate ?? null, rangeEnd);
      const monthlyMap = new Map<string, { leads: number; converted: number; revenue: number }>();

      monthBuckets.forEach((d) => {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyMap.set(key, { leads: 0, converted: 0, revenue: 0 });
      });

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

      return monthBuckets.map((d) => {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = monthlyMap.get(key) || { leads: 0, converted: 0, revenue: 0 };
        const yearSuffix =
          monthBuckets.length > 1 && new Set(monthBuckets.map((b) => b.getFullYear())).size > 1
            ? ` '${String(d.getFullYear()).slice(-2)}`
            : "";
        return {
          month: `${MONTH_LABELS[d.getMonth()]}${yearSuffix}`,
          ...bucket,
        };
      });
    },
    enabled: !!user && academicYear !== null,
  });
}

export function useRoomDistribution(
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["room-distribution", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("room_choice, academic_year, created_at");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((lead) => {
        counts[lead.room_choice] = (counts[lead.room_choice] || 0) + 1;
      });

      return counts;
    },
    enabled: !!user && academicYear !== null,
  });
}

export function useStatusDistribution(
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["status-distribution", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("lead_status, academic_year, created_at");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((lead) => {
        counts[lead.lead_status] = (counts[lead.lead_status] || 0) + 1;
      });

      return counts;
    },
    enabled: !!user && academicYear !== null,
  });
}

export function useNationalityDistribution(
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["nationality-distribution", academicYear, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("phone, academic_year, created_at");

      if (academicYear && academicYear.trim() !== "") {
        query = query.eq("academic_year", academicYear);
      }
      query = applyLeadDateFilters(query, startDate, endDate);

      const { data, error } = await query;

      if (error) throw error;

      return buildNationalityDistribution(data ?? []);
    },
    enabled: !!user && academicYear !== null,
  });
}
