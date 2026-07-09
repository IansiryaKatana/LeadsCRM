import {
  LEAD_STATUS_CONFIG,
  ROOM_CHOICE_CONFIG,
  STAY_DURATION_CONFIG,
  type LeadStatus,
  type RoomChoice,
  type StayDuration,
} from "@/types/crm";
import { getLeadPaymentAmountPounds, getLeadPaymentId } from "@/utils/leadPaymentAmount";

function normalizeSearchTerm(query: string): string {
  return query.trim().toLowerCase();
}

function addSearchableValue(values: string[], value: unknown): void {
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return;
    values.push(trimmed);
    const compact = trimmed.replace(/\s+/g, "");
    if (compact !== trimmed) values.push(compact);
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length >= 4) values.push(digitsOnly);
    return;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    values.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => addSearchableValue(values, item));
    return;
  }

  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      addSearchableValue(values, item),
    );
  }
}

export interface LeadSearchOptions {
  assignedToName?: string | null;
  sourceLabel?: string | null;
}

export function getLeadSearchHaystack(
  lead: Record<string, unknown>,
  options?: LeadSearchOptions,
): string {
  const values: string[] = [];

  const scalarFields = [
    "id",
    "full_name",
    "email",
    "phone",
    "source",
    "lead_status",
    "room_choice",
    "stay_duration",
    "academic_year",
    "landing_page",
    "contact_reason",
    "contact_message",
    "keyworker_length_of_stay",
    "keyworker_preferred_date",
    "assigned_to",
    "created_by",
  ] as const;

  for (const field of scalarFields) {
    addSearchableValue(values, lead[field]);
  }

  addSearchableValue(values, lead.potential_revenue);

  const leadStatus = lead.lead_status as LeadStatus | undefined;
  if (leadStatus && LEAD_STATUS_CONFIG[leadStatus]) {
    values.push(LEAD_STATUS_CONFIG[leadStatus].label);
  }

  const roomChoice = lead.room_choice as RoomChoice | undefined;
  if (roomChoice && ROOM_CHOICE_CONFIG[roomChoice]) {
    values.push(ROOM_CHOICE_CONFIG[roomChoice].label);
  }

  const stayDuration = lead.stay_duration as StayDuration | undefined;
  if (stayDuration && STAY_DURATION_CONFIG[stayDuration]) {
    values.push(STAY_DURATION_CONFIG[stayDuration].label);
  }

  const paymentId = getLeadPaymentId(lead.metadata);
  if (paymentId) values.push(paymentId);

  const paymentAmount = getLeadPaymentAmountPounds(lead.metadata);
  if (paymentAmount !== null) values.push(String(paymentAmount));

  addSearchableValue(values, lead.metadata);

  if (options?.assignedToName) addSearchableValue(values, options.assignedToName);
  if (options?.sourceLabel) addSearchableValue(values, options.sourceLabel);

  if (lead.is_hot) values.push("hot");

  return values.join(" ").toLowerCase();
}

export function leadMatchesSearch(
  lead: Record<string, unknown>,
  query: string,
  options?: LeadSearchOptions,
): boolean {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return true;

  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const digitQuery = normalizedQuery.replace(/\D/g, "");
  const haystack = getLeadSearchHaystack(lead, options);

  if (haystack.includes(normalizedQuery)) return true;
  if (compactQuery.length >= 2 && haystack.includes(compactQuery)) return true;
  if (digitQuery.length >= 4 && haystack.includes(digitQuery)) return true;

  return false;
}
