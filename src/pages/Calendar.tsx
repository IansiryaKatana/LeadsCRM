import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Clock, Phone, CheckSquare, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Extend date range slightly to catch events at month boundaries
  const queryStart = new Date(monthStart);
  queryStart.setDate(queryStart.getDate() - 1);
  const queryEnd = new Date(monthEnd);
  queryEnd.setDate(queryEnd.getDate() + 1);
  const { data: events = [], isLoading } = useCalendarEvents(undefined, queryStart, queryEnd);

  const getEventIcon = (type: string) => {
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
  };

  const getEventColor = (type: string) => {
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
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return isSameDay(eventDate, date);
    });
  };

  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Get first day of week for the month start
  const firstDayOfWeek = monthStart.getDay();
  const daysToPrepend = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start_date);
    return isSameDay(eventDate, new Date());
  });

  const upcomingEvents = events
    .filter(event => new Date(event.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 10);

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
              View and manage your scheduled events
            </p>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
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
                    <h2 className="text-xl font-semibold">
                      {format(currentDate, "MMMM yyyy")}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Day Headers */}
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {/* Empty cells for days before month start */}
                  {Array.from({ length: daysToPrepend }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Calendar Days */}
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDate(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "aspect-square p-1 border rounded-lg",
                          isToday && "border-primary bg-primary/5",
                          !isCurrentMonth && "opacity-40"
                        )}
                      >
                        <div className={cn(
                          "text-sm font-medium mb-1",
                          isToday && "text-primary"
                        )}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1 rounded truncate cursor-pointer",
                                getEventColor(event.event_type)
                              )}
                              title={event.title}
                            >
                              {getEventIcon(event.event_type)}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6 space-y-4">
            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Today</h3>
                {todayEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", getEventColor(event.event_type))}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{event.title}</p>
                          <Badge variant="outline" className={getEventColor(event.event_type)}>
                            {event.event_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(event.start_date), "h:mm a")}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        {event.lead_id && (
                          <Link
                            to={`/leads/${event.lead_id}`}
                            className="text-sm text-primary hover:underline mt-1 inline-block"
                          >
                            View Lead →
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Upcoming</h3>
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", getEventColor(event.event_type))}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{event.title}</p>
                          <Badge variant="outline" className={getEventColor(event.event_type)}>
                            {event.event_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(new Date(event.start_date), "MMM d, yyyy 'at' h:mm a")}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        {event.lead_id && (
                          <Link
                            to={`/leads/${event.lead_id}`}
                            className="text-sm text-primary hover:underline mt-1 inline-block"
                          >
                            View Lead →
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
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
                <div className="mt-4 p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
                  <p className="text-sm font-medium mb-2">💡 Tip:</p>
                  <p className="text-xs text-muted-foreground">
                    If you have leads with viewing bookings, open the lead detail dialog and go to the "Calendar" tab to schedule the viewing event.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
