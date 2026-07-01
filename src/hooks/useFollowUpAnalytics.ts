import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  | "id"
  | "lead_status"
  | "followup_count"
  | "created_at"
  | "last_followup_date"
  | "next_followup_date"
>;

type FollowUpRow = Pick<
  Database["public"]["Tables"]["lead_followups"]["Row"],
  "id" | "lead_id" | "followup_type" | "outcome" | "followup_date" | "followup_number"
>;

export interface FollowUpAnalytics {
  totalLeads: number;
  closedLeads: number;
  convertedLeads: number;
  leadsWith3PlusFollowups: number;
  complianceRate: number;
  averageFollowupsToConversion: number;
  averageTimeToFirstFollowup: number;
  averageFollowupInterval: number;
  followupResponseRate: number;
  followupTypeEffectiveness: {
    type: string;
    count: number;
    conversionRate: number;
  }[];
  overdueFollowups: number;
  upcomingFollowups: number;
  loggedFollowupsInRange: number;
  leadsWithFirstFollowup: number;
}

const SUCCESSFUL_OUTCOMES = new Set([
  "contacted",
  "interested",
  "callback_requested",
  "voicemail",
]);

const LEAD_PAGE_SIZE = 1000;
const FOLLOWUP_ID_CHUNK = 150;

async function fetchLeadsForAnalytics(
  academicYear?: string | null,
): Promise<LeadRow[]> {
  const allLeads: LeadRow[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("leads")
      .select(
        "id, lead_status, followup_count, created_at, last_followup_date, next_followup_date",
      )
      .order("created_at", { ascending: true })
      .range(from, from + LEAD_PAGE_SIZE - 1);

    if (academicYear && academicYear.trim() !== "") {
      query = query.eq("academic_year", academicYear);
    }

    const { data, error } = await query;
    if (error) throw error;

    const page = data ?? [];
    allLeads.push(...page);

    if (page.length < LEAD_PAGE_SIZE) break;
    from += LEAD_PAGE_SIZE;
  }

  return allLeads;
}

async function fetchFollowupsForLeads(leadIds: string[]): Promise<FollowUpRow[]> {
  if (leadIds.length === 0) return [];

  const allFollowups: FollowUpRow[] = [];

  for (let i = 0; i < leadIds.length; i += FOLLOWUP_ID_CHUNK) {
    const chunk = leadIds.slice(i, i + FOLLOWUP_ID_CHUNK);
    const { data, error } = await supabase
      .from("lead_followups")
      .select("id, lead_id, followup_type, outcome, followup_date, followup_number")
      .in("lead_id", chunk)
      .order("followup_date", { ascending: true });

    if (error) throw error;
    if (data) allFollowups.push(...data);
  }

  return allFollowups;
}

function groupFollowupsByLeadId(followups: FollowUpRow[]) {
  const map = new Map<string, FollowUpRow[]>();
  for (const followup of followups) {
    const existing = map.get(followup.lead_id) ?? [];
    existing.push(followup);
    map.set(followup.lead_id, existing);
  }
  return map;
}

function effectiveFollowupCount(lead: LeadRow, followups: FollowUpRow[] | undefined) {
  const recordCount = followups?.length ?? 0;
  return Math.max(lead.followup_count ?? 0, recordCount);
}

function isFollowupInRange(
  followupDate: string,
  startDate?: Date | null,
  endDate?: Date | null,
) {
  const timestamp = new Date(followupDate).getTime();
  if (startDate && timestamp < startDate.getTime()) return false;
  if (endDate && timestamp > endDate.getTime()) return false;
  return true;
}

