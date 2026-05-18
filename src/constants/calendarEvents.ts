import type { CalendarEvent } from "@/hooks/useCalendarEvents";

export type CalendarEventStatus =
  | "scheduled"
  | "completed"
  | "no_show"
  | "cancelled"
  | "rescheduled";

export const CALENDAR_EVENT_STATUS_CONFIG: Record<
  CalendarEventStatus,
  { label: string; className: string }
> = {
  scheduled: { label: "Scheduled", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/20" },
  no_show: { label: "No show", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
  rescheduled: { label: "Rescheduled", className: "bg-warning/10 text-warning border-warning/20" },
};

export const VIEWING_OUTCOMES = [
  { value: "interested", label: "Attended – interested" },
  { value: "not_interested", label: "Attended – not interested" },
  { value: "wants_to_apply", label: "Wants to apply / proceed" },
  { value: "other", label: "Other" },
] as const;

export const CALLBACK_OUTCOMES = [
  { value: "contacted", label: "Contacted successfully" },
  { value: "no_answer", label: "No answer" },
  { value: "voicemail", label: "Voicemail left" },
  { value: "callback_requested", label: "Callback requested" },
  { value: "not_interested", label: "Not interested" },
] as const;

export const TASK_OUTCOMES = [{ value: "done", label: "Done" }] as const;

export function getOutcomesForEventType(eventType: CalendarEvent["event_type"]) {
  switch (eventType) {
    case "viewing":
      return VIEWING_OUTCOMES;
    case "callback":
    case "followup":
      return CALLBACK_OUTCOMES;
    case "task":
      return TASK_OUTCOMES;
    default:
      return CALLBACK_OUTCOMES;
  }
}

export function getOutcomeLabel(
  eventType: CalendarEvent["event_type"],
  outcome: string | null | undefined
): string {
  if (!outcome) return "";
  const options = getOutcomesForEventType(eventType);
  return options.find((o) => o.value === outcome)?.label ?? outcome;
}

export function formatEventNote(
  event: Pick<CalendarEvent, "event_type" | "title" | "status" | "outcome">,
  outcomeNotes?: string | null
): string {
  const typeLabel =
    event.event_type === "viewing"
      ? "Viewing"
      : event.event_type === "callback"
        ? "Callback"
        : event.event_type === "followup"
          ? "Follow-up"
          : "Task";

  let line = `[Calendar] ${typeLabel}`;
  if (event.status === "no_show") {
    line += " – No show";
  } else if (event.status === "cancelled") {
    line += " – Cancelled";
  } else if (event.status === "completed" && event.outcome) {
    line += ` – ${getOutcomeLabel(event.event_type, event.outcome)}`;
  } else if (event.status === "completed") {
    line += " – Completed";
  } else {
    line += ` – ${event.title}`;
  }

  if (outcomeNotes?.trim()) {
    line += `. Notes: ${outcomeNotes.trim()}`;
  }
  return line;
}
