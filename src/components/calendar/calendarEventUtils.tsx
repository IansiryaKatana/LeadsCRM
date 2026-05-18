import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { isBefore, isSameDay, startOfDay } from "date-fns";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import type { CalendarEventStatus } from "@/constants/calendarEvents";
import { cn } from "@/lib/utils";

export function getEventIcon(type: string) {
  switch (type) {
    case "viewing":
      return <CalendarIcon className="h-4 w-4" />;
    case "callback":
      return <Clock className="h-4 w-4" />;
    case "followup":
      return <Phone className="h-4 w-4" />;
    case "task":
      return <CheckSquare className="h-4 w-4" />;
    default:
      return <CalendarIcon className="h-4 w-4" />;
  }
}

export function getEventColor(type: string) {
  switch (type) {
    case "viewing":
      return "bg-success/10 text-success border-success/20";
    case "callback":
      return "bg-warning/10 text-warning border-warning/20";
    case "followup":
      return "bg-primary/10 text-primary border-primary/20";
    case "task":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getStatusIcon(status: CalendarEventStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-3 w-3" />;
    case "no_show":
      return <XCircle className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
}

export function eventNeedsOutcome(event: CalendarEvent): boolean {
  if (event.status !== "scheduled") return false;
  const eventDay = startOfDay(new Date(event.start_date));
  const today = startOfDay(new Date());
  return isBefore(eventDay, today) || isSameDay(eventDay, today);
}

export function canCompleteEvent(event: CalendarEvent): boolean {
  return event.status === "scheduled" && eventNeedsOutcome(event);
}

export function canMarkNoShow(event: CalendarEvent): boolean {
  return (
    event.status === "scheduled" &&
    event.event_type === "viewing" &&
    eventNeedsOutcome(event)
  );
}

export function groupDayEvents(events: CalendarEvent[]) {
  const pending: CalendarEvent[] = [];
  const needsOutcome: CalendarEvent[] = [];
  const closed: CalendarEvent[] = [];

  for (const event of events) {
    if (event.status === "scheduled") {
      if (eventNeedsOutcome(event)) {
        needsOutcome.push(event);
      } else {
        pending.push(event);
      }
    } else {
      closed.push(event);
    }
  }

  const byTime = (a: CalendarEvent, b: CalendarEvent) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime();

  return {
    pending: pending.sort(byTime),
    needsOutcome: needsOutcome.sort(byTime),
    closed: closed.sort(byTime),
  };
}

export function getChipClassName(event: CalendarEvent) {
  if (event.status === "completed") {
    return cn(getEventColor(event.event_type), "opacity-75 line-through");
  }
  if (event.status === "no_show") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  if (event.status === "cancelled") {
    return "bg-muted/60 text-muted-foreground border-border opacity-60";
  }
  if (eventNeedsOutcome(event)) {
    return cn(getEventColor(event.event_type), "ring-1 ring-warning/50");
  }
  return getEventColor(event.event_type);
}
