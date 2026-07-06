import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
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

interface CalendarEventRowProps {
  event: CalendarEvent;
  onAction: (event: CalendarEvent, action: OutcomeAction) => void;
  onViewLead?: (leadId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  showLeadColumn?: boolean;
}

export function CalendarEventRow({
  event,
  onAction,
  onViewLead,
  onEdit,
  onDelete,
  showLeadColumn = true,
}: CalendarEventRowProps) {
  const statusConfig =
    CALENDAR_EVENT_STATUS_CONFIG[event.status] ?? CALENDAR_EVENT_STATUS_CONFIG.scheduled;
  const isScheduled = event.status === "scheduled";
  const lead = event.leads;

  return (
    <TableRow
      className={cn(
        "group",
        !isScheduled && "text-muted-foreground"
      )}
    >
      <TableCell className="w-12 py-3 pl-4 pr-0">
        <div className={cn("p-1.5 rounded-md w-fit", getEventColor(event.event_type))}>
          <span className="[&_svg]:h-4 [&_svg]:w-4">{getEventIcon(event.event_type)}</span>
        </div>
      </TableCell>

      <TableCell className="w-24 py-3 whitespace-nowrap">
        <span className={cn("font-medium tabular-nums", isScheduled && "text-foreground")}>
          {format(new Date(event.start_date), "h:mm a")}
        </span>
      </TableCell>

      <TableCell className="py-3 min-w-[200px]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className={cn("font-medium truncate", !isScheduled && "text-muted-foreground")}>
              {event.title}
            </p>
            <Badge
              variant="outline"
              className={cn("text-xs shrink-0 capitalize", getEventColor(event.event_type))}
            >
              {event.event_type}
            </Badge>
          </div>
          {event.outcome && event.status === "completed" && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {getOutcomeLabel(event.event_type, event.outcome)}
            </p>
          )}
          {event.outcome_notes && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.outcome_notes}</p>
          )}
        </div>
      </TableCell>

      {showLeadColumn && (
        <TableCell className="w-44 py-3">
          {lead ? (
            onViewLead ? (
              <button
                type="button"
                onClick={() => onViewLead(lead.id)}
                className="text-sm truncate block max-w-full hover:text-primary hover:underline text-left"
              >
                {lead.full_name}
              </button>
            ) : (
              <span className="text-sm truncate block">{lead.full_name}</span>
            )
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      <TableCell className={cn("py-3", showLeadColumn ? "w-36" : "w-44")}>
        {event.location ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="w-32 py-3">
        <Badge variant="outline" className={cn("text-xs whitespace-nowrap", statusConfig.className)}>
          {statusConfig.label}
        </Badge>
      </TableCell>

      <TableCell className="w-52 py-3 pr-4">
        <CalendarEventActions
          event={event}
          onAction={onAction}
          onViewLead={onViewLead}
          onEdit={onEdit}
          onDelete={onDelete}
          variant="row"
        />
      </TableCell>
    </TableRow>
  );
}
