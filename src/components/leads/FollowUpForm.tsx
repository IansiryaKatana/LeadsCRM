import { useState } from "react";
import { useCreateFollowUp } from "@/hooks/useFollowUps";
import { FOLLOWUP_TYPE_CONFIG, FOLLOWUP_OUTCOME_CONFIG, type FollowUpType, type FollowUpOutcome } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface FollowUpFormProps {
  leadId: string;
  currentFollowUpCount: number;
  open: boolean;
  onClose: () => void;
}

export function FollowUpForm({ leadId, currentFollowUpCount, open, onClose }: FollowUpFormProps) {
  const [followupType, setFollowupType] = useState<FollowUpType>("call");
  const [followupDate, setFollowupDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  });
  const [outcome, setOutcome] = useState<FollowUpOutcome>("contacted");
  const [notes, setNotes] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextActionDate, setNextActionDate] = useState("");

  const createFollowUp = useCreateFollowUp();

  const nextFollowUpNumber = currentFollowUpCount + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createFollowUp.mutate(
      {
        leadId,
        followupType,
        followupDate: new Date(followupDate).toISOString(),
        outcome,
        notes: notes.trim() || undefined,
        nextActionDate: scheduleNext && nextActionDate ? new Date(nextActionDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setFollowupType("call");
          setFollowupDate(new Date().toISOString().slice(0, 16));
          setOutcome("contacted");
          setNotes("");
          setScheduleNext(false);
          setNextActionDate("");
          // Small delay to ensure cache updates
          setTimeout(() => {
            onClose();
          }, 100);
        },
      }
    );
  };

  // Suggest next action date based on outcome
  const getSuggestedNextDate = () => {
    const today = new Date();
    let daysToAdd = 3; // Default: 3 days

    switch (outcome) {
      case "interested":
        daysToAdd = 2; // Follow up sooner if interested
        break;
      case "no_answer":
      case "voicemail":
        daysToAdd = 1; // Follow up quickly if no answer
        break;
      case "callback_requested":
        daysToAdd = 1; // Call back as requested
        break;
      case "not_interested":
        daysToAdd = 5; // Give more time if not interested
        break;
      default:
        daysToAdd = 3;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate.toISOString().slice(0, 16);
  };

  const handleOutcomeChange = (newOutcome: FollowUpOutcome) => {
    setOutcome(newOutcome);
    if (scheduleNext && !nextActionDate) {
      setNextActionDate(getSuggestedNextDate());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Follow-Up #{nextFollowUpNumber}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="followup-type">Follow-Up Type *</Label>
            <Select value={followupType} onValueChange={(value) => setFollowupType(value as FollowUpType)}>
              <SelectTrigger id="followup-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FOLLOWUP_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followup-date">Date & Time *</Label>
            <Input
              id="followup-date"
              type="datetime-local"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome *</Label>
            <Select value={outcome} onValueChange={(value) => handleOutcomeChange(value as FollowUpOutcome)}>
              <SelectTrigger id="outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FOLLOWUP_OUTCOME_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add details about this follow-up..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="schedule-next"
              checked={scheduleNext}
              onCheckedChange={(checked) => {
                setScheduleNext(checked as boolean);
                if (checked && !nextActionDate) {
                  setNextActionDate(getSuggestedNextDate());
                }
              }}
            />
            <Label htmlFor="schedule-next" className="text-sm font-normal cursor-pointer">
              Schedule next follow-up
            </Label>
          </div>

          {scheduleNext && (
            <div className="space-y-2">
              <Label htmlFor="next-action-date">Next Follow-Up Date</Label>
              <Input
                id="next-action-date"
                type="datetime-local"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={createFollowUp.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFollowUp.isPending}>
              {createFollowUp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Follow-Up
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

