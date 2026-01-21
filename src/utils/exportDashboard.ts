import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUS_CONFIG, ROOM_CHOICE_CONFIG } from "@/types/crm";
import type { DashboardStats } from "@/hooks/useDashboardStats";

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
function calculateStatsFromLeads(leads: any[]): DashboardStats {
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.lead_status === "new").length;
  const awaitingOutreach = leads.filter(l => l.lead_status === "awaiting_outreach").length;
  const lowEngagement = leads.filter(l => l.lead_status === "low_engagement").length;
  const highInterest = leads.filter(l => l.lead_status === "high_interest").length;
  const converted = leads.filter(l => l.lead_status === "converted").length;
  const closed = leads.filter(l => l.lead_status === "closed").length;

  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
  
  const totalRevenue = leads
    .filter(l => l.lead_status === "converted")
    .reduce((sum, l) => sum + (l.potential_revenue || 0), 0);

  const forecastRevenue = leads
    .filter(l => l.lead_status === "high_interest")
    .reduce((sum, l) => sum + (l.potential_revenue || 0), 0);

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

// Calculate monthly data from filtered leads
function calculateMonthlyData(leads: any[]) {
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
      current.revenue += Number(lead.potential_revenue) || 0;
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

export async function exportDashboardToExcel(data: DashboardExportData) {
  const { startDate, endDate, currencySymbol } = data;
  
  // Fetch leads for the date range
  const leads = await fetchLeadsByDateRange(startDate, endDate);
  const stats = calculateStatsFromLeads(leads);
  const monthlyData = calculateMonthlyData(leads);
  const roomDistribution = calculateRoomDistribution(leads);
  const statusDistribution = calculateStatusDistribution(leads);

  // Format leads for export
  const formattedLeads = leads.map(lead => ({
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    room_choice: lead.room_choice,
    stay_duration: lead.stay_duration,
    lead_status: lead.lead_status,
    potential_revenue: lead.potential_revenue || 0,
    academic_year: lead.academic_year || "N/A",
    is_hot: lead.is_hot || false,
    created_at: lead.created_at,
    landing_page: lead.landing_page || null,
    contact_reason: lead.contact_reason || null,
    contact_message: lead.contact_message || null,
    keyworker_length_of_stay: lead.keyworker_length_of_stay || null,
    keyworker_preferred_date: lead.keyworker_preferred_date || null,
  }));

  // Fetch sources for proper labeling
  const sources = await fetchLeadSources();

  // Use the existing export function
  const { exportToExcel } = await import("./exportReports");
  await exportToExcel({
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    currencySymbol,
    sources,
    leads: formattedLeads,
  });
}

export async function exportDashboardToPDF(data: DashboardExportData) {
  const { startDate, endDate, currencySymbol } = data;
  
  // Fetch leads for the date range
  const leads = await fetchLeadsByDateRange(startDate, endDate);
  const stats = calculateStatsFromLeads(leads);
  const monthlyData = calculateMonthlyData(leads);
  const roomDistribution = calculateRoomDistribution(leads);
  const statusDistribution = calculateStatusDistribution(leads);

  // Format leads for export
  const formattedLeads = leads.map(lead => ({
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    room_choice: lead.room_choice,
    stay_duration: lead.stay_duration,
    lead_status: lead.lead_status,
    potential_revenue: lead.potential_revenue || 0,
    academic_year: lead.academic_year || "N/A",
    is_hot: lead.is_hot || false,
    created_at: lead.created_at,
  }));

  // Fetch sources for proper labeling
  const sources = await fetchLeadSources();

  // Use the existing export function
  const { exportToPDF } = await import("./exportReports");
  await exportToPDF({
    stats,
    monthlyData,
    roomDistribution,
    statusDistribution,
    dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`,
    currencySymbol,
    sources,
    leads: formattedLeads,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