export function useFollowUpAnalytics(
  academicYear?: string | null,
  startDate?: Date | null,
  endDate?: Date | null,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [
      "followup-analytics",
      academicYear,
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    queryFn: async (): Promise<FollowUpAnalytics> => {
      const leads = await fetchLeadsForAnalytics(academicYear);
      const leadIds = leads.map((lead) => lead.id);
      const allFollowups = await fetchFollowupsForLeads(leadIds);
      const followupsByLeadId = groupFollowupsByLeadId(allFollowups);

      const rangedFollowups = allFollowups.filter((followup) =>
        isFollowupInRange(followup.followup_date, startDate, endDate),
      );

      const totalLeads = leads.length;
      const closedLeads = leads.filter((lead) => lead.lead_status === "closed");
      const convertedLeads = leads.filter((lead) => lead.lead_status === "converted");

      const leadsWith3Plus = closedLeads.filter(
        (lead) =>
          effectiveFollowupCount(lead, followupsByLeadId.get(lead.id)) >= 3,
      );

      const complianceRate =
        closedLeads.length > 0
          ? (leadsWith3Plus.length / closedLeads.length) * 100
          : 0;

      const convertedWithFollowups = convertedLeads.filter(
        (lead) => effectiveFollowupCount(lead, followupsByLeadId.get(lead.id)) > 0,
      );

      const averageFollowupsToConversion =
        convertedWithFollowups.length > 0
          ? convertedWithFollowups.reduce(
              (sum, lead) =>
                sum + effectiveFollowupCount(lead, followupsByLeadId.get(lead.id)),
              0,
            ) / convertedWithFollowups.length
          : 0;

      let totalHoursToFirst = 0;
      let firstFollowupLeadCount = 0;

      for (const lead of leads) {
        const leadFollowups = followupsByLeadId.get(lead.id) ?? [];
        if (leadFollowups.length > 0) {
          const firstFollowup = leadFollowups.reduce((earliest, current) =>
            new Date(current.followup_date).getTime() <
            new Date(earliest.followup_date).getTime()
              ? current
              : earliest,
          );
          const hours =
            (new Date(firstFollowup.followup_date).getTime() -
              new Date(lead.created_at).getTime()) /
            (1000 * 60 * 60);
          if (hours >= 0) {
            totalHoursToFirst += hours;
            firstFollowupLeadCount++;
          }
          continue;
        }

        if ((lead.followup_count ?? 0) > 0 && lead.last_followup_date) {
          const hours =
            (new Date(lead.last_followup_date).getTime() -
              new Date(lead.created_at).getTime()) /
            (1000 * 60 * 60);
          if (hours >= 0) {
            totalHoursToFirst += hours;
            firstFollowupLeadCount++;
          }
        }
      }

      const averageTimeToFirstFollowup =
        firstFollowupLeadCount > 0 ? totalHoursToFirst / firstFollowupLeadCount : 0;

      let totalIntervalHours = 0;
      let intervalCount = 0;

      for (const lead of leads) {
        const leadFollowups = (followupsByLeadId.get(lead.id) ?? [])
          .filter((followup) =>
            isFollowupInRange(followup.followup_date, startDate, endDate),
          )
          .sort(
            (a, b) =>
              new Date(a.followup_date).getTime() - new Date(b.followup_date).getTime(),
          );

        for (let i = 1; i < leadFollowups.length; i++) {
          const hours =
            (new Date(leadFollowups[i].followup_date).getTime() -
              new Date(leadFollowups[i - 1].followup_date).getTime()) /
            (1000 * 60 * 60);
          if (hours >= 0) {
            totalIntervalHours += hours;
            intervalCount++;
          }
        }
      }

      const averageFollowupInterval =
        intervalCount > 0 ? totalIntervalHours / intervalCount : 0;

      const contactedFollowups = rangedFollowups.filter((followup) =>
        SUCCESSFUL_OUTCOMES.has(followup.outcome),
      );
      const followupResponseRate =
        rangedFollowups.length > 0
          ? (contactedFollowups.length / rangedFollowups.length) * 100
          : 0;

      const typeStats = new Map<string, { count: number; convertedLeadIds: Set<string> }>();
      const convertedLeadIds = new Set(convertedLeads.map((lead) => lead.id));

      for (const followup of rangedFollowups) {
        const existing = typeStats.get(followup.followup_type) ?? {
          count: 0,
          convertedLeadIds: new Set<string>(),
        };
        existing.count++;
        if (convertedLeadIds.has(followup.lead_id)) {
          existing.convertedLeadIds.add(followup.lead_id);
        }
        typeStats.set(followup.followup_type, existing);
      }

      const leadsByType = new Map<string, Set<string>>();
      for (const followup of rangedFollowups) {
        const leadIdsForType = leadsByType.get(followup.followup_type) ?? new Set<string>();
        leadIdsForType.add(followup.lead_id);
        leadsByType.set(followup.followup_type, leadIdsForType);
      }

      const followupTypeEffectiveness = Array.from(typeStats.entries()).map(
        ([type, data]) => {
          const leadsWithType = leadsByType.get(type)?.size ?? 0;
          return {
            type,
            count: data.count,
            conversionRate:
              leadsWithType > 0
                ? (data.convertedLeadIds.size / leadsWithType) * 100
                : 0,
          };
        },
      );

      const now = new Date();
      const overdueFollowups = leads.filter(
        (lead) =>
          lead.lead_status !== "converted" &&
          lead.lead_status !== "closed" &&
          lead.next_followup_date &&
          new Date(lead.next_followup_date) < now,
      ).length;

      const upcomingFollowups = leads.filter(
        (lead) =>
          lead.lead_status !== "converted" &&
          lead.lead_status !== "closed" &&
          lead.next_followup_date &&
          new Date(lead.next_followup_date) > now &&
          new Date(lead.next_followup_date) <=
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ).length;

      return {
        totalLeads,
        closedLeads: closedLeads.length,
        convertedLeads: convertedLeads.length,
        leadsWith3PlusFollowups: leadsWith3Plus.length,
        complianceRate,
        averageFollowupsToConversion,
        averageTimeToFirstFollowup,
        averageFollowupInterval,
        followupResponseRate,
        followupTypeEffectiveness,
        overdueFollowups,
        upcomingFollowups,
        loggedFollowupsInRange: rangedFollowups.length,
        leadsWithFirstFollowup: firstFollowupLeadCount,
      };
    },
    enabled: !!user && academicYear !== null,
  });
}

export function useOverdueFollowups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["overdue-followups"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_overdue_followups");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}
