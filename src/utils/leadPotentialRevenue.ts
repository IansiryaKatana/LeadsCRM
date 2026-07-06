import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  isPaymentLeadSource,
  isPipelinePricingLeadSource,
} from "@/constants/leadSegments";
import {
  calculatePipelineLeadRevenue,
  normalizeRoomPricesByYear,
  type RoomPricesByYear,
} from "@/utils/roomPrices";
import { getLeadPaymentAmountPounds } from "@/utils/leadPaymentAmount";

type Supabase = SupabaseClient<Database>;

export async function fetchRoomPricesByYear(
  supabase: Supabase,
): Promise<RoomPricesByYear> {
  const [{ data: roomPricesSetting }, { data: academicYearsSetting }] =
    await Promise.all([
      supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "room_prices")
        .maybeSingle(),
      supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "academic_years")
        .maybeSingle(),
    ]);

  const academicYears = Array.isArray(academicYearsSetting?.setting_value)
    ? (academicYearsSetting.setting_value as string[])
    : [];

  return normalizeRoomPricesByYear(
    roomPricesSetting?.setting_value,
    academicYears,
  );
}

export function resolveLeadPotentialRevenue(input: {
  roomChoice: string;
  academicYear?: string | null;
  stayDuration?: string | null;
  source: string;
  metadata?: unknown;
  roomPricesByYear: RoomPricesByYear;
  explicitAmount?: number | null;
}): number {
  if (isPaymentLeadSource(input.source)) {
    const fromMetadata = getLeadPaymentAmountPounds(input.metadata);
    if (fromMetadata !== null && fromMetadata > 0) {
      return fromMetadata;
    }
    if (
      input.explicitAmount !== null &&
      input.explicitAmount !== undefined &&
      input.explicitAmount > 0
    ) {
      return input.explicitAmount;
    }
    return 0;
  }

  if (isPipelinePricingLeadSource(input.source)) {
    return calculatePipelineLeadRevenue(
      input.roomChoice,
      input.stayDuration,
      input.roomPricesByYear,
      input.academicYear,
    );
  }

  if (
    input.explicitAmount !== null &&
    input.explicitAmount !== undefined &&
    input.explicitAmount > 0
  ) {
    return input.explicitAmount;
  }

  return 0;
}
