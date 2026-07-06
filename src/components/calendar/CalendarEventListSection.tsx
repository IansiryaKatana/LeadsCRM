import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { subsectionTitleClass } from "@/lib/typography";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { CalendarEventRow } from "@/components/calendar/CalendarEventRow";
import type { OutcomeAction } from "@/components/calendar/CalendarEventOutcomeForm";

interface CalendarEventListSectionProps {
  title: string;
  events: CalendarEvent[];
  onAction: (event: CalendarEvent, action: OutcomeAction) => void;
  onViewLead?: (leadId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  showLeadColumn?: boolean;
}

export function CalendarEventListSection({
  title,
  events,
  onAction,
  onViewLead,
  onEdit,
  onDelete,
  showLeadColumn = true,
}: CalendarEventListSectionProps) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className={subsectionTitleClass}>{title}</h3>

      <TooltipProvider delayDuration={300}>
        <div className="hidden lg:block rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="w-12 pl-4" />
                <TableHead className="w-24">Time</TableHead>
                <TableHead>Event</TableHead>
                {showLeadColumn && <TableHead className="w-44">Lead</TableHead>}
                <TableHead className={showLeadColumn ? "w-36" : "w-44"}>Location</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-56 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <CalendarEventRow
                  key={event.id}
                  event={event}
                  onAction={onAction}
                  onViewLead={onViewLead}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  showLeadColumn={showLeadColumn}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden space-y-3">
          {events.map((event) => (
            <CalendarEventCard
              key={event.id}
              event={event}
              onAction={onAction}
              onViewLead={onViewLead}
            />
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
