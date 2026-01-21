import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { FOLLOWUP_TYPE_CONFIG, FOLLOWUP_OUTCOME_CONFIG } from "@/types/crm";
import type { LeadFollowUp } from "@/types/crm";
import { Phone, Mail, MessageSquare, User, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteFollowUp } from "@/hooks/useFollowUps";
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
import { useState } from "react";

interface FollowUpHistoryProps {
  followUps: (LeadFollowUp & { profiles?: { full_name: string } })[];
  leadId: string;
}

export function FollowUpHistory({ followUps, leadId }: FollowUpHistoryProps) {
  const { hasElevatedRole } = useAuth();
  const deleteFollowUp = useDeleteFollowUp();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "in_person":
        return <User className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleDelete = (followUpId: string) => {
    setFollowUpToDelete(followUpId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (followUpToDelete) {
      deleteFollowUp.mutate({ followUpId: followUpToDelete, leadId });
      setDeleteDialogOpen(false);
      setFollowUpToDelete(null);
    }
  };

  if (followUps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No follow-ups recorded yet</p>
    );
  }

  return (
    <div className="space-y-3">
      {followUps.map((followUp) => {
        const typeConfig = FOLLOWUP_TYPE_CONFIG[followUp.followup_type];
        const outcomeConfig = FOLLOWUP_OUTCOME_CONFIG[followUp.outcome];
        const date = new Date(followUp.followup_date);
        const isRecent = (Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days

        return (
          <div
            key={followUp.id}
            className={cn(
              "p-3 rounded-lg border bg-card",
              "hover:bg-muted/50 transition-colors"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{followUp.followup_number}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(followUp.followup_type)}
                    <span className="text-sm font-medium">{typeConfig.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    • {formatDistanceToNow(date, { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", outcomeConfig.color)}>
                    {outcomeConfig.icon} {outcomeConfig.label}
                  </span>
                </div>

                {followUp.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{followUp.notes}</p>
                )}

                {followUp.next_action_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>Next: {formatDistanceToNow(new Date(followUp.next_action_date), { addSuffix: true })}</span>
                  </div>
                )}

                {followUp.profiles && (
                  <p className="text-xs text-muted-foreground">
                    by {followUp.profiles.full_name || "Unknown"}
                  </p>
                )}
              </div>

              {hasElevatedRole && isRecent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(followUp.id)}
                  disabled={deleteFollowUp.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone and will permanently remove this follow-up record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

