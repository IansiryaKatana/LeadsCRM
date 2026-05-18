import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCalendarEvents, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { useLead } from "@/hooks/useLeads";
import { DayEventsSheet } from "@/components/calendar/DayEventsSheet";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import {
  CalendarEventOutcomeForm,
  type OutcomeAction,
} from "@/components/calendar/CalendarEventOutcomeForm";
import {
  getEventIcon,
  getChipClassName,
  eventNeedsOutcome,
} from "@/components/calendar/calendarEventUtils";
import type { Lead } from "@/types/crm";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [listOutcomeEvent, setListOutcomeEvent] = useState<CalendarEvent | null>(null);
  const [listOutcomeAction, setListOutcomeAction] = useState<OutcomeAction | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const queryStart = new Date(monthStart);
  queryStart.setDate(queryStart.getDate() - 1);
  const queryEnd = new Date(monthEnd);
  queryEnd.setDate(queryEnd.getDate() + 1);
  const { data: events = [], isLoading } = useCalendarEvents(undefined, queryStart, queryEnd);
  const { data: selectedLeadData } = useLead(selectedLeadId || "");

  const getEventsForDate = (date: Date) =>
    events.filter((event) => isSameDay(new Date(event.start_date), date));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setDaySheetOpen(true);
  };

  const handleViewLead = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = monthStart.getDay();
  const daysToPrepend = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const todayEvents = events.filter((event) =>
    isSameDay(new Date(event.start_date), new Date())
  );

  const upcomingEvents = events
    .filter((event) => new Date(event.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 20);

  const daySheetEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Click a date to view events and record outcomes
            </p>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "list")}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>

          <TabsContent value="month" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}

                  {Array.from({ length: daysToPrepend }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const needsAction = dayEvents.some(eventNeedsOutcome);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "aspect-square p-1 border rounded-lg min-w-0 overflow-hidden text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                          isToday && "border-primary bg-primary/5",
                          !isCurrentMonth && "opacity-40",
                          needsAction && "ring-1 ring-warning/40"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium mb-1 flex items-center justify-between gap-1",
                            isToday && "text-primary"
                          )}
                        >
                          <span>{format(day, "d")}</span>
                          {needsAction && (
                            <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0 pointer-events-none">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "flex items-center gap-1 min-w-0 text-xs p-1 rounded border",
                                getChipClassName(event)
                              )}
                              title={event.title}
                            >
                              <span className="shrink-0 [&_svg]:h-3 [&_svg]:w-3">
                                {getEventIcon(event.event_type)}
                              </span>
                              <span className="truncate min-w-0">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6 space-y-4">
            {todayEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Today</h3>
                {todayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onAction={(e, action) => {
                      setListOutcomeEvent(e);
                      setListOutcomeAction(action);
                    }}
                    onViewLead={handleViewLead}
                  />
                ))}
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Upcoming</h3>
                {upcomingEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onAction={(e, action) => {
                      setListOutcomeEvent(e);
                      setListOutcomeAction(action);
                    }}
                    onViewLead={handleViewLead}
                  />
                ))}
              </div>
            )}

            {events.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No events scheduled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule events from the lead detail dialog
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DayEventsSheet
        open={daySheetOpen}
        onOpenChange={setDaySheetOpen}
        date={selectedDate}
        events={daySheetEvents}
        onViewLead={handleViewLead}
      />

      <Sheet
        open={!!listOutcomeEvent && !!listOutcomeAction}
        onOpenChange={(open) => {
          if (!open) {
            setListOutcomeEvent(null);
            setListOutcomeAction(null);
          }
        }}
      >
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-xl p-6 mb-0">
          {listOutcomeEvent && listOutcomeAction && (
            <CalendarEventOutcomeForm
              event={listOutcomeEvent}
              action={listOutcomeAction}
              onBack={() => {
                setListOutcomeEvent(null);
                setListOutcomeAction(null);
              }}
              onSuccess={() => {
                setListOutcomeEvent(null);
                setListOutcomeAction(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {selectedLeadData && (
        <LeadDetailDialog
          lead={selectedLeadData as Lead}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </AppLayout>
  );
}
