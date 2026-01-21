import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Calendar, MapPin, Clock, Trash2, Edit, Loader2, Phone, CheckSquare } from "lucide-react";
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CalendarTabProps {
  leadId: string;
  leadName: string;
}

export function CalendarTab({ leadId, leadName }: CalendarTabProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    event_type: "viewing" as "viewing" | "callback" | "followup" | "task",
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    location: "",
  });

  const { data: events = [], isLoading } = useCalendarEvents(leadId);
  const { user } = useAuth();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date()).sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const pastEvents = events.filter(e => new Date(e.start_date) < new Date()).sort((a, b) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case "viewing":
        return <Calendar className="h-4 w-4" />;
      case "callback":
        return <Clock className="h-4 w-4" />;
      case "followup":
        return <Phone className="h-4 w-4" />;
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
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

  const handleCreate = () => {
    const startDateTime = newEvent.start_date && newEvent.start_time
      ? `${newEvent.start_date}T${newEvent.start_time}:00`
      : newEvent.start_date
      ? `${newEvent.start_date}T12:00:00`
      : new Date().toISOString();

    const endDateTime = newEvent.end_date && newEvent.end_time
      ? `${newEvent.end_date}T${newEvent.end_time}:00`
      : newEvent.end_date
      ? `${newEvent.end_date}T13:00:00`
      : null;

    createEvent.mutate({
      lead_id: leadId,
      ...newEvent,
      start_date: startDateTime,
      end_date: endDateTime,
      location: newEvent.location || null,
      description: newEvent.description || null,
    }, {
      onSuccess: () => {
        setNewEvent({
          event_type: "viewing",
          title: "",
          description: "",
          start_date: "",
          start_time: "",
          end_date: "",
          end_time: "",
          location: "",
        });
        setCreateDialogOpen(false);
      },
    });
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : null;
    setNewEvent({
      event_type: event.event_type,
      title: event.title,
      description: event.description || "",
      start_date: format(startDate, "yyyy-MM-dd"),
      start_time: format(startDate, "HH:mm"),
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : "",
      end_time: endDate ? format(endDate, "HH:mm") : "",
      location: event.location || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedEvent) return;
    const startDateTime = newEvent.start_date && newEvent.start_time
      ? `${newEvent.start_date}T${newEvent.start_time}:00`
      : newEvent.start_date
      ? `${newEvent.start_date}T12:00:00`
      : new Date().toISOString();

    const endDateTime = newEvent.end_date && newEvent.end_time
      ? `${newEvent.end_date}T${newEvent.end_time}:00`
      : newEvent.end_date
      ? `${newEvent.end_date}T13:00:00`
      : null;

    updateEvent.mutate({
      id: selectedEvent.id,
      ...newEvent,
      start_date: startDateTime,
      end_date: endDateTime,
      location: newEvent.location || null,
      description: newEvent.description || null,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedEvent(null);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    deleteEvent.mutate(selectedEvent.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedEvent(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Calendar Events</h3>
          <p className="text-sm text-muted-foreground">
            {upcomingEvents.length} upcoming, {pastEvents.length} past
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Event
        </Button>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Upcoming Events</h4>
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn("p-2 rounded-lg", getEventColor(event.event_type))}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{event.title}</p>
                      <Badge variant="outline" className={getEventColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      setSelectedEvent(event);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Past Events</h4>
          {pastEvents.map((event) => (
            <Card key={event.id} className="p-4 opacity-60">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", getEventColor(event.event_type))}>
                  {getEventIcon(event.event_type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.start_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No events scheduled</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule a viewing or callback to get started</p>
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Event Type *</Label>
              <RadioGroup
                value={newEvent.event_type}
                onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value as any })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="viewing" id="type-viewing" />
                  <Label htmlFor="type-viewing" className="font-normal cursor-pointer">Viewing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="callback" id="type-callback" />
                  <Label htmlFor="type-callback" className="font-normal cursor-pointer">Callback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="followup" id="type-followup" />
                  <Label htmlFor="type-followup" className="font-normal cursor-pointer">Follow-up</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="task" id="type-task" />
                  <Label htmlFor="type-task" className="font-normal cursor-pointer">Task</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder={`${newEvent.event_type === "viewing" ? "Property viewing" : newEvent.event_type === "callback" ? "Callback" : "Event"} for ${leadName}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add event details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
            </div>
            {newEvent.event_type === "viewing" && (
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Property address or location"
                />
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newEvent.title.trim() || !newEvent.start_date || createEvent.isPending}
                className="flex-1"
              >
                {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Event Type *</Label>
              <RadioGroup
                value={newEvent.event_type}
                onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value as any })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="viewing" id="edit-type-viewing" />
                  <Label htmlFor="edit-type-viewing" className="font-normal cursor-pointer">Viewing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="callback" id="edit-type-callback" />
                  <Label htmlFor="edit-type-callback" className="font-normal cursor-pointer">Callback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="followup" id="edit-type-followup" />
                  <Label htmlFor="edit-type-followup" className="font-normal cursor-pointer">Follow-up</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="task" id="edit-type-task" />
                  <Label htmlFor="edit-type-task" className="font-normal cursor-pointer">Task</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                />
              </div>
            </div>
            {newEvent.event_type === "viewing" && (
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                />
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!newEvent.title.trim() || !newEvent.start_date || updateEvent.isPending}
                className="flex-1"
              >
                {updateEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
