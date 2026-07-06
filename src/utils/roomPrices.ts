import type { RoomPrices } from "@/hooks/useSystemSettings";
import { getLatestAcademicYear } from "@/utils/academicYear";
import { getStayDurationWeeks } from "@/utils/stayDuration";

export const ROOM_PRICE_KEYS = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "standard",
] as const satisfies readonly (keyof RoomPrices)[];

export type RoomPriceKey = (typeof ROOM_PRICE_KEYS)[number];

export type RoomPricesByYear = Record<string, RoomPrices>;

/** Default weekly rates (GBP) when settings are missing. */
export const DEFAULT_ROOM_PRICES: RoomPrices = {
  platinum: 189,
  gold: 156,
  silver: 122,
  bronze: 100,
  standard: 78,
};

function isAcademicYearKey(key: string): boolean {
  return /^\d{4}\/\d{4}$/.test(key);
}

/** Detect legacy flat format: { platinum: 8500, ... } */
export function isLegacyRoomPrices(value: unknown): value is RoomPrices {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ROOM_PRICE_KEYS.some((key) => typeof record[key] === "number");
}

function coerceRoomPrices(value: unknown): RoomPrices {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ROOM_PRICES };
  }

  const record = value as Record<string, unknown>;
  return {
    platinum: Number(record.platinum) || DEFAULT_ROOM_PRICES.platinum,
    gold: Number(record.gold) || DEFAULT_ROOM_PRICES.gold,
    silver: Number(record.silver) || DEFAULT_ROOM_PRICES.silver,
    bronze: Number(record.bronze) || DEFAULT_ROOM_PRICES.bronze,
    standard: Number(record.standard) || DEFAULT_ROOM_PRICES.standard,
  };
}

/** Normalize stored setting value into per-academic-year pricing. */
export function normalizeRoomPricesByYear(
  raw: unknown,
  academicYears: string[],
): RoomPricesByYear {
  const years = academicYears.length
    ? academicYears
    : [getLatestAcademicYear(academicYears) || "2025/2026"];

  if (isLegacyRoomPrices(raw)) {
    const flat = coerceRoomPrices(raw);
    return Object.fromEntries(years.map((year) => [year, { ...flat }]));
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return Object.fromEntries(
      years.map((year) => [year, { ...DEFAULT_ROOM_PRICES }]),
    );
  }

  const record = raw as Record<string, unknown>;
  const yearKeys = Object.keys(record).filter(isAcademicYearKey);
  const fallbackYear = getLatestAcademicYear(yearKeys) || years.at(-1) || "2025/2026";
  const fallbackPrices = yearKeys.length
    ? coerceRoomPrices(record[fallbackYear])
    : { ...DEFAULT_ROOM_PRICES };

  const result: RoomPricesByYear = {};

  for (const year of years) {
    result[year] = yearKeys.includes(year)
      ? coerceRoomPrices(record[year])
      : { ...fallbackPrices };
  }

  for (const year of yearKeys) {
    if (!result[year]) {
      result[year] = coerceRoomPrices(record[year]);
    }
  }

  return result;
}

export function getRoomPriceForYear(
  pricesByYear: RoomPricesByYear,
  roomKey: string,
  academicYear?: string | null,
  fallbackYear?: string,
): number {
  const resolvedYear =
    (academicYear && pricesByYear[academicYear] ? academicYear : null) ||
    (fallbackYear && pricesByYear[fallbackYear] ? fallbackYear : null) ||
    getLatestAcademicYear(Object.keys(pricesByYear));

  if (!resolvedYear) {
    return DEFAULT_ROOM_PRICES[roomKey as keyof RoomPrices] || 0;
  }

  return pricesByYear[resolvedYear]?.[roomKey as keyof RoomPrices] || 0;
}

/** Weekly room rate for the lead's academic year. */
export function getWeeklyRoomRate(
  pricesByYear: RoomPricesByYear,
  room: string,
  academicYear?: string | null,
  fallbackYear?: string,
): number {
  return getRoomPriceForYear(pricesByYear, room, academicYear, fallbackYear);
}

/** Weekly rate × stay duration weeks (Book Viewing / Schedule Callback). */
export function calculatePipelineLeadRevenue(
  room: string,
  stayDuration: string | null | undefined,
  pricesByYear: RoomPricesByYear,
  academicYear?: string | null,
): number {
  const weeklyRate = getWeeklyRoomRate(pricesByYear, room, academicYear);
  const weeks = getStayDurationWeeks(stayDuration);
  return weeklyRate * weeks;
}

/** @deprecated Use calculatePipelineLeadRevenue for pipeline pricing sources. */
export function calculateLeadPotentialRevenue(
  room: string,
  pricesByYear: RoomPricesByYear,
  academicYear?: string | null,
): number {
  return getWeeklyRoomRate(pricesByYear, room, academicYear);
}

/** @deprecated Use calculatePipelineLeadRevenue */
export function calculateLeadRevenue(
  room: string,
  duration: string,
  pricesByYear: RoomPricesByYear,
  academicYear?: string | null,
): number {
  return calculatePipelineLeadRevenue(room, duration, pricesByYear, academicYear);
}
export function ensureYearPricing(
  pricesByYear: RoomPricesByYear,
  year: string,
  sourceYear?: string,
): RoomPricesByYear {
  if (pricesByYear[year]) {
    return pricesByYear;
  }

  const copyFrom =
    (sourceYear && pricesByYear[sourceYear]) ||
    pricesByYear[getLatestAcademicYear(Object.keys(pricesByYear))] ||
    DEFAULT_ROOM_PRICES;

  return {
    ...pricesByYear,
    [year]: { ...copyFrom },
  };
}
