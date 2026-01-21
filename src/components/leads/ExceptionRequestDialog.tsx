import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExceptionRequest } from "@/hooks/useExceptionRequests";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ExceptionRequestDialogProps {
  leadId: string;
  leadName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EXCEPTION_REASONS = [
  { value: "duplicate", label: "Duplicate Lead" },
  { value: "invalid_contact", label: "Invalid Contact Information" },
  { value: "spam", label: "Spam/Fake Lead" },
  { value: "wrong_number", label: "Wrong Phone Number" },
  { value: "bounced_email", label: "Email Bounced" },
  { value: "not_interested", label: "Explicitly Not Interested" },
  { value: "other", label: "Other (specify in justification)" },
];

export function ExceptionRequestDialog({
  leadId,
  leadName,
  open,
  onClose,
  onSuccess,
}: ExceptionRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [justification, setJustification] = useState("");
  const createRequest = useCreateExceptionRequest();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for the exception request",
        variant: "destructive",
      });
      return;
    }

    if (reason === "other" && !justification.trim()) {
      toast({
        title: "Error",
        description: "Please provide justification for the exception",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRequest.mutateAsync({
        lead_id: leadId,
        reason,
        justification: justification.trim() || undefined,
      });

      toast({
        title: "Exception Request Submitted",
        description: "Your request has been submitted and is pending admin approval.",
      });

      setReason("");
      setJustification("");
      onClose();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit exception request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">Request Exception to Close Lead</DialogTitle>
          <DialogDescription>
            You're attempting to close <strong>{leadName}</strong> without completing 3 follow-ups.
            Please provide a reason for requesting an exception.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Exception *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {EXCEPTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">
              Justification {reason === "other" && "*"}
            </Label>
            <Textarea
              id="justification"
              placeholder={
                reason === "other"
                  ? "Please explain why this exception is needed..."
                  : "Additional details (optional)"
              }
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {reason === "other"
                ? "Required: Please provide a detailed explanation"
                : "Optional: Provide additional context for your request"}
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This request will be reviewed by an administrator. You will
              be notified once a decision has been made.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createRequest.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createRequest.isPending || !reason}>
            {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

