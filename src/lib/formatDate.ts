import { format } from "date-fns";

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** e.g. "30th Jul" — compact for mobile/tablet table cells */
export function formatCompactLeadDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)} ${format(date, "MMM")}`;
}

/** e.g. "30 Jul 2026" — full date for desktop */
export function formatLeadDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
