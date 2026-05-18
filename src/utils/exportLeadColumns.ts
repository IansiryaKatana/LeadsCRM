import {
  LEAD_STATUS_CONFIG,
  ROOM_CHOICE_CONFIG,
  STAY_DURATION_CONFIG,
  getSourceConfig,
} from "@/types/crm";
import { getLeadPaymentAmountPounds, getLeadPaymentId } from "@/utils/leadPaymentAmount";
import {
  DEPOSITS_PAYMENTS_SOURCE_SLUG,
  INQUIRIES_SOURCE_SLUG,
} from "@/constants/leadSegments";

export type LeadExportProfile = "default" | "deposits_payments" | "web_contact" | "web_keyworkers";

export interface LeadExportColumn {
  key: string;
  header: string;
  width: number;
  mono?: boolean;
  numeric?: boolean;
}

export interface RawLeadForExport {
  full_name: string;
  email: string;
  phone: string;
  source: string;
  room_choice?: string;
  stay_duration?: string;
  lead_status: string;
  potential_revenue?: number;
  academic_year?: string | null;
  is_hot?: boolean;
  created_at: string;
  landing_page?: string | null;
  contact_reason?: string | null;
  contact_message?: string | null;
  keyworker_length_of_stay?: string | null;
  keyworker_preferred_date?: string | null;
  metadata?: unknown;
}

export function resolveLeadExportProfile(
  sourceSlug?: string,
  viewMode?: string
): LeadExportProfile {
  if (viewMode === "deposits_payments" || sourceSlug === DEPOSITS_PAYMENTS_SOURCE_SLUG) {
    return "deposits_payments";
  }
  if (viewMode === "web_contact" || sourceSlug === INQUIRIES_SOURCE_SLUG) {
    return "web_contact";
  }
  if (viewMode === "web_keyworkers" || sourceSlug === "web_keyworkers" || sourceSlug === "web_keyworker") {
    return "web_keyworkers";
  }
  return "default";
}

export function getLeadExportColumns(
  profile: LeadExportProfile,
  currencySymbol = "£"
): LeadExportColumn[] {
  const base: LeadExportColumn[] = [
    { key: "full_name", header: "Full Name", width: 24 },
    { key: "email", header: "Email", width: 30 },
    { key: "phone", header: "Phone", width: 16 },
    { key: "source", header: "Source", width: 18 },
  ];

  switch (profile) {
    case "deposits_payments":
      return [
        ...base,
        { key: "payment_id", header: "Payment ID", width: 36, mono: true },
        { key: "payment_amount", header: `Amount (${currencySymbol})`, width: 16, numeric: true },
        { key: "lead_status", header: "Status", width: 16 },
        { key: "academic_year", header: "Academic Year", width: 14 },
        { key: "is_hot", header: "Hot Lead", width: 10 },
        { key: "created_at", header: "Created Date", width: 14 },
      ];
    case "web_contact":
      return [
        ...base,
        { key: "contact_reason", header: "Contact Reason", width: 22 },
        { key: "contact_message", header: "Message", width: 36 },
        { key: "lead_status", header: "Status", width: 16 },
        { key: "academic_year", header: "Academic Year", width: 14 },
        { key: "created_at", header: "Created Date", width: 14 },
      ];
    case "web_keyworkers":
      return [
        ...base,
        { key: "keyworker_length_of_stay", header: "Length of Stay", width: 18 },
        { key: "keyworker_preferred_date", header: "Preferred Date", width: 16 },
        { key: "lead_status", header: "Status", width: 16 },
        { key: "academic_year", header: "Academic Year", width: 14 },
        { key: "created_at", header: "Created Date", width: 14 },
      ];
    default:
      return [
        ...base,
        { key: "room_choice", header: "Room Choice", width: 14 },
        { key: "stay_duration", header: "Stay Duration", width: 14 },
        { key: "lead_status", header: "Status", width: 16 },
        { key: "landing_page", header: "LP / Campaign", width: 20 },
        { key: "academic_year", header: "Academic Year", width: 14 },
        { key: "is_hot", header: "Hot Lead", width: 10 },
        { key: "created_at", header: "Created Date", width: 14 },
      ];
  }
}

function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatLeadExportRow(
  lead: RawLeadForExport,
  column: LeadExportColumn,
  sources: Array<{ slug: string; name: string; icon: string }> = [],
  currencySymbol = "£"
): string | number {
  switch (column.key) {
    case "full_name":
      return lead.full_name;
    case "email":
      return lead.email;
    case "phone":
      return lead.phone?.trim() || "—";
    case "source":
      return getSourceConfig(lead.source, sources).label;
    case "room_choice":
      return (
        ROOM_CHOICE_CONFIG[lead.room_choice as keyof typeof ROOM_CHOICE_CONFIG]?.label ||
        lead.room_choice ||
        "—"
      );
    case "stay_duration":
      return (
        STAY_DURATION_CONFIG[lead.stay_duration as keyof typeof STAY_DURATION_CONFIG]?.label ||
        lead.stay_duration ||
        "—"
      );
    case "lead_status":
      return (
        LEAD_STATUS_CONFIG[lead.lead_status as keyof typeof LEAD_STATUS_CONFIG]?.label ||
        lead.lead_status
      );
    case "landing_page":
      return lead.landing_page ?? "—";
    case "academic_year":
      return lead.academic_year || "N/A";
    case "is_hot":
      return lead.is_hot ? "Yes" : "No";
    case "created_at":
      return formatCreatedDate(lead.created_at);
    case "contact_reason":
      return lead.contact_reason || "—";
    case "contact_message":
      return lead.contact_message || "—";
    case "keyworker_length_of_stay":
      return lead.keyworker_length_of_stay || "—";
    case "keyworker_preferred_date":
      return lead.keyworker_preferred_date || "—";
    case "payment_id":
      return getLeadPaymentId(lead.metadata) ?? "—";
    case "payment_amount": {
      const amount = getLeadPaymentAmountPounds(lead.metadata);
      return amount !== null ? amount : "—";
    }
    default:
      return "—";
  }
}

export function formatLeadExportDisplayValue(
  value: string | number,
  column: LeadExportColumn,
  currencySymbol: string
): string {
  if (column.key === "payment_amount" && typeof value === "number") {
    return `${currencySymbol}${value.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return String(value);
}

export function mapDbLeadToExportRow(lead: Record<string, unknown>): RawLeadForExport {
  return {
    full_name: String(lead.full_name ?? ""),
    email: String(lead.email ?? ""),
    phone: String(lead.phone ?? ""),
    source: String(lead.source ?? ""),
    room_choice: lead.room_choice as string | undefined,
    stay_duration: lead.stay_duration as string | undefined,
    lead_status: String(lead.lead_status ?? ""),
    academic_year: (lead.academic_year as string) ?? null,
    is_hot: Boolean(lead.is_hot),
    created_at: String(lead.created_at ?? ""),
    landing_page: (lead.landing_page as string) ?? null,
    contact_reason: (lead.contact_reason as string) ?? null,
    contact_message: (lead.contact_message as string) ?? null,
    keyworker_length_of_stay: (lead.keyworker_length_of_stay as string) ?? null,
    keyworker_preferred_date: (lead.keyworker_preferred_date as string) ?? null,
    metadata: lead.metadata,
  };
}
