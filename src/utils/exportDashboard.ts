import { supabase } from "@/integrations/supabase/client";
import { buildNationalityDistribution, nationalityCountsToChartData } from "@/utils/phoneNationality";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import type { DashboardStats } from "@/hooks/useDashboardStats";
import { mapDbLeadToExportRow } from "@/utils/exportLeadColumns";
import { fetchRoomPricesByYear } from "@/utils/leadPotentialRevenue";
import {
  aggregateLeadRevenueStats,
  buildStatusRevenueDistribution,
  getEffectivePotentialRevenue,
  type LeadRevenueRow,
} from "@/utils/leadRevenueStats";

// Fetch active lead sources
async function fetchLeadSources() {
  const { data, error } = await supabase
    .from("lead_sources")
    .select("slug, name, icon")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  
  if (error) throw error;
  return data || [];
}

interface DashboardExportData {
  startDate: Date;
  endDate: Date;
  currencySymbol: string;
}

// Fetch leads filtered by date range
async function fetchLeadsByDateRange(startDate: Date, endDate: Date) {
  const start = startDate.toISOString();
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const endISO = end.toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .gte("created_at", start)
    .lte("created_at", endISO)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Calculate stats from filtered leads
async function calculateStatsFromLeads(leads: LeadRevenueRow[]): Promise<DashboardStats> {
  const roomPricesByYear = await fetchRoomPricesByYear(supabase);
  return aggregateLeadRevenueStats(leads, roomPricesByYear);
}

// Calculate monthly data from filtered leads
async function calculateMonthlyData(leads: LeadRevenueRow[]) {
  const roomPricesByYear = await fetchRoomPricesByYear(supabase);
  const monthlyMap = new Map<string, { leads: number; converted: number; revenue: number }>();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  leads.forEach((lead) => {
    const date = new Date(lead.created_at);
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
    const [year, month] = key.split("-");
    const data = monthlyMap.get(key) || { leads: 0, converted: 0, revenue: 0 };
    result.push({
      month: months[parseInt(month)],
      ...data,
    });
  });

  return result;
}

// Calculate room distribution from filtered leads
function calculateRoomDistribution(leads: any[]) {
  const counts: Record<string, number> = {};
  leads.forEach((lead) => {
    counts[lead.room_choice] = (counts[lead.room_choice] || 0) + 1;
  });

  return Object.entries(ROOM_CHOICE_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: counts[key] || 0,
  }));
}

// Calculate status distribution from filtered leads
function calculateStatusDistribution(leads: any[]) {
  const counts: Record<string, number> = {};
  leads.forEach((lead) => {
    counts[lead.lead_status] = (counts[lead.lead_status] || 0) + 1;
  });

  return Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => ({
    name: config.label,
    value: counts[key] || 0,
    fill: key === "converted" ? "hsl(166, 58%, 47%)" : key === "high_interest" ? "hsl(211, 100%, 66%)" : "hsl(280, 70%, 50%)",
  }));
}

function calculateChannelPerformance(leads: LeadRevenueRow[], roomPricesByYear: Awaited<ReturnType<typeof fetchRoomPricesByYear>>) {
  const sourceMap = new Map<string, { leads: number; converted: number; revenue: number }>();

  leads.forEach((lead) => {
    const existing = sourceMap.get(lead.source) || { leads: 0, converted: 0, revenue: 0 };
    existing.leads++;
    if (lead.lead_status === "converted") {
      existing.converted++;
      existing.revenue += getEffectivePotentialRevenue(lead, roomPricesByYear);
    }
    sourceMap.set(lead.source, existing);
  });

  return Array.from(sourceMap.entries()).map(([source, stats]) => ({
    source,
    ...stats,
  }));
}

function calculateNationalityDistribution(leads: any[]) {
  return nationalityCountsToChartData(buildNationalityDistribution(leads));
}

async function buildDashboardExportPayload(data: DashboardExportData) {
  const { startDate, endDate, currencySymbol } = data;
  const leads = (await fetchLeadsByDateRange(startDate, endDate)) as LeadRevenueRow[];
  const sources = await fetchLeadSources();
  const roomPricesByYear = await fetchRoomPricesByYear(supabase);
  const stats = await calculateStatsFromLeads(leads);

  return {
    stats,
    monthlyData: await calculateMonthlyData(leads),
    roomDistribution: calculateRoomDistribution(leads),
    statusDistribution: calculateStatusDistribution(leads),
    statusRevenueDistribution: buildStatusRevenueDistribution(stats.statusRevenue),
    channelPerformance: calculateChannelPerformance(leads, roomPricesByYear),
    nationalityDistribution: calculateNationalityDistribution(leads),
    dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    currencySymbol,
    sources,
    leads: leads.map((lead) => mapDbLeadToExportRow(lead)),
    leadProfile: "default" as const,
    reportTitle: "Dashboard Performance Report",
  };
}

export async function exportDashboardToCSV(data: DashboardExportData) {
  const payload = await buildDashboardExportPayload(data);
  const { exportToCSV } = await import("./exportReports");
  exportToCSV(payload);
}

export async function exportDashboardToExcel(data: DashboardExportData) {
  const payload = await buildDashboardExportPayload(data);
  const { exportToExcel } = await import("./exportReports");
  await exportToExcel(payload);
}

export async function exportDashboardToPDF(data: DashboardExportData) {
  const payload = await buildDashboardExportPayload(data);
  const { exportToPDF } = await import("./exportReports");
  await exportToPDF(payload);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

