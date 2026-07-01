function compareAcademicYears(a: string, b: string): number {
  const startA = Number.parseInt(a.split("/")[0] ?? "", 10) || 0;
  const startB = Number.parseInt(b.split("/")[0] ?? "", 10) || 0;

  if (startA !== startB) {
    return startA - startB;
  }

  return a.localeCompare(b);
}

export function getLatestAcademicYear(years: string[]): string {
  if (!years.length) {
    return "";
  }

  return [...years].sort(compareAcademicYears).at(-1) ?? "";
}

/** Prefer the newest configured academic year; fall back to the stored default. */
export function resolveDefaultAcademicYear(
  years: string[],
  configuredDefault?: string,
): string {
  const latest = getLatestAcademicYear(years);
  if (latest) {
    return latest;
  }

  return configuredDefault?.trim() || "";
}
