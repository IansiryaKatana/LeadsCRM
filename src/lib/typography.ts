/**
 * Typography scale — tuned for desktop at ~75% density (see --app-font-size in index.css).
 * Mobile keeps full 16px root; lg+ uses 12px root so rem-based spacing/type match 75% zoom.
 */

/** Page-level h1 (Dashboard, Leads, Reports, etc.) */
export const pageTitleClass =
  "font-display text-2xl sm:text-3xl font-bold tracking-tight uppercase";

/** Sidebar brand wordmark */
export const sidebarBrandTitleClass =
  "font-display text-2xl sm:text-3xl font-bold tracking-tight uppercase leading-none";

/** Card / panel section titles */
export const sectionTitleClass =
  "font-display text-lg font-bold tracking-tight";

/** Muted helper under page titles */
export const pageSubtitleClass = "text-sm text-muted-foreground mt-1";

/** Stat / KPI large numbers */
export const statValueClass = "text-2xl font-display font-bold tracking-tight tabular-nums";

/** Table & dense UI labels */
export const labelClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
