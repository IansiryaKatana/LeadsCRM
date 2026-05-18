import { format } from "date-fns";
import { Clock, MapPin, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  canCompleteEvent,
  canMarkNoShow,
} from "@/components/calendar/calendarEventUtils";
import type { OutcomeAction } from "@/components/calendar/CalendarEventOutcomeForm";

interface CalendarEventCardProps {
  event: CalendarEvent;
  onAction: (event: CalendarEvent, action: OutcomeAction) => void;
  onViewLead?: (leadId: string) => void;
  compact?: boolean;
}

export function CalendarEventCard({
  event,
  onAction,
  onViewLead,
  compact = false,
}: CalendarEventCardProps) {
  const statusConfig =
    CALENDAR_EVENT_STATUS_CONFIG[event.status] ?? CALENDAR_EVENT_STATUS_CONFIG.scheduled;
  const isScheduled = event.status === "scheduled";
  const lead = event.leads;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isScheduled ? "bg-card" : "bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", getEventColor(event.event_type))}>
          {getEventIcon(event.event_type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className={cn("font-medium truncate", !isScheduled && "text-muted-foreground")}>
              {event.title}
            </p>
            <Badge variant="outline" className={cn("text-xs shrink-0", getEventColor(event.event_type))}>
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

      {lead && !compact && (
        <div className="flex flex-wrap gap-2 pl-11">
          {onViewLead && (
            <Button variant="outline" size="sm" onClick={() => onViewLead(lead.id)}>
              View lead
            </Button>
          )}
          {lead.phone && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-3 w-3 mr-1" />
                Call
              </a>
            </Button>
          )}
          {lead.email && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="h-3 w-3 mr-1" />
                Email
              </a>
            </Button>
          )}
        </div>
      )}

      {isScheduled && (
        <div className="flex flex-wrap gap-2 pl-11 pt-1">
          {canCompleteEvent(event) && (
            <Button size="sm" onClick={() => onAction(event, "complete")}>
              Mark completed
            </Button>
          )}
          {canMarkNoShow(event) && (
            <Button size="sm" variant="outline" onClick={() => onAction(event, "no_show")}>
              No show
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onAction(event, "reschedule")}>
            Reschedule
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction(event, "cancel")}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
