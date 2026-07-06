export type PanelSize = "default" | "wide" | "narrow";

/** Default panel: lg sheet + 80px (592px). */
export const PANEL_WIDTH_CLASSES: Record<PanelSize, string> = {
  default: "sm:max-w-[calc(32rem+80px)]",
  wide: "sm:max-w-[calc(42rem+80px)]",
  narrow: "sm:max-w-md",
};
