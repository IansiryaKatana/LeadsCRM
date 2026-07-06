import type { StayDuration } from "@/types/crm";
import { STAY_DURATION_CONFIG } from "@/types/crm";

const DEFAULT_PIPELINE_WEEKS = 51;

export function getStayDurationWeeks(stayDuration?: string | null): number {
  if (!stayDuration) return DEFAULT_PIPELINE_WEEKS;

  const config = STAY_DURATION_CONFIG[stayDuration as StayDuration];
  if (config?.weeks) return config.weeks;

  const normalized = stayDuration.toLowerCase().trim();
  if (normalized.includes("45")) return 45;
  if (normalized.includes("51")) return 51;
  if (normalized.includes("short")) return STAY_DURATION_CONFIG.short_stay.weeks;

  return DEFAULT_PIPELINE_WEEKS;
}
