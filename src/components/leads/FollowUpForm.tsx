import { useState } from "react";
import { useCreateFollowUp } from "@/hooks/useFollowUps";
import {
  FOLLOWUP_TYPE_CONFIG,
  FOLLOWUP_OUTCOME_CONFIG,
  type FollowUpType,
  type FollowUpOutcome,
} from "@/types/crm";
import { FollowUpOutcomeIcon, FollowUpTypeIcon } from "@/utils/followUpIcons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { detailSectionTitleClass } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface FollowUpFormProps {
  leadId: string;
  currentFollowUpCount: number;
  open: boolean;
  onClose: () => void;
}

export function FollowUpForm({
  leadId,
  currentFollowUpCount,
  open,
  onClose,
}: FollowUpFormProps) {
  const isMobile = useIsMobile();
  const [followupType, setFollowupType] = useState<FollowUpType>("call");
  const [followupDate, setFollowupDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
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
        nextActionDate:
          scheduleNext && nextActionDate
            ? new Date(nextActionDate).toISOString()
            : undefined,
      },
      {
        onSuccess: () => {
          setFollowupType("call");
          setFollowupDate(new Date().toISOString().slice(0, 16));
          setOutcome("contacted");
          setNotes("");
          setScheduleNext(false);
          setNextActionDate("");
          setTimeout(() => {
            onClose();
          }, 100);
        },
      },
    );
  };

  const getSuggestedNextDate = () => {
    const today = new Date();
    let daysToAdd = 3;

    switch (outcome) {
      case "interested":
        daysToAdd = 2;
        break;
      case "no_answer":
      case "voicemail":
        daysToAdd = 1;
        break;
      case "callback_requested":
        daysToAdd = 1;
        break;
      case "not_interested":
        daysToAdd = 5;
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

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile
            ? "h-[min(92vh,720px)] rounded-t-xl"
            : "w-full sm:max-w-lg",
        )}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4 text-left">
          <SheetTitle className={cn(detailSectionTitleClass, "text-left")}>
            Record Follow-Up #{nextFollowUpNumber}
          </SheetTitle>
          <SheetDescription className="text-left font-body">
            Log the contact outcome and optionally schedule the next touchpoint.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <form
            id="follow-up-form"
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="followup-type">Follow-up type</Label>
                <Select
                  value={followupType}
                  onValueChange={(value) => setFollowupType(value as FollowUpType)}
                >
                  <SelectTrigger id="followup-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FOLLOWUP_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <FollowUpTypeIcon type={key as FollowUpType} />
                          <span>{config.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followup-date">Date &amp; time</Label>
                <Input
                  id="followup-date"
                  type="datetime-local"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select
                  value={outcome}
                  onValueChange={(value) =>
                    handleOutcomeChange(value as FollowUpOutcome)
                  }
                >
                  <SelectTrigger id="outcome">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FOLLOWUP_OUTCOME_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <FollowUpOutcomeIcon outcome={key as FollowUpOutcome} />
                          <span>{config.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="What was discussed? Any objections or next steps?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="schedule-next"
                  checked={scheduleNext}
                  onCheckedChange={(checked) => {
                    setScheduleNext(checked as boolean);
                    if (checked && !nextActionDate) {
                      setNextActionDate(getSuggestedNextDate());
                    }
                  }}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="schedule-next"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Schedule next follow-up
                  </Label>
                  <p className="text-xs text-muted-foreground font-body">
                    Suggested based on outcome when enabled.
                  </p>
                </div>
              </div>

              {scheduleNext && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="next-action-date">Next follow-up date</Label>
                  <Input
                    id="next-action-date"
                    type="datetime-local"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t px-6 py-4 gap-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createFollowUp.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="follow-up-form"
            disabled={createFollowUp.isPending}
            className="w-full sm:w-auto"
          >
            {createFollowUp.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Follow-Up
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
