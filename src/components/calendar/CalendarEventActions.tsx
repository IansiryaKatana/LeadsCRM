import { Phone, Mail, MoreHorizontal, CheckCircle, UserX, CalendarClock, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { canCompleteEvent, canMarkNoShow } from "@/components/calendar/calendarEventUtils";
import type { OutcomeAction } from "@/components/calendar/CalendarEventOutcomeForm";

interface CalendarEventActionsProps {
  event: CalendarEvent;
  onAction: (event: CalendarEvent, action: OutcomeAction) => void;
  onViewLead?: (leadId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  variant?: "card" | "row";
}

export function CalendarEventActions({
  event,
  onAction,
  onViewLead,
  onEdit,
  onDelete,
  variant = "card",
}: CalendarEventActionsProps) {
  const lead = event.leads;
  const isScheduled = event.status === "scheduled";
  const isRow = variant === "row";

  const menuItems = (
    <>
      {isScheduled && canCompleteEvent(event) && (
        <DropdownMenuItem onClick={() => onAction(event, "complete")}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark completed
        </DropdownMenuItem>
      )}
      {isScheduled && canMarkNoShow(event) && (
        <DropdownMenuItem onClick={() => onAction(event, "no_show")}>
          <UserX className="h-4 w-4 mr-2" />
          No show
        </DropdownMenuItem>
      )}
      {isScheduled && (
        <>
          {(canCompleteEvent(event) || canMarkNoShow(event)) && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => onAction(event, "reschedule")}>
            <CalendarClock className="h-4 w-4 mr-2" />
            Reschedule
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction(event, "cancel")}
            className="text-destructive focus:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </DropdownMenuItem>
        </>
      )}
    </>
  );

  if (isRow) {
    return (
      <div className="flex items-center justify-end gap-1">
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(event)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(event)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
        {lead && onViewLead && (
          <Button variant="outline" size="sm" className="h-8" onClick={() => onViewLead(lead.id)}>
            View lead
          </Button>
        )}
        {lead?.phone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Call</TooltipContent>
          </Tooltip>
        )}
        {lead?.email && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`mailto:${lead.email}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Email</TooltipContent>
          </Tooltip>
        )}
        {isScheduled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">{menuItems}</DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <>
      {lead && (
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
    </>
  );
}
