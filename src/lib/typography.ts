/**
 * Typography scale — tuned for desktop at ~75% density (see --app-font-size in index.css).
 * Mobile keeps full 16px root; lg+ uses 12px root so rem-based spacing/type match 75% zoom.
 */

/** Page-level h1 (Dashboard, Leads, Reports, etc.) — also used for section & card titles app-wide */
export const pageTitleClass =
  "font-display text-2xl sm:text-3xl font-bold tracking-tight uppercase";

/** In-card section headings — display style ~8px below pageTitleClass */
export const detailSectionTitleClass =
  "font-display text-base sm:text-xl font-bold tracking-tight uppercase";

/** Sidebar brand wordmark */
export const sidebarBrandTitleClass =
  "font-display text-2xl sm:text-3xl font-bold tracking-tight uppercase leading-none";

/** @deprecated Use pageTitleClass */
export const sectionTitleClass = pageTitleClass;

/** @deprecated Use pageTitleClass */
export const subsectionTitleClass = pageTitleClass;

/** @deprecated Use pageTitleClass */
export const settingsSectionTitleClass = pageTitleClass;

/** Muted helper under page titles */
export const pageSubtitleClass = "text-sm text-muted-foreground mt-1";

/** Stat / KPI large numbers — same scale as page titles */
export const statValueClass =
  "font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums";

/** Table & dense UI labels */
export const labelClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground";
