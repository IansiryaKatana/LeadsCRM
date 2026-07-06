import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { pageTitleClass } from "@/lib/typography";
import { FOLLOWUP_TYPE_CONFIG, FOLLOWUP_OUTCOME_CONFIG } from "@/types/crm";
import type { LeadFollowUp } from "@/types/crm";
import { FollowUpOutcomeIcon, FollowUpTypeIcon } from "@/utils/followUpIcons";
import { Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-12 pl-4">#</TableHead>
              <TableHead className="w-36">Type</TableHead>
              <TableHead className="w-44">Outcome</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-32">When</TableHead>
              <TableHead className="w-28">By</TableHead>
              <TableHead className="w-28">Next</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {followUps.map((followUp) => {
              const typeConfig = FOLLOWUP_TYPE_CONFIG[followUp.followup_type];
              const outcomeConfig = FOLLOWUP_OUTCOME_CONFIG[followUp.outcome];
              const date = new Date(followUp.followup_date);
              const isRecent =
                Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;

              return (
                <TableRow key={followUp.id} className="group">
                  <TableCell className="py-3 pl-4 font-semibold text-muted-foreground text-sm">
                    #{followUp.followup_number}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <FollowUpTypeIcon type={followUp.followup_type} />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {typeConfig.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap",
                        outcomeConfig.color,
                      )}
                    >
                      <FollowUpOutcomeIcon outcome={followUp.outcome} />
                      {outcomeConfig.label}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 max-w-[240px]">
                    <p className="text-sm text-muted-foreground truncate">
                      {followUp.notes || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(date, { addSuffix: true })}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground truncate">
                    {followUp.profiles?.full_name || "—"}
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {followUp.next_action_date ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDistanceToNow(new Date(followUp.next_action_date), {
                          addSuffix: true,
                        })}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    {hasElevatedRole && isRecent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(followUp.id)}
                        disabled={deleteFollowUp.isPending}
                        aria-label="Delete follow-up"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile two-column grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {followUps.map((followUp) => {
          const typeConfig = FOLLOWUP_TYPE_CONFIG[followUp.followup_type];
          const outcomeConfig = FOLLOWUP_OUTCOME_CONFIG[followUp.outcome];
          const date = new Date(followUp.followup_date);
          const isRecent = Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;

          return (
            <div
              key={followUp.id}
              className="rounded-xl border bg-card p-3 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  #{followUp.followup_number}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <FollowUpTypeIcon type={followUp.followup_type} />
                <span className="text-sm font-medium truncate">{typeConfig.label}</span>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  outcomeConfig.color,
                )}
              >
                <FollowUpOutcomeIcon outcome={followUp.outcome} />
                <span className="truncate">{outcomeConfig.label}</span>
              </span>
              {followUp.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2">{followUp.notes}</p>
              )}
              {followUp.profiles && (
                <p className="text-[10px] text-muted-foreground truncate">
                  by {followUp.profiles.full_name}
                </p>
              )}
              {hasElevatedRole && isRecent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-destructive hover:text-destructive"
                  onClick={() => handleDelete(followUp.id)}
                  disabled={deleteFollowUp.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={pageTitleClass}>Delete Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone and will
              permanently remove this follow-up record.
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
    </>
  );
}
