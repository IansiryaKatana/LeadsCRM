/** Recharts + export styling aligned with Urban Hub brand tokens */
export const CHART_FONT = "'Inter Tight', sans-serif";
export const CHART_DISPLAY_FONT = "'Big Shoulders Display', sans-serif";

export const CHART_COLORS = {
  primary: "hsl(211, 100%, 66%)",
  primaryMuted: "hsl(211, 80%, 85%)",
  success: "hsl(166, 58%, 47%)",
  successMuted: "hsl(166, 45%, 72%)",
  accent: "hsl(47, 100%, 50%)",
  destructive: "hsl(0, 100%, 47%)",
  muted: "hsl(0, 0%, 88%)",
  mutedForeground: "hsl(0, 0%, 40%)",
  grid: "hsl(210, 20%, 92%)",
  tooltipBg: "hsl(0, 0%, 100%)",
  tooltipBorder: "hsl(210, 20%, 90%)",
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  "hsl(188, 80%, 35%)",
  CHART_COLORS.success,
  CHART_COLORS.accent,
  CHART_COLORS.destructive,
  "hsl(280, 70%, 50%)",
  "hsl(199, 89%, 58%)",
];

export const chartTickStyle = {
  fill: CHART_COLORS.mutedForeground,
  fontSize: 11,
  fontFamily: CHART_FONT,
};

export const chartTooltipStyle = {
  backgroundColor: CHART_COLORS.tooltipBg,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  fontFamily: CHART_FONT,
  fontSize: 12,
};
