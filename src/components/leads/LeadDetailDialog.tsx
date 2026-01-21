import { useState } from "react";
import { LEAD_STATUS_CONFIG, getSourceConfig } from "@/types/crm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLeadStatus, useAssignLead, useToggleHotLead, useLead } from "@/hooks/useLeads";
import { useLeadNotes, useCreateLeadNote } from "@/hooks/useLeadNotes";
import { useFollowUps, useCanCloseLead } from "@/hooks/useFollowUps";
import { useTeamMembers } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { useLeadSources } from "@/hooks/useLeadSources";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpBadge } from "@/components/leads/FollowUpBadge";
import { FollowUpHistory } from "@/components/leads/FollowUpHistory";
import { FollowUpForm } from "@/components/leads/FollowUpForm";
import { ExceptionRequestDialog } from "@/components/leads/ExceptionRequestDialog";
import { AuditTrailDisplay } from "@/components/leads/AuditTrailDisplay";
import { EmailTab } from "@/components/leads/EmailTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Flame, Mail, Phone, Calendar, DollarSign, User, MessageSquare, Loader2, PhoneCall, Plus, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface LeadDetailDialogProps {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailDialog({ lead, onClose }: LeadDetailDialogProps) {
  const [newNote, setNewNote] = useState("");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const { hasElevatedRole, isAdmin } = useAuth();
  const { formatCurrency, getRoomLabel } = useSystemSettingsContext();
  
  const updateStatus = useUpdateLeadStatus();
  const assignLead = useAssignLead();
  const toggleHot = useToggleHotLead();
  const createNote = useCreateLeadNote();
  
  // Fetch lead data reactively to get updated follow-up count
  const { data: currentLead, isLoading: leadLoading } = useLead(lead?.id || "");
  const leadData = currentLead || lead; // Use fetched lead if available, fallback to prop
  
  const { data: notes = [], isLoading: notesLoading, refetch: refetchNotes } = useLeadNotes(leadData?.id || "");
  const { data: followUps = [], isLoading: followUpsLoading, refetch: refetchFollowUps } = useFollowUps(leadData?.id || "");
  const { data: canClose = false } = useCanCloseLead(leadData?.id || "");
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: sources = [] } = useLeadSources();

  if (!leadData) return null;

  const isWebContact = leadData.source === "web_contact";
  const isWebKeyworkers = leadData.source === "web_keyworkers";
  const isWebSimpleDialog = isWebContact || isWebKeyworkers;
  const followUpCount = leadData.followup_count || 0;
  const lastFollowUpDate = leadData.last_followup_date ? new Date(leadData.last_followup_date) : null;
  const nextFollowUpDate = leadData.next_followup_date ? new Date(leadData.next_followup_date) : null;

  const handleStatusChange = (status: LeadStatus) => {
    // Check if trying to close without 3 follow-ups
    if (status === "closed" && followUpCount < 3) {
      setPendingStatus(status);
      setShowCloseWarning(true);
      return;
    }
    updateStatus.mutate({ id: leadData.id, status });
  };

  const handleConfirmClose = () => {
    if (pendingStatus) {
      updateStatus.mutate({ id: leadData.id, status: pendingStatus });
      setShowCloseWarning(false);
      setPendingStatus(null);
    }
  };

  const handleAssign = (userId: string) => {
    assignLead.mutate({ id: leadData.id, userId });
  };

  const handleToggleHot = () => {
    toggleHot.mutate({ id: leadData.id, isHot: !leadData.is_hot });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNote.mutate({ leadId: leadData.id, note: newNote }, {
      onSuccess: () => {
        setNewNote("");
        refetchNotes();
      },
    });
  };

  const statusConfig = LEAD_STATUS_CONFIG[leadData.lead_status];
  const sourceConfig = getSourceConfig(leadData.source, sources);
  const isCompletedOrClosed = leadData.lead_status === "converted" || leadData.lead_status === "closed";

  return (
    <Dialog open={!!leadData} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl overflow-hidden flex flex-col pb-6">
        {/* Mobile drag handle */}
        <div className="sm:hidden mx-auto mt-2 mb-2 h-1.5 w-12 rounded-full bg-muted" />
        
        <DialogHeader className="sm:pt-0">
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <button onClick={handleToggleHot} className="hover:scale-110 transition-transform">
              <Flame className={cn("h-6 w-6", leadData.is_hot ? "text-warning fill-warning" : "text-muted-foreground")} />
            </button>
            {leadData.full_name}
          </DialogTitle>
        </DialogHeader>

        {/* Status & Source - Always visible */}
        <div className="flex flex-wrap gap-3 mb-4">
          <span className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold",
            statusConfig.bgColor,
            statusConfig.color
          )}>
            {statusConfig.label}
          </span>
          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-muted flex items-center gap-2">
            {sourceConfig.icon} {sourceConfig.label}
          </span>
          <FollowUpBadge count={followUpCount} />
        </div>

        {/* Tabs for better organization */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={cn(
              "grid w-full",
              isWebSimpleDialog ? "grid-cols-3" : hasElevatedRole ? "grid-cols-5" : "grid-cols-4",
            )}
          >
            <TabsTrigger value="details">
              {isWebSimpleDialog ? "Contact Info" : "Details"}
            </TabsTrigger>
            {isWebContact ? (
              <TabsTrigger value="contact-message">Message</TabsTrigger>
            ) : isWebKeyworkers ? (
              <TabsTrigger value="keyworkers-details">Keyworker Details</TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="followups">
                  Follow-Ups
                  {followUpCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {followUpCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notes">
                  Notes
                  {notes.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      {notes.length}
                    </span>
                  )}
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </TabsTrigger>
            {!isWebSimpleDialog && hasElevatedRole && (
              <TabsTrigger value="history">History</TabsTrigger>
            )}
          </TabsList>

          {/* Details / Contact Info Tab */}
          <TabsContent value="details" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h3>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${leadData.email}`} className="hover:text-primary">{leadData.email}</a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href={`tel:${leadData.phone}`} className="hover:text-primary">{leadData.phone}</a>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(leadData.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {!isWebSimpleDialog && (
              <>
                {/* Revenue Card */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Potential Revenue</span>
                  </div>
                  <p className="text-3xl font-display font-bold">
                    {formatCurrency(leadData.potential_revenue)}
                  </p>
                </div>

                {/* Room Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Room Choice</p>
                    <p className="font-semibold">{getRoomLabel(leadData.room_choice)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Stay Duration</p>
                    <p className="font-semibold">{leadData.stay_duration.replace("_", " ")}</p>
                  </div>
                </div>
              </>
            )}

            {/* Actions for elevated users */}
            {hasElevatedRole && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select value={leadData.lead_status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => {
                        const isClosed = key === "closed";
                        const isDisabled = isClosed && followUpCount < 3;
                        return (
                          <SelectItem 
                            key={key} 
                            value={key}
                            disabled={isDisabled}
                          >
                            <span className="flex items-center gap-2">
                              {config.label}
                              {isDisabled && (
                                <span className="text-xs text-muted-foreground">
                                  (Requires 3 follow-ups)
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign To</label>
                  <Select value={leadData.assigned_to || ""} onValueChange={handleAssign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {member.full_name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Follow-Ups Tab (not shown for Web Contact / Keyworkers) */}
          {!isWebSimpleDialog && (
          <TabsContent value="followups" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {!isCompletedOrClosed && (
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" />
                    Follow-Up Progress
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {lastFollowUpDate && (
                      <span>Last: {formatDistanceToNow(lastFollowUpDate, { addSuffix: true })}</span>
                    )}
                    {nextFollowUpDate && (
                      <span className={cn(
                        "font-medium",
                        nextFollowUpDate < new Date() ? "text-destructive" : ""
                      )}>
                        Next: {formatDistanceToNow(nextFollowUpDate, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowFollowUpForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Record Follow-Up
                </Button>
              </div>
            )}

            {followUpsLoading && followUps.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading follow-ups...</span>
                </div>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="absolute h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] bg-primary/50" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ) : followUps.length === 0 ? (
              <div className="text-center py-8">
                <PhoneCall className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">No follow-ups recorded yet</p>
              </div>
            ) : (
              <FollowUpHistory followUps={followUps} leadId={leadData.id} />
            )}
          </TabsContent>
          )}

          {/* Notes Tab (not shown for Web Contact / Keyworkers) */}
          {!isWebSimpleDialog && (
          <TabsContent value="notes" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </h3>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!newNote.trim() || createNote.isPending}
                  size="sm"
                  className="w-full"
                >
                  {createNote.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Note
                </Button>
              </div>

              {notesLoading && notes.length === 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading notes...</span>
                  </div>
                  <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="absolute h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] bg-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">No notes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-muted/50 text-sm border border-border">
                      <p className="whitespace-pre-wrap">{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {(note as any).profiles?.full_name || "Unknown"} • {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          )}

          {/* Contact Message Tab (Web Contact only) */}
          {isWebContact && (
            <TabsContent value="contact-message" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className="font-semibold mb-2">Reason for contacting</h3>
                  <p className="text-sm text-muted-foreground">
                    {leadData.contact_reason || "Not provided"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className="font-semibold mb-2">Message</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {leadData.contact_message || "No message provided"}
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Keyworkers Details Tab (Web Keyworkers only) */}
          {isWebKeyworkers && (
            <TabsContent value="keyworkers-details" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className="font-semibold mb-2">Length of Stay</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {leadData.keyworker_length_of_stay || "Not provided"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className="font-semibold mb-2">Preferred Date</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {leadData.keyworker_preferred_date || "Not provided"}
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Email Tab */}
          <TabsContent value="email" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <EmailTab lead={leadData} />
          </TabsContent>

          {/* History Tab - Only for elevated users */}
          {hasElevatedRole && (
            <TabsContent value="history" className="mt-4 space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Activity History
                  </h3>
                </div>
                <AuditTrailDisplay leadId={leadData.id} />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Follow-Up Form Dialog */}
        <FollowUpForm
          leadId={leadData.id}
          currentFollowUpCount={followUpCount}
          open={showFollowUpForm}
          onClose={() => {
            setShowFollowUpForm(false);
            // Refetch after form closes to ensure data is updated
            setTimeout(() => {
              refetchFollowUps();
            }, 200);
          }}
        />

        {/* Close Warning Dialog */}
        <AlertDialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cannot Close Lead</AlertDialogTitle>
              <AlertDialogDescription>
                This lead requires 3 follow-ups before it can be closed.
                <br />
                <br />
                Current follow-ups: <strong>{followUpCount}/3</strong>
                <br />
                <br />
                Please record the remaining follow-up(s) before closing this lead, or request an exception if there's a valid reason.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => setShowCloseWarning(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="outline"
                onClick={() => {
                  setShowCloseWarning(false);
                  setShowExceptionDialog(true);
                }}
              >
                Request Exception
              </AlertDialogAction>
              <AlertDialogAction onClick={() => {
                setShowCloseWarning(false);
                setShowFollowUpForm(true);
              }}>
                Record Follow-Up
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Exception Request Dialog */}
        <ExceptionRequestDialog
          leadId={leadData.id}
          leadName={leadData.full_name}
          open={showExceptionDialog}
          onClose={() => {
            setShowExceptionDialog(false);
            setPendingStatus(null);
          }}
          onSuccess={() => {
            // Exception request submitted, user will be notified when approved
            setShowExceptionDialog(false);
            setPendingStatus(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}