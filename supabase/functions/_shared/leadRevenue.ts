export const PIPELINE_PRICING_SOURCES = new Set(["web_booking", "web_callback"]);

export const PAYMENT_SOURCES = new Set([
  "web_urban_hub_payment",
  "web_deposit",
]);

const DEFAULT_WEEKLY_PRICES: Record<string, number> = {
  platinum: 189,
  gold: 156,
  silver: 122,
  bronze: 100,
  standard: 78,
};

export function getStayDurationWeeks(stayDuration?: string | null): number {
  if (!stayDuration) return 51;
  switch (stayDuration) {
    case "45_weeks":
      return 45;
    case "51_weeks":
      return 51;
    case "short_stay":
      return 12;
    default: {
      const normalized = stayDuration.toLowerCase().trim();
      if (normalized.includes("45")) return 45;
      if (normalized.includes("51")) return 51;
      if (normalized.includes("short")) return 12;
      return 51;
    }
  }
}

function resolveWeeklyRate(
  roomPricesByYear: Record<string, Record<string, number>>,
  room: string,
  academicYear: string,
): number {
  const yearKeys = Object.keys(roomPricesByYear).filter((key) => /^\d{4}\/\d{4}$/.test(key));
  const yearPrices =
    roomPricesByYear[academicYear] ||
    roomPricesByYear[yearKeys.sort().at(-1) || ""] ||
    DEFAULT_WEEKLY_PRICES;

  return yearPrices[room] || yearPrices.silver || DEFAULT_WEEKLY_PRICES.silver;
}

export function calculatePipelineLeadRevenue(
  room: string,
  stayDuration: string | null | undefined,
  roomPricesByYear: Record<string, Record<string, number>>,
  academicYear: string,
): number {
  const weeklyRate = resolveWeeklyRate(roomPricesByYear, room, academicYear);
  const weeks = getStayDurationWeeks(stayDuration);
  return weeklyRate * weeks;
}

export function resolveLeadPotentialRevenue(input: {
  source: string;
  room: string;
  stayDuration?: string | null;
  roomPricesByYear: Record<string, Record<string, number>>;
  academicYear: string;
  paymentAmount?: number;
}): number {
  if (PAYMENT_SOURCES.has(input.source)) {
    return input.paymentAmount && input.paymentAmount > 0 ? input.paymentAmount : 0;
  }

  if (PIPELINE_PRICING_SOURCES.has(input.source)) {
    return calculatePipelineLeadRevenue(
      input.room,
      input.stayDuration,
      input.roomPricesByYear,
      input.academicYear,
    );
  }

  return 0;
}
