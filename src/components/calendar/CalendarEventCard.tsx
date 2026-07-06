import { format } from "date-fns";
import { Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import {
  CALENDAR_EVENT_STATUS_CONFIG,
  getOutcomeLabel,
} from "@/constants/calendarEvents";
import {
  getEventIcon,
  getEventColor,
} from "@/components/calendar/calendarEventUtils";
import { CalendarEventActions } from "@/components/calendar/CalendarEventActions";
import type { OutcomeAction } from "@/components/calendar/CalendarEventOutcomeForm";

interface CalendarEventCardProps {
  event: CalendarEvent;
  onAction: (event: CalendarEvent, action: OutcomeAction) => void;
  onViewLead?: (leadId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  compact?: boolean;
}

export function CalendarEventCard({
  event,
  onAction,
  onViewLead,
  onEdit,
  onDelete,
  compact = false,
}: CalendarEventCardProps) {
  const statusConfig =
    CALENDAR_EVENT_STATUS_CONFIG[event.status] ?? CALENDAR_EVENT_STATUS_CONFIG.scheduled;
  const isScheduled = event.status === "scheduled";
  const lead = event.leads;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isScheduled ? "bg-card" : "bg-muted/30"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn("p-2 rounded-lg shrink-0", getEventColor(event.event_type))}>
            {getEventIcon(event.event_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className={cn("font-medium truncate", !isScheduled && "text-muted-foreground")}>
                {event.title}
              </p>
              <Badge variant="outline" className={cn("text-xs shrink-0 capitalize", getEventColor(event.event_type))}>
                {event.event_type}
              </Badge>
              <Badge variant="outline" className={cn("text-xs shrink-0", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(event.start_date), "h:mm a")}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              )}
              {lead && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {lead.full_name}
                </span>
              )}
            </div>

            {event.outcome && event.status === "completed" && (
              <p className="text-xs text-muted-foreground mt-1">
                {getOutcomeLabel(event.event_type, event.outcome)}
              </p>
            )}
            {event.outcome_notes && !compact && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.outcome_notes}</p>
            )}
          </div>
        </div>

        {!compact && (
          <div className="shrink-0 sm:pl-2">
            <CalendarEventActions
              event={event}
              onAction={onAction}
              onViewLead={onViewLead}
              onEdit={onEdit}
              onDelete={onDelete}
              variant="row"
            />
          </div>
        )}
      </div>
    </div>
  );
}
