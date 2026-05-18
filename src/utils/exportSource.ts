import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import type { DashboardStats } from "@/hooks/useDashboardStats";
import {
  mapDbLeadToExportRow,
  resolveLeadExportProfile,
  type LeadExportProfile,
} from "@/utils/exportLeadColumns";

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
  startDate: Date;
  endDate: Date;
  currencySymbol: string;
  sourceSlug: string;
  sourceName: string;
  leadProfile?: LeadExportProfile;
  viewMode?: string;
}

async function fetchLeadsByDateRangeAndSource(startDate: Date, endDate: Date, sourceSlug: string) {
  const start = startDate.toISOString();
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const endISO = end.toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("source", sourceSlug)
    .gte("created_at", start)
    .lte("created_at", endISO)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function calculateStatsFromLeads(leads: Record<string, unknown>[]): DashboardStats {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.lead_status === "new").length;
  const awaitingOutreach = leads.filter((l) => l.lead_status === "awaiting_outreach").length;
  const lowEngagement = leads.filter((l) => l.lead_status === "low_engagement").length;
  const highInterest = leads.filter((l) => l.lead_status === "high_interest").length;
  const converted = leads.filter((l) => l.lead_status === "converted").length;
  const closed = leads.filter((l) => l.lead_status === "closed").length;

  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  const totalRevenue = leads
    .filter((l) => l.lead_status === "converted")
    .reduce((sum, l) => sum + (Number(l.potential_revenue) || 0), 0);

  const forecastRevenue = leads
    .filter((l) => l.lead_status === "high_interest")
    .reduce((sum, l) => sum + (Number(l.potential_revenue) || 0), 0);

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
}

function calculateMonthlyData(leads: Record<string, unknown>[]) {
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
      current.revenue += Number(lead.potential_revenue) || 0;
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
  const { startDate, endDate, currencySymbol, sourceSlug, sourceName, viewMode } = data;
  const leadProfile =
    data.leadProfile ?? resolveLeadExportProfile(sourceSlug, viewMode);

  const leads = await fetchLeadsByDateRangeAndSource(startDate, endDate, sourceSlug);
  const stats = calculateStatsFromLeads(leads);
  const monthlyData = calculateMonthlyData(leads);
  const roomDistribution = calculateRoomDistribution(leads);
  const statusDistribution = calculateStatusDistribution(leads);
  const sources = await fetchLeadSources();

  const formattedLeads = leads.map((lead) => mapDbLeadToExportRow(lead));

  return {
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    dateRange: `${formatDate(startDate)} - ${formatDate(endDate)} | Source: ${sourceName}`,
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
