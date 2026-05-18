import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { groupDayEvents } from "@/components/calendar/calendarEventUtils";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import {
  CalendarEventOutcomeForm,
  type OutcomeAction,
} from "@/components/calendar/CalendarEventOutcomeForm";

interface DayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  events: CalendarEvent[];
  onViewLead?: (leadId: string) => void;
}

function EventSection({
  title,
  events,
  variant,
  onAction,
  onViewLead,
}: {
  title: string;
  events: CalendarEvent[];
  variant?: "warning";
  onAction: (event: CalendarEvent, action: OutcomeAction) => void;
  onViewLead?: (leadId: string) => void;
}) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        {variant === "warning" && (
          <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
            Action needed
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            onAction={onAction}
            onViewLead={onViewLead}
          />
        ))}
      </div>
    </div>
  );
}

export function DayEventsSheet({
  open,
  onOpenChange,
  date,
  events,
  onViewLead,
}: DayEventsSheetProps) {
  const isMobile = useIsMobile();
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [activeAction, setActiveAction] = useState<OutcomeAction | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setActiveEvent(null);
      setActiveAction(null);
    }
    onOpenChange(next);
  };

  const handleAction = (event: CalendarEvent, action: OutcomeAction) => {
    setActiveEvent(event);
    setActiveAction(action);
  };

  const handleOutcomeSuccess = () => {
    setActiveEvent(null);
    setActiveAction(null);
  };

  const grouped = groupDayEvents(events);
  const showOutcome = activeEvent && activeAction;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[85vh] rounded-t-xl p-0 flex flex-col mb-0"
            : "w-full sm:max-w-md p-0 flex flex-col"
        }
      >
        {showOutcome ? (
          <div className="flex flex-col h-full p-6">
            <CalendarEventOutcomeForm
              event={activeEvent}
              action={activeAction}
              onBack={() => {
                setActiveEvent(null);
                setActiveAction(null);
              }}
              onSuccess={handleOutcomeSuccess}
            />
          </div>
        ) : (
          <>
            <SheetHeader className="p-6 pb-4 border-b shrink-0">
              <SheetTitle className="font-display text-left">
                {date ? format(date, "EEEE, d MMMM yyyy") : "Events"}
              </SheetTitle>
              <SheetDescription className="text-left">
                {events.length === 0
                  ? "No events on this day"
                  : `${events.length} event${events.length !== 1 ? "s" : ""}`}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6 py-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nothing scheduled</p>
                </div>
              ) : (
                <div className="space-y-6 pb-6">
                  <EventSection
                    title="Needs outcome"
                    events={grouped.needsOutcome}
                    variant="warning"
                    onAction={handleAction}
                    onViewLead={onViewLead}
                  />
                  <EventSection
                    title="Upcoming"
                    events={grouped.pending}
                    onAction={handleAction}
                    onViewLead={onViewLead}
                  />
                  <EventSection
                    title="Completed / closed"
                    events={grouped.closed}
                    onAction={handleAction}
                    onViewLead={onViewLead}
                  />
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
