import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";

import type { DashboardStats } from "@/hooks/useDashboardStats";

import { buildNationalityDistribution } from "@/utils/phoneNationality";

import { fetchRoomPricesByYear } from "@/utils/leadPotentialRevenue";

import {

  aggregateLeadRevenueStats,

  getEffectivePotentialRevenue,

  type LeadRevenueRow,

} from "@/utils/leadRevenueStats";



const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



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



export interface SourceReportsData {

  stats: DashboardStats;

  monthlyData: Array<{ month: string; leads: number; converted: number; revenue: number }>;

  roomData: Record<string, number>;

  statusData: Record<string, number>;

  statusRevenueData: Record<string, number>;

  nationalityData: Record<string, number>;

}



export function useSourceReports(

  sourceSlug: string | undefined,

  academicYear?: string | null,

  startDate?: Date | null,

  endDate?: Date | null,

) {

  const { user } = useAuth();

  const rangeEnd = endDate ?? new Date();



  return useQuery({

    queryKey: [

      "source-reports",

      sourceSlug,

      academicYear,

      startDate?.toISOString(),

      endDate?.toISOString(),

    ],

    queryFn: async (): Promise<SourceReportsData> => {

      if (!sourceSlug) {

        throw new Error("Source slug is required");

      }



      const roomPricesByYear = await fetchRoomPricesByYear(supabase);



      let query = supabase

        .from("leads")

        .select(

          "created_at, lead_status, potential_revenue, room_choice, stay_duration, phone, academic_year, source, metadata",

        )

        .eq("source", sourceSlug);



      if (academicYear && academicYear.trim() !== "") {

        query = query.eq("academic_year", academicYear);

      }

      if (startDate) {

        query = query.gte("created_at", startDate.toISOString());

      }

      if (endDate) {

        query = query.lte("created_at", endDate.toISOString());

      }



      const { data: leads, error } = await query;

      if (error) throw error;



      const rows = (leads ?? []) as LeadRevenueRow[];

      const stats = aggregateLeadRevenueStats(rows, roomPricesByYear);



      const monthBuckets = buildMonthBuckets(startDate ?? null, rangeEnd);

      const monthlyMap = new Map<string, { leads: number; converted: number; revenue: number }>();

      monthBuckets.forEach((d) => {

        monthlyMap.set(`${d.getFullYear()}-${d.getMonth()}`, { leads: 0, converted: 0, revenue: 0 });

      });



      const roomData: Record<string, number> = {};

      const statusData: Record<string, number> = {};



      rows.forEach((lead) => {

        roomData[lead.room_choice] = (roomData[lead.room_choice] || 0) + 1;

        statusData[lead.lead_status] = (statusData[lead.lead_status] || 0) + 1;



        const date = new Date(lead.created_at!);

        const key = `${date.getFullYear()}-${date.getMonth()}`;

        if (monthlyMap.has(key)) {

          const bucket = monthlyMap.get(key)!;

          bucket.leads += 1;

          if (lead.lead_status === "converted") {

            bucket.converted += 1;

            bucket.revenue += getEffectivePotentialRevenue(lead, roomPricesByYear);

          }

        }

      });



      const monthlyData = monthBuckets.map((d) => {

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



      return {

        stats,

        monthlyData,

        roomData,

        statusData,

        statusRevenueData: stats.statusRevenue,

        nationalityData: buildNationalityDistribution(rows),

      };

    },

    enabled: !!user && academicYear !== null && !!sourceSlug,

  });

}

