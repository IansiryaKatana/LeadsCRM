import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsivePanel,
  ResponsivePanelBody,
  ResponsivePanelFooter,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
} from "@/components/ui/responsive-panel";
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
import { Plus, Calendar, Loader2 } from "lucide-react";
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent, type CalendarEvent } from "@/hooks/useCalendarEvents";
import { CalendarEventListSection } from "@/components/calendar/CalendarEventListSection";
import { CalendarEventOutcomeForm, type OutcomeAction } from "@/components/calendar/CalendarEventOutcomeForm";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { subsectionTitleClass } from "@/lib/typography";
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
  const [outcomeEvent, setOutcomeEvent] = useState<CalendarEvent | null>(null);
  const [outcomeAction, setOutcomeAction] = useState<OutcomeAction | null>(null);
  const [newEvent, setNewEvent] = useState({
    event_type: "viewing" as "viewing" | "callback" | "followup" | "task",
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_time: "",
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

  const handleCreate = () => {
    if (!newEvent.start_date) {
      return; // Validation: start_date is required
    }

    const startDateTime = newEvent.start_date && newEvent.start_time
      ? `${newEvent.start_date}T${newEvent.start_time}:00`
      : `${newEvent.start_date}T12:00:00`;

    // Calculate end_date from start_date and end_time (same day)
    let endDateTime: string | null = null;
    if (newEvent.end_time) {
      endDateTime = `${newEvent.start_date}T${newEvent.end_time}:00`;
    } else if (newEvent.start_time) {
      // Default to 1 hour after start if no end_time specified
      const startHour = parseInt(newEvent.start_time.split(':')[0]) || 12;
      const endHour = (startHour + 1) % 24;
      endDateTime = `${newEvent.start_date}T${endHour.toString().padStart(2, '0')}:00:00`;
    }

    createEvent.mutate({
      lead_id: leadId,
      event_type: newEvent.event_type,
      title: newEvent.title,
      description: newEvent.description || null,
      start_date: startDateTime,
      end_date: endDateTime,
      location: "Urban Hub", // Fixed location
    }, {
      onSuccess: () => {
        setNewEvent({
          event_type: "viewing",
          title: "",
          description: "",
          start_date: "",
          start_time: "",
          end_time: "",
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
      end_time: endDate ? format(endDate, "HH:mm") : "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedEvent || !newEvent.start_date) return;

    const startDateTime = newEvent.start_date && newEvent.start_time
      ? `${newEvent.start_date}T${newEvent.start_time}:00`
      : `${newEvent.start_date}T12:00:00`;

    // Calculate end_date from start_date and end_time (same day)
    let endDateTime: string | null = null;
    if (newEvent.end_time) {
      endDateTime = `${newEvent.start_date}T${newEvent.end_time}:00`;
    } else if (newEvent.start_time) {
      // Default to 1 hour after start if no end_time specified
      const startHour = parseInt(newEvent.start_time.split(':')[0]) || 12;
      const endHour = (startHour + 1) % 24;
      endDateTime = `${newEvent.start_date}T${endHour.toString().padStart(2, '0')}:00:00`;
    }

    updateEvent.mutate({
      id: selectedEvent.id,
      event_type: newEvent.event_type,
      title: newEvent.title,
      description: newEvent.description || null,
      start_date: startDateTime,
      end_date: endDateTime,
      location: "Urban Hub", // Fixed location
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
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h3 className={subsectionTitleClass}>
            Calendar Events
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {upcomingEvents.length} upcoming, {pastEvents.length} past
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Event
        </Button>
      </div>

      <CalendarEventListSection
        title="Upcoming Events"
        events={upcomingEvents}
        showLeadColumn={false}
        onEdit={handleEdit}
        onDelete={(event) => {
          setSelectedEvent(event);
          setDeleteDialogOpen(true);
        }}
        onAction={(e, action) => {
          setOutcomeEvent(e);
          setOutcomeAction(action);
        }}
      />

      <CalendarEventListSection
        title="Past Events"
        events={pastEvents}
        showLeadColumn={false}
        onAction={(e, action) => {
          setOutcomeEvent(e);
          setOutcomeAction(action);
        }}
      />

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No events scheduled</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule a viewing or callback to get started</p>
        </div>
      )}

      {/* Create Event */}
      <ResponsivePanel open={createDialogOpen} onOpenChange={setCreateDialogOpen} size="wide">
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>Schedule Event</ResponsivePanelTitle>
        </ResponsivePanelHeader>
        <ResponsivePanelBody>
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
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
          </div>
        </ResponsivePanelBody>
        <ResponsivePanelFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!newEvent.title.trim() || !newEvent.start_date || createEvent.isPending}
            className="w-full sm:w-auto"
          >
            {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </ResponsivePanelFooter>
      </ResponsivePanel>

      {/* Edit Event */}
      <ResponsivePanel open={editDialogOpen} onOpenChange={setEditDialogOpen} size="wide">
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>Edit Event</ResponsivePanelTitle>
        </ResponsivePanelHeader>
        <ResponsivePanelBody>
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
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
          </div>
        </ResponsivePanelBody>
        <ResponsivePanelFooter>
          <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!newEvent.title.trim() || !newEvent.start_date || updateEvent.isPending}
            className="w-full sm:w-auto"
          >
            {updateEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Event
          </Button>
        </ResponsivePanelFooter>
      </ResponsivePanel>


      <Sheet
        open={!!outcomeEvent && !!outcomeAction}
        onOpenChange={(open) => {
          if (!open) {
            setOutcomeEvent(null);
            setOutcomeAction(null);
          }
        }}
      >
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-xl p-6 mb-0">
          {outcomeEvent && outcomeAction && (
            <CalendarEventOutcomeForm
              event={outcomeEvent}
              action={outcomeAction}
              onBack={() => {
                setOutcomeEvent(null);
                setOutcomeAction(null);
              }}
              onSuccess={() => {
                setOutcomeEvent(null);
                setOutcomeAction(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

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
