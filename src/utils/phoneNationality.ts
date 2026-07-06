/**
 * Infer nationality / country from a lead phone number using international dialling codes.
 * UK domestic numbers (07…, 01…, 02…) are treated as United Kingdom.
 */

const CALLING_CODE_TO_COUNTRY: Array<[string, string]> = [
  ["880", "Bangladesh"],
  ["886", "Taiwan"],
  ["971", "United Arab Emirates"],
  ["966", "Saudi Arabia"],
  ["974", "Qatar"],
  ["973", "Bahrain"],
  ["968", "Oman"],
  ["965", "Kuwait"],
  ["962", "Jordan"],
  ["961", "Lebanon"],
  ["972", "Israel"],
  ["234", "Nigeria"],
  ["233", "Ghana"],
  ["254", "Kenya"],
  ["255", "Tanzania"],
  ["256", "Uganda"],
  ["260", "Zambia"],
  ["263", "Zimbabwe"],
  ["251", "Ethiopia"],
  ["212", "Morocco"],
  ["213", "Algeria"],
  ["216", "Tunisia"],
  ["218", "Libya"],
  ["20", "Egypt"],
  ["27", "South Africa"],
  ["351", "Portugal"],
  ["353", "Ireland"],
  ["358", "Finland"],
  ["380", "Ukraine"],
  ["420", "Czech Republic"],
  ["852", "Hong Kong"],
  ["977", "Nepal"],
  ["91", "India"],
  ["92", "Pakistan"],
  ["93", "Afghanistan"],
  ["94", "Sri Lanka"],
  ["95", "Myanmar"],
  ["98", "Iran"],
  ["90", "Turkey"],
  ["86", "China"],
  ["84", "Vietnam"],
  ["82", "South Korea"],
  ["81", "Japan"],
  ["66", "Thailand"],
  ["65", "Singapore"],
  ["64", "New Zealand"],
  ["63", "Philippines"],
  ["62", "Indonesia"],
  ["61", "Australia"],
  ["60", "Malaysia"],
  ["55", "Brazil"],
  ["52", "Mexico"],
  ["49", "Germany"],
  ["48", "Poland"],
  ["47", "Norway"],
  ["46", "Sweden"],
  ["45", "Denmark"],
  ["44", "United Kingdom"],
  ["43", "Austria"],
  ["41", "Switzerland"],
  ["40", "Romania"],
  ["39", "Italy"],
  ["36", "Hungary"],
  ["34", "Spain"],
  ["33", "France"],
  ["32", "Belgium"],
  ["31", "Netherlands"],
  ["30", "Greece"],
  ["7", "Russia"],
  ["1", "United States / Canada"],
];

const SORTED_CALLING_CODES = [...CALLING_CODE_TO_COUNTRY].sort(
  (a, b) => b[0].length - a[0].length,
);

export const UNKNOWN_NATIONALITY = "Unknown";

export function normalizePhoneNumber(phone: string | null | undefined): string {
  return String(phone ?? "").replace(/[^\d+]/g, "");
}

export function inferNationalityFromPhone(phone: string | null | undefined): string {
  let normalized = normalizePhoneNumber(phone);
  if (!normalized) return UNKNOWN_NATIONALITY;

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (normalized.startsWith("+")) {
    const digits = normalized.slice(1);
    for (const [code, country] of SORTED_CALLING_CODES) {
      if (digits.startsWith(code)) {
        return country;
      }
    }
    return UNKNOWN_NATIONALITY;
  }

  // UK domestic format: 07…, 01…, 02…, 03…
  if (/^0[1-9]\d{8,10}$/.test(normalized)) {
    return "United Kingdom";
  }

  // Sometimes stored as 44… without a leading +
  if (normalized.startsWith("44") && normalized.length >= 11) {
    return "United Kingdom";
  }

  return UNKNOWN_NATIONALITY;
}

export function buildNationalityDistribution(
  leads: Array<{ phone?: string | null }>,
): Record<string, number> {
  const counts: Record<string, number> = {};

  leads.forEach((lead) => {
    const nationality = inferNationalityFromPhone(lead.phone);
    counts[nationality] = (counts[nationality] || 0) + 1;
  });

  return counts;
}

export function nationalityCountsToChartData(
  counts: Record<string, number>,
): Array<{ name: string; value: number }> {
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}
