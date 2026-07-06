import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import type { DashboardStats } from "@/hooks/useDashboardStats";
import {
  mapDbLeadToExportRow,
  resolveLeadExportProfile,
  type LeadExportProfile,
} from "@/utils/exportLeadColumns";
import {
  buildNationalityDistribution,
  nationalityCountsToChartData,
} from "@/utils/phoneNationality";
import { fetchRoomPricesByYear } from "@/utils/leadPotentialRevenue";
import {
  aggregateLeadRevenueStats,
  buildStatusRevenueDistribution,
  getEffectivePotentialRevenue,
  type LeadRevenueRow,
} from "@/utils/leadRevenueStats";

async function fetchLeadSources() {
  const { data, error } = await supabase
    .from("lead_sources")
    .select("slug, name, icon")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export interface SourceExportData {
  startDate: Date | null;
  endDate: Date;
  currencySymbol: string;
  sourceSlug: string;
  sourceName: string;
  academicYear?: string | null;
  dateRangeLabel?: string;
  leadProfile?: LeadExportProfile;
  viewMode?: string;
}

async function fetchLeadsByDateRangeAndSource(
  startDate: Date | null,
  endDate: Date,
  sourceSlug: string,
  academicYear?: string | null,
) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const endISO = end.toISOString();

  let query = supabase
    .from("leads")
    .select("*")
    .eq("source", sourceSlug)
    .lte("created_at", endISO)
    .order("created_at", { ascending: false });

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }
  if (academicYear && academicYear.trim() !== "") {
    query = query.eq("academic_year", academicYear);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function calculateStatsFromLeads(leads: LeadRevenueRow[]): Promise<DashboardStats> {
  const roomPricesByYear = await fetchRoomPricesByYear(supabase);
  return aggregateLeadRevenueStats(leads, roomPricesByYear);
}

async function calculateMonthlyData(leads: LeadRevenueRow[]) {
  const roomPricesByYear = await fetchRoomPricesByYear(supabase);
  const monthlyMap = new Map<string, { leads: number; converted: number; revenue: number }>();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  leads.forEach((lead) => {
    const date = new Date(String(lead.created_at));
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { leads: 0, converted: 0, revenue: 0 });
    }

    const current = monthlyMap.get(key)!;
    current.leads += 1;
    if (lead.lead_status === "converted") {
      current.converted += 1;
      current.revenue += getEffectivePotentialRevenue(lead, roomPricesByYear);
    }
  });

  const result: Array<{ month: string; leads: number; converted: number; revenue: number }> = [];
  const sortedKeys = Array.from(monthlyMap.keys()).sort();

  sortedKeys.forEach((key) => {
    const [, month] = key.split("-");
    const row = monthlyMap.get(key) || { leads: 0, converted: 0, revenue: 0 };
    result.push({
      month: months[parseInt(month, 10)],
      ...row,
    });
  });

  return result;
}

function calculateRoomDistribution(leads: Record<string, unknown>[]) {
  const counts: Record<string, number> = {};
  leads.forEach((lead) => {
    const key = String(lead.room_choice ?? "");
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(ROOM_CHOICE_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: counts[key] || 0,
  }));
}

function calculateStatusDistribution(leads: Record<string, unknown>[]) {
  const counts: Record<string, number> = {};
  leads.forEach((lead) => {
    const key = String(lead.lead_status ?? "");
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: counts[key] || 0,
    fill:
      key === "converted"
        ? "hsl(166, 58%, 47%)"
        : key === "high_interest"
          ? "hsl(211, 100%, 66%)"
          : "hsl(280, 70%, 50%)",
  }));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function buildSourceExportPayload(data: SourceExportData) {
  const { startDate, endDate, currencySymbol, sourceSlug, sourceName, viewMode, academicYear, dateRangeLabel } =
    data;
  const leadProfile =
    data.leadProfile ?? resolveLeadExportProfile(sourceSlug, viewMode);

  const leads = (await fetchLeadsByDateRangeAndSource(startDate, endDate, sourceSlug, academicYear)) as LeadRevenueRow[];
  const stats = await calculateStatsFromLeads(leads);
  const monthlyData = await calculateMonthlyData(leads);
  const roomDistribution = calculateRoomDistribution(leads);
  const statusDistribution = calculateStatusDistribution(leads);
  const statusRevenueDistribution = buildStatusRevenueDistribution(stats.statusRevenue);
  const nationalityDistribution = nationalityCountsToChartData(buildNationalityDistribution(leads));
  const sources = await fetchLeadSources();

  const formattedLeads = leads.map((lead) => mapDbLeadToExportRow(lead));

  const rangeText =
    dateRangeLabel ??
    (startDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : `Through ${formatDate(endDate)}`);

  return {
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    statusRevenueDistribution,
    nationalityDistribution,
    dateRange: `${rangeText} | Source: ${sourceName}`,
    currencySymbol,
    sources,
    leads: formattedLeads,
    leadProfile,
    reportTitle: `${sourceName} Report`,
  };
}

export async function exportSourceToCSV(data: SourceExportData) {
  const payload = await buildSourceExportPayload(data);
  const { exportToCSV } = await import("./exportReports");
  exportToCSV(payload);
}

export async function exportSourceToExcel(data: SourceExportData) {
  const payload = await buildSourceExportPayload(data);
  const { exportToExcel } = await import("./exportReports");
  await exportToExcel(payload);
}

export async function exportSourceToPDF(data: SourceExportData) {
  const payload = await buildSourceExportPayload(data);
  const { exportToPDF } = await import("./exportReports");
  await exportToPDF(payload);
}
