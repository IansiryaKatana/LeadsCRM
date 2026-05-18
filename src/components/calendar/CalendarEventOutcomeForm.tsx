import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarEvent } from "@/hooks/useCalendarEvents";
import { useResolveCalendarEvent } from "@/hooks/useCalendarEvents";
import { getOutcomesForEventType } from "@/constants/calendarEvents";
import type { CalendarEventStatus } from "@/constants/calendarEvents";

export type OutcomeAction = "complete" | "no_show" | "cancel" | "reschedule";

interface CalendarEventOutcomeFormProps {
  event: CalendarEvent;
  action: OutcomeAction;
  onBack: () => void;
  onSuccess: () => void;
}

export function CalendarEventOutcomeForm({
  event,
  action,
  onBack,
  onSuccess,
}: CalendarEventOutcomeFormProps) {
  const outcomes = getOutcomesForEventType(event.event_type);
  const [outcome, setOutcome] = useState(outcomes[0]?.value ?? "done");
  const [notes, setNotes] = useState("");
  const [logFollowUp, setLogFollowUp] = useState(true);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("12:00");
  const [offerReschedule, setOfferReschedule] = useState(false);

  const resolve = useResolveCalendarEvent();

  const buildRescheduleIso = () => {
    if (!rescheduleDate) return undefined;
    return `${rescheduleDate}T${rescheduleTime}:00`;
  };

  const handleSubmit = () => {
    let status: CalendarEventStatus = "completed";
    if (action === "no_show") status = "no_show";
    if (action === "cancel") status = "cancelled";
    if (action === "reschedule") status = "scheduled";

    const rescheduleStart =
      action === "reschedule" || (action === "no_show" && offerReschedule)
        ? buildRescheduleIso()
        : undefined;

    if ((action === "reschedule" || offerReschedule) && !rescheduleStart) {
      return;
    }

    if (action === "complete" && event.event_type === "viewing" && notes.trim().length < 3) {
      return;
    }

    resolve.mutate(
      {
        id: event.id,
        leadId: event.lead_id,
        eventType: event.event_type,
        title: event.title,
        status,
        outcome: action === "complete" ? outcome : action === "no_show" ? "no_show" : null,
        outcomeNotes: notes.trim() || null,
        logFollowUp: action === "complete" && logFollowUp,
        rescheduleStart,
      },
      { onSuccess }
    );
  };

  const titleMap: Record<OutcomeAction, string> = {
    complete: "Mark completed",
    no_show: "Mark no show",
    cancel: "Cancel event",
    reschedule: "Reschedule",
  };

  return (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </button>

      <h3 className="font-semibold text-lg mb-1">{titleMap[action]}</h3>
      <p className="text-sm text-muted-foreground mb-4 truncate">{event.title}</p>

      <div className="space-y-4 flex-1 overflow-y-auto pb-4">
        {action === "complete" && (
          <div className="space-y-2">
            <Label>Outcome *</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outcomes.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(action === "complete" || action === "no_show") && (
          <div className="space-y-2">
            <Label>
              Feedback {action === "complete" && event.event_type === "viewing" ? "*" : "(optional)"}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                action === "no_show"
                  ? "Why did they not attend?"
                  : "How did it go? Next steps?"
              }
              rows={4}
            />
          </div>
        )}

        {action === "complete" && event.lead_id && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="log-followup"
              checked={logFollowUp}
              onCheckedChange={(v) => setLogFollowUp(v === true)}
            />
            <Label htmlFor="log-followup" className="font-normal cursor-pointer">
              Also log as follow-up on lead
            </Label>
          </div>
        )}

        {action === "no_show" && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="reschedule-offer"
              checked={offerReschedule}
              onCheckedChange={(v) => setOfferReschedule(v === true)}
            />
            <Label htmlFor="reschedule-offer" className="font-normal cursor-pointer">
              Reschedule viewing
            </Label>
          </div>
        )}

        {(action === "reschedule" || (action === "no_show" && offerReschedule)) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>New date *</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>Time *</Label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {action === "cancel" && (
          <p className="text-sm text-muted-foreground">
            This event will be marked cancelled. A note will be added to the lead timeline if linked.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={resolve.isPending}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={
            resolve.isPending ||
            (action === "complete" &&
              event.event_type === "viewing" &&
              notes.trim().length < 3) ||
            ((action === "reschedule" || offerReschedule) && !rescheduleDate)
          }
        >
          {resolve.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {action === "cancel" ? "Confirm cancel" : "Save"}
        </Button>
      </div>
    </div>
  );
}
