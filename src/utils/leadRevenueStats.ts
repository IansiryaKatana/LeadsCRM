import type { DashboardStats } from "@/hooks/useDashboardStats";
import { isPaymentLeadSource, isPipelinePricingLeadSource } from "@/constants/leadSegments";
import { LEAD_STATUS_CONFIG } from "@/types/crm";
import { resolveLeadPotentialRevenue } from "@/utils/leadPotentialRevenue";
import type { RoomPricesByYear } from "@/utils/roomPrices";

export interface LeadRevenueRow {
  lead_status: string;
  potential_revenue?: number | null;
  room_choice: string;
  stay_duration?: string | null;
  academic_year?: string | null;
  source: string;
  metadata?: unknown;
  created_at?: string;
}

const ACTIVE_PIPELINE_STATUSES = new Set([
  "new",
  "awaiting_outreach",
  "low_engagement",
  "high_interest",
]);

export interface LeadRevenueAggregation extends DashboardStats {
  pipelineRevenue: number;
  statusRevenue: Record<string, number>;
}

export function getEffectivePotentialRevenue(
  lead: LeadRevenueRow,
  roomPricesByYear: RoomPricesByYear,
): number {
  if (isPaymentLeadSource(lead.source) || isPipelinePricingLeadSource(lead.source)) {
    return resolveLeadPotentialRevenue({
      roomChoice: lead.room_choice,
      academicYear: lead.academic_year,
      stayDuration: lead.stay_duration,
      source: lead.source,
      metadata: lead.metadata,
      roomPricesByYear,
      explicitAmount: lead.potential_revenue,
    });
  }

  const stored = Number(lead.potential_revenue) || 0;
  if (stored > 0) return stored;

  return 0;
}

export function aggregateLeadRevenueStats(
  leads: LeadRevenueRow[],
  roomPricesByYear: RoomPricesByYear,
): LeadRevenueAggregation {
  const enriched = leads.map((lead) => ({
    ...lead,
    effectiveRevenue: getEffectivePotentialRevenue(lead, roomPricesByYear),
  }));

  const countByStatus = (status: string) =>
    enriched.filter((lead) => lead.lead_status === status).length;

  const sumRevenueByStatus = (status: string) =>
    enriched
      .filter((lead) => lead.lead_status === status)
      .reduce((sum, lead) => sum + lead.effectiveRevenue, 0);

  const totalLeads = enriched.length;
  const converted = countByStatus("converted");
  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  const statusRevenue: Record<string, number> = {};
  enriched.forEach((lead) => {
    statusRevenue[lead.lead_status] =
      (statusRevenue[lead.lead_status] || 0) + lead.effectiveRevenue;
  });

  const pipelineRevenue = enriched
    .filter((lead) => ACTIVE_PIPELINE_STATUSES.has(lead.lead_status))
    .reduce((sum, lead) => sum + lead.effectiveRevenue, 0);

  return {
    totalLeads,
    newLeads: countByStatus("new"),
    awaitingOutreach: countByStatus("awaiting_outreach"),
    lowEngagement: countByStatus("low_engagement"),
    highInterest: countByStatus("high_interest"),
    converted,
    closed: countByStatus("closed"),
    conversionRate,
    totalRevenue: sumRevenueByStatus("converted"),
    forecastRevenue: sumRevenueByStatus("high_interest"),
    pipelineRevenue,
    statusRevenue,
  };
}

export function buildStatusRevenueDistribution(
  statusRevenue: Record<string, number>,
): Array<{ name: string; value: number; fill: string }> {
  return Object.entries(LEAD_STATUS_CONFIG)
    .map(([key, config]) => ({
      name: config.label,
      value: statusRevenue[key] || 0,
      fill:
        key === "converted"
          ? "hsl(166, 58%, 47%)"
          : key === "high_interest"
            ? "hsl(211, 100%, 66%)"
            : "hsl(280, 70%, 50%)",
    }))
    .filter((item) => item.value > 0);
}
