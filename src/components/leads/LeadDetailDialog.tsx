import { useState, useEffect } from "react";
import { LEAD_STATUS_CONFIG, getSourceConfig } from "@/types/crm";
import { cn } from "@/lib/utils";
import { subsectionTitleClass, pageTitleClass, detailSectionTitleClass } from "@/lib/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { LeadSourceBadge, LeadStatusBadge } from "@/components/leads/LeadMetaBadge";
import { FollowUpHistory } from "@/components/leads/FollowUpHistory";
import { FollowUpForm } from "@/components/leads/FollowUpForm";
import { ExceptionRequestDialog } from "@/components/leads/ExceptionRequestDialog";
import { AuditTrailDisplay } from "@/components/leads/AuditTrailDisplay";
import { LeadNoteContent } from "@/components/leads/LeadNoteContent";
import { EmailTab } from "@/components/leads/EmailTab";
import { TasksTab } from "@/components/leads/TasksTab";
import { CalendarTab } from "@/components/leads/CalendarTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollProgressArea } from "@/components/ui/scroll-progress-area";
import { Flame, Mail, Phone, Calendar, DollarSign, User, MessageSquare, Loader2, PhoneCall, Plus, History, CheckSquare, CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { DEPOSITS_PAYMENTS_SOURCE_SLUG } from "@/constants/leadSegments";
import { getLeadPaymentAmountPounds } from "@/utils/leadPaymentAmount";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

interface LeadDetailDialogProps {
  lead: Lead | null;
  onClose: () => void;
  initialTab?: string;
}

const MOBILE_TAB_LABELS: Record<string, string> = {
  details: "Details",
  followups: "Follow-Ups",
  tasks: "Tasks",
  calendar: "Calendar",
  notes: "Notes",
  email: "Email",
  history: "History",
  "contact-message": "Message",
  "keyworkers-details": "Keyworker Details",
  "tourist-details": "Stay Details",
  "creator-details": "Creator App",
  "secure-booking": "Booking Info",
  "refer-friend": "Referral Info",
};

export function LeadDetailDialog({ lead, onClose, initialTab }: LeadDetailDialogProps) {
  const isMobile = useIsMobile();
  const [newNote, setNewNote] = useState("");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab ?? "details");

  useEffect(() => {
    if (lead) {
      setActiveTab(initialTab ?? "details");
    }
  }, [lead?.id, initialTab]);
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
  const isWebKeyworkers = leadData.source === "web_keyworkers" || leadData.source === "web_keyworker";
  const isWebTourist = leadData.source === "web_tourist";
  const isWebCreator = leadData.source === "web_creator";
  const isWebSecureBooking = leadData.source === "web_secure_booking";
  const isWebReferFriend = leadData.source === "web_refer_friend";
  const isDepositsPaymentsLead =
    leadData.source === DEPOSITS_PAYMENTS_SOURCE_SLUG || leadData.source === "web_deposit";
  const paymentAmount = isDepositsPaymentsLead
    ? getLeadPaymentAmountPounds(leadData.metadata)
    : null;
  const isWebSimpleDialog = isWebContact || isWebKeyworkers || isWebTourist || isWebCreator || isWebSecureBooking || isWebReferFriend;
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

  const sourceConfig = getSourceConfig(leadData.source, sources);
  const isCompletedOrClosed = leadData.lead_status === "converted" || leadData.lead_status === "closed";

  const tabScrollClass = cn(
    "mt-4",
    isMobile
      ? ""
      : "flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
  );

  const mobileIconTabClass =
    "flex flex-1 items-center justify-center rounded-sm p-2 min-h-11 min-w-0";
  const mobileTextTabClass =
    "flex items-center justify-center rounded-sm px-2 py-2 text-xs min-h-11";
  const mobileActiveTabLabel =
    activeTab === "details" && isWebSimpleDialog
      ? "Contact Info"
      : MOBILE_TAB_LABELS[activeTab] ?? activeTab;

  const leadTitle = (
    <span className={cn("flex items-center gap-3", pageTitleClass)}>
      <button onClick={handleToggleHot} className="hover:scale-110 transition-transform">
        <Flame className={cn("h-6 w-6", leadData.is_hot ? "text-warning fill-warning" : "text-muted-foreground")} />
      </button>
      {leadData.full_name}
    </span>
  );

  const leadDetailBody = (
    <>
        {/* Status & Source - Always visible */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <LeadStatusBadge status={leadData.lead_status} />
          <LeadSourceBadge slug={leadData.source} label={sourceConfig.label} />
          <FollowUpBadge count={followUpCount} />
        </div>

        {/* Tabs for better organization */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className={cn("w-full", !isMobile && "flex flex-col flex-1 min-h-0")}
        >
          <TabsList
            className={cn(
              "h-auto p-1",
              isMobile
                ? isWebSimpleDialog
                  ? cn(
                      "grid w-full gap-0.5",
                      hasElevatedRole ? "grid-cols-4" : "grid-cols-3",
                    )
                  : "flex w-full"
                : "inline-flex w-fit max-w-full flex-wrap justify-start gap-0.5",
            )}
          >
            <TabsTrigger
              value="details"
              className={isMobile ? (isWebSimpleDialog ? mobileTextTabClass : mobileIconTabClass) : undefined}
              aria-label="Details"
            >
              {isMobile && !isWebSimpleDialog ? (
                <>
                  <User className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Details</span>
                </>
              ) : isWebSimpleDialog ? (
                isMobile ? "Contact" : "Contact Info"
              ) : (
                "Details"
              )}
            </TabsTrigger>
            {isWebContact ? (
              <TabsTrigger
                value="contact-message"
                className={isMobile ? mobileTextTabClass : undefined}
              >
                Message
              </TabsTrigger>
            ) : isWebKeyworkers ? (
              <TabsTrigger
                value="keyworkers-details"
                className={isMobile ? mobileTextTabClass : undefined}
              >
                {isMobile ? "Keyworker" : "Keyworker Details"}
              </TabsTrigger>
            ) : isWebTourist ? (
              <TabsTrigger
                value="tourist-details"
                className={isMobile ? mobileTextTabClass : undefined}
              >
                {isMobile ? "Stay" : "Stay Details"}
              </TabsTrigger>
            ) : isWebCreator ? (
              <TabsTrigger
                value="creator-details"
                className={isMobile ? mobileTextTabClass : undefined}
              >
                {isMobile ? "Creator" : "Creator App"}
              </TabsTrigger>
            ) : isWebSecureBooking ? (
              <TabsTrigger
                value="secure-booking"
                className={isMobile ? mobileTextTabClass : undefined}
              >
                {isMobile ? "Booking" : "Booking Info"}
              </TabsTrigger>
            ) : isWebReferFriend ? (
              <TabsTrigger
                value="refer-friend"
                className={isMobile ? mobileTextTabClass : undefined}
              >
                {isMobile ? "Referral" : "Referral Info"}
              </TabsTrigger>
            ) : (
              <>
                <TabsTrigger
                  value="followups"
                  className={isMobile ? mobileIconTabClass : undefined}
                  aria-label={`Follow-Ups${followUpCount > 0 ? `, ${followUpCount} recorded` : ""}`}
                >
                  {isMobile ? (
                    <span className="relative inline-flex">
                      <PhoneCall className="h-4 w-4" aria-hidden />
                      {followUpCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                          {followUpCount}
                        </span>
                      )}
                      <span className="sr-only">Follow-Ups</span>
                    </span>
                  ) : (
                    <>
                      Follow-Ups
                      {followUpCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {followUpCount}
                        </span>
                      )}
                    </>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className={isMobile ? mobileIconTabClass : undefined}
                  aria-label="Tasks"
                >
                  {isMobile ? (
                    <>
                      <CheckSquare className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Tasks</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Tasks
                    </>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className={isMobile ? mobileIconTabClass : undefined}
                  aria-label="Calendar"
                >
                  {isMobile ? (
                    <>
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Calendar</span>
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4 mr-1" />
                      Calendar
                    </>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className={isMobile ? mobileIconTabClass : undefined}
                  aria-label={`Notes${notes.length > 0 ? `, ${notes.length} note${notes.length === 1 ? "" : "s"}` : ""}`}
                >
                  {isMobile ? (
                    <span className="relative inline-flex">
                      <MessageSquare className="h-4 w-4" aria-hidden />
                      {notes.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                          {notes.length}
                        </span>
                      )}
                      <span className="sr-only">Notes</span>
                    </span>
                  ) : (
                    <>
                      Notes
                      {notes.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {notes.length}
                        </span>
                      )}
                    </>
                  )}
                </TabsTrigger>
              </>
            )}
            <TabsTrigger
              value="email"
              className={isMobile ? (isWebSimpleDialog ? mobileTextTabClass : mobileIconTabClass) : undefined}
              aria-label="Email"
            >
              {isMobile && !isWebSimpleDialog ? (
                <>
                  <Mail className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Email</span>
                </>
              ) : (
                <>
                  {!isMobile && <Mail className="h-4 w-4 mr-1" />}
                  {isMobile && isWebSimpleDialog && <Mail className="h-3.5 w-3.5 mr-1 shrink-0" />}
                  Email
                </>
              )}
            </TabsTrigger>
            {!isWebSimpleDialog && hasElevatedRole && (
              <TabsTrigger
                value="history"
                className={isMobile ? mobileIconTabClass : undefined}
                aria-label="History"
              >
                {isMobile ? (
                  <>
                    <History className="h-4 w-4" aria-hidden />
                    <span className="sr-only">History</span>
                  </>
                ) : (
                  "History"
                )}
              </TabsTrigger>
            )}
          </TabsList>
          {isMobile && !isWebSimpleDialog && (
            <p className="mt-1.5 text-center text-xs font-medium text-muted-foreground">
              {mobileActiveTabLabel}
            </p>
          )}

          {/* Details / Contact Info Tab */}
          <TabsContent value="details" className={cn(tabScrollClass, "space-y-4")}>
            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className={cn(subsectionTitleClass, "text-muted-foreground")}>Contact Information</h3>
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
                {/* Revenue / payment amount */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {isDepositsPaymentsLead ? "Amount" : "Potential Revenue"}
                    </span>
                  </div>
                  <p className="text-3xl font-display font-bold">
                    {formatCurrency(
                      isDepositsPaymentsLead
                        ? (paymentAmount ?? 0)
                        : leadData.potential_revenue,
                    )}
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
          <TabsContent value="followups" className={cn(tabScrollClass, "space-y-4")}>
            {!isCompletedOrClosed && (
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                  <h3 className={subsectionTitleClass}>
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
          <TabsContent value="notes" className={cn(tabScrollClass, "space-y-4")}>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className={subsectionTitleClass}>
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
                    <div key={note.id} className="rounded-lg border border-border bg-muted/50 p-4">
                      <LeadNoteContent note={note.note} />
                      <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        {(note as any).profiles?.full_name || (note.created_by ? "Unknown" : "System")} •{" "}
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          )}

          {/* Tasks Tab (not shown for Web Contact / Keyworkers) */}
          {!isWebSimpleDialog && (
          <TabsContent value="tasks" className={tabScrollClass}>
            <TasksTab leadId={leadData.id} />
          </TabsContent>
          )}

          {/* Calendar Tab (not shown for Web Contact / Keyworkers) */}
          {!isWebSimpleDialog && (
          <TabsContent value="calendar" className={tabScrollClass}>
            <CalendarTab leadId={leadData.id} leadName={leadData.full_name} />
          </TabsContent>
          )}

          {/* Contact Message Tab (Web Contact only) */}
          {isWebContact && (
            <TabsContent value="contact-message" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2")}>Reason for contacting</h3>
                  <p className="text-sm text-muted-foreground">
                    {leadData.contact_reason || "Not provided"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2")}>Message</h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {leadData.contact_message || "No message provided"}
                  </p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Keyworkers Details Tab (Web Keyworkers only) */}
          {isWebKeyworkers && (
            <TabsContent value="keyworkers-details" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2")}>Length of Stay</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {leadData.keyworker_length_of_stay || (leadData.metadata as any)?.stay_duration || "Not provided"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2")}>Preferred Date</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {leadData.keyworker_preferred_date || (leadData.metadata as any)?.start_date || "Not provided"}
                  </p>
                </div>
                {(leadData.metadata as any)?.rooms_count && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <h3 className={cn(detailSectionTitleClass, "mb-2")}>Rooms Requested</h3>
                    <p className="text-sm text-muted-foreground">
                      {(leadData.metadata as any).rooms_count}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Tourist Details Tab (Web Tourist only) */}
          {isWebTourist && (
            <TabsContent value="tourist-details" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Start Date</h3>
                    <p className="text-sm">{(leadData.metadata as any)?.start_date || "Not provided"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>End Date</h3>
                    <p className="text-sm">{(leadData.metadata as any)?.end_date || "Not provided"}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Rooms Requested</h3>
                  <p className="text-sm">{(leadData.metadata as any)?.rooms_count || "Not provided"}</p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Content Creator Details Tab */}
          {isWebCreator && (
            <TabsContent value="creator-details" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>City / University</h3>
                  <p className="text-sm">{(leadData.metadata as any)?.city_university || "Not provided"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {['instagram', 'tiktok', 'snapchat', 'youtube'].map(social => (
                    (leadData.metadata as any)?.[social] && (
                      <div key={social} className="p-4 rounded-xl bg-muted/50">
                        <h3 className={cn(detailSectionTitleClass, "mb-1 text-muted-foreground capitalize")}>{social}</h3>
                        <p className="text-sm truncate">{(leadData.metadata as any)[social]}</p>
                      </div>
                    )
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Collaboration Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Followers</p>
                      <p className="text-sm">{(leadData.metadata as any)?.total_followers || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Content Type</p>
                      <p className="text-sm">
                        {(leadData.metadata as any)?.content_type} 
                        {(leadData.metadata as any)?.content_type_other && ` (${(leadData.metadata as any).content_type_other})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="text-sm">{(leadData.metadata as any)?.collaboration_format || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Content Idea</h3>
                  <p className="text-sm italic">"{(leadData.metadata as any)?.urbanhub_content_idea || "No idea provided"}"</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Example Links</h3>
                  <p className="text-sm whitespace-pre-wrap">{(leadData.metadata as any)?.example_links || "None provided"}</p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Secure Booking Details Tab */}
          {isWebSecureBooking && (
            <TabsContent value="secure-booking" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-primary")}>Payment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount Paid</p>
                      <p className="text-lg font-bold">
                        {formatCurrency((leadData.metadata as any)?.amount_pence / 100 || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold text-success flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" /> {(leadData.metadata as any)?.payment_status || "Paid"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Stripe ID</p>
                    <p className="text-[10px] font-mono break-all">{(leadData.metadata as any)?.payment_intent_id}</p>
                  </div>
                  {(leadData.metadata as any)?.payment_description && (
                    <div className="mt-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Payment Description</p>
                      <p className="text-xs">{(leadData.metadata as any)?.payment_description}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Room Preference</h3>
                  <p className="text-sm font-semibold">
                    {(leadData.metadata as any)?.studio_preference || getRoomLabel(leadData.room_choice)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Attribution</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Form type:</span> {(leadData.metadata as any)?.form_type_raw || "Not provided"}</p>
                    <p><span className="text-muted-foreground">Submission type:</span> {(leadData.metadata as any)?.submission_type || "Not provided"}</p>
                    <p><span className="text-muted-foreground">Template key:</span> {(leadData.metadata as any)?.email_template || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Refer a Friend Details Tab */}
          {isWebReferFriend && (
            <TabsContent value="refer-friend" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-primary")}>Referral Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount Paid</p>
                      <p className="text-lg font-bold">
                        {formatCurrency((leadData.metadata as any)?.amount_pence / 100 || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Stripe ID</p>
                      <p className="text-[10px] font-mono break-all truncate">{(leadData.metadata as any)?.payment_intent_id}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border-l-4 border-l-blue-500">
                  <h3 className={cn(detailSectionTitleClass, "mb-3 text-muted-foreground")}>Friend's Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-semibold">{(leadData.metadata as any)?.friend_name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Studio / Room Number</p>
                      <p className="text-sm font-semibold">{(leadData.metadata as any)?.friend_studio_number || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <h3 className={cn(detailSectionTitleClass, "mb-2 text-muted-foreground")}>Referrer's Studio Preference</h3>
                  <p className="text-sm font-semibold">{getRoomLabel(leadData.room_choice)}</p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Email Tab */}
          <TabsContent value="email" className={cn(tabScrollClass, "space-y-4")}>
            <EmailTab lead={leadData} />
          </TabsContent>

          {/* History Tab - Only for elevated users */}
          {hasElevatedRole && (
            <TabsContent value="history" className={cn(tabScrollClass, "space-y-4")}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className={subsectionTitleClass}>
                    Activity History
                  </h3>
                </div>
                <AuditTrailDisplay leadId={leadData.id} embedded={isMobile} />
              </div>
            </TabsContent>
          )}
        </Tabs>
    </>
  );

  return (
    <>
      {isMobile ? (
        <Dialog open={!!leadData} onOpenChange={() => onClose()}>
          <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
            <div className="shrink-0">
              <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" aria-hidden />
              <DialogHeader className="space-y-0 border-b px-5 pb-3 pt-3 text-left">
                <DialogTitle className={cn(pageTitleClass, "text-xl leading-tight")}>
                  {leadTitle}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Lead details, follow-ups, tasks, and activity for {leadData.full_name}
                </DialogDescription>
              </DialogHeader>
            </div>
            <ScrollProgressArea scrollKey={activeTab} contentClassName="px-5 pb-6 pt-4">
              {leadDetailBody}
            </ScrollProgressArea>
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={!!leadData} onOpenChange={(open) => !open && onClose()}>
          <SheetContent
            side="right"
            className="flex h-full w-full max-w-[min(100vw,1100px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-none sm:w-[1100px]"
          >
            <SheetHeader className="shrink-0 border-b px-6 pb-4 pt-6 text-left">
              <SheetTitle className={pageTitleClass}>{leadTitle}</SheetTitle>
              <SheetDescription className="sr-only">
                Lead details, follow-ups, tasks, and activity for {leadData.full_name}
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-4 pb-6">
              {leadDetailBody}
            </div>
          </SheetContent>
        </Sheet>
      )}

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
    </>
  );
}