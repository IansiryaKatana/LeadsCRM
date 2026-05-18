export type ReportDateRangeKey = "7d" | "30d" | "90d" | "year" | "all";

export interface ReportDateBounds {
  startDate: Date | null;
  endDate: Date;
  label: string;
}

export function getReportDateBounds(range: ReportDateRangeKey): ReportDateBounds {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  switch (range) {
    case "7d": {
      const startDate = startOfDay(new Date());
      startDate.setDate(startDate.getDate() - 6);
      return { startDate, endDate, label: "Last 7 days" };
    }
    case "30d": {
      const startDate = startOfDay(new Date());
      startDate.setDate(startDate.getDate() - 29);
      return { startDate, endDate, label: "Last 30 days" };
    }
    case "90d": {
      const startDate = startOfDay(new Date());
      startDate.setDate(startDate.getDate() - 89);
      return { startDate, endDate, label: "Last 90 days" };
    }
    case "year": {
      const startDate = startOfDay(new Date(endDate.getFullYear(), 0, 1));
      return { startDate, endDate, label: "This year" };
    }
    case "all":
    default:
      return { startDate: null, endDate, label: "All time" };
  }
}

export function isWithinReportRange(
  isoDate: string,
  bounds: ReportDateBounds
): boolean {
  if (!bounds.startDate) return true;
  const t = new Date(isoDate).getTime();
  return t >= bounds.startDate.getTime() && t <= bounds.endDate.getTime();
}
