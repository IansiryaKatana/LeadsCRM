import { useState } from "react";
import { LEAD_STATUS_CONFIG, LEAD_STATUS_CONFIG as STATUS_CONFIG, getSourceConfig } from "@/types/crm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Flame, Eye, MoreHorizontal, Trash2, CheckSquare, Square, UserPlus } from "lucide-react";
import { useDeleteLead, useToggleHotLead, useUpdateLeadStatus, useAssignLead } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { toast } from "@/hooks/use-toast";
import { useTeamMembers } from "@/hooks/useDashboardStats";
import { useWebLeadReadManager } from "@/hooks/useWebLeadsUnread";
import { useLeadSources } from "@/hooks/useLeadSources";
import type { Database } from "@/integrations/supabase/types";
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

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

type LeadTableViewMode = "default" | "web_contact" | "web_keyworkers";

interface LeadTableProps {
  leads: Lead[];
  onViewLead?: (lead: Lead) => void;
  viewMode?: LeadTableViewMode;
  // Optional: IDs of all leads in the current filter (across all pages)
  allLeadIds?: string[];
}

export function LeadTable({ leads, onViewLead, viewMode = "default", allLeadIds }: LeadTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Lead>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  // Track whether the current selection is "all pages" (entire filtered result), not just current page
  const [allPagesSelected, setAllPagesSelected] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>("new");
  const [bulkAssignTo, setBulkAssignTo] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  
  const { isAdmin, user } = useAuth();
  const { formatCurrency } = useSystemSettingsContext();
  const { data: sources = [] } = useLeadSources();
  const deleteLead = useDeleteLead();
  const toggleHot = useToggleHotLead();
  const updateStatus = useUpdateLeadStatus();
  const assignLead = useAssignLead();
  const { data: teamMembers = [] } = useTeamMembers();
  const { markLeadAsRead, isLeadUnread } = useWebLeadReadManager();

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery)
  );

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      deleteLead.mutate(leadToDelete.id);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleToggleHot = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    toggleHot.mutate({ id: lead.id, isHot: !lead.is_hot });
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    // Any manual change switches back to "current page only" mode
    if (allPagesSelected) {
      setAllPagesSelected(false);
    }
    const newSelected = new Set(selectedLeads);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(sortedLeads.map(l => l.id)));
      setAllPagesSelected(false);
    } else {
      setSelectedLeads(new Set());
      setAllPagesSelected(false);
    }
  };

  const handleSelectAllAcrossPages = () => {
    if (allLeadIds && allLeadIds.length > 0) {
      setSelectedLeads(new Set(allLeadIds));
      setAllPagesSelected(true);
    } else {
      // Fallback: use all currently sorted leads if full list not provided
      setSelectedLeads(new Set(sortedLeads.map(l => l.id)));
      setAllPagesSelected(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeads.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    const idsToProcess =
      allPagesSelected && allLeadIds && allLeadIds.length > 0
        ? allLeadIds
        : Array.from(selectedLeads);

    const count = idsToProcess.length;

    idsToProcess.forEach(id => {
      deleteLead.mutate(id);
    });
    setSelectedLeads(new Set());
    setAllPagesSelected(false);
    setBulkDeleteDialogOpen(false);
    toast({
      title: "Leads Deleted",
      description: `${count} lead(s) have been deleted`,
    });
  };

  const handleBulkUpdateStatus = () => {
    if (selectedLeads.size === 0 || !bulkStatus) return;
    const idsToProcess =
      allPagesSelected && allLeadIds && allLeadIds.length > 0
        ? allLeadIds
        : Array.from(selectedLeads);

    idsToProcess.forEach(id => {
      updateStatus.mutate({ id, status: bulkStatus });
    });
    setSelectedLeads(new Set());
    setAllPagesSelected(false);
    setBulkAction("");
    toast({
      title: "Status Updated",
      description: `${idsToProcess.length} lead(s) status updated to ${STATUS_CONFIG[bulkStatus].label}`,
    });
  };

  const handleBulkAssign = () => {
    if (selectedLeads.size === 0 || !bulkAssignTo) return;
    const idsToProcess =
      allPagesSelected && allLeadIds && allLeadIds.length > 0
        ? allLeadIds
        : Array.from(selectedLeads);

    idsToProcess.forEach(id => {
      assignLead.mutate({ id, userId: bulkAssignTo });
    });
    setSelectedLeads(new Set());
    setAllPagesSelected(false);
    setBulkAction("");
    toast({
      title: "Leads Assigned",
      description: `${idsToProcess.length} lead(s) assigned successfully`,
    });
  };

  const handleBulkMarkAsOpened = () => {
    if (selectedLeads.size === 0 && !(allPagesSelected && allLeadIds && allLeadIds.length > 0)) return;
    
    const idsToProcess =
      allPagesSelected && allLeadIds && allLeadIds.length > 0
        ? allLeadIds
        : Array.from(selectedLeads);

    // Filter to only web leads
    const webLeadSources = ["web_contact", "web_booking", "web_callback", "web_deposit", "web_keyworkers"];
    const webLeads = leads.filter(lead => 
      idsToProcess.includes(lead.id) && webLeadSources.includes(lead.source)
    );
    
    if (webLeads.length === 0) {
      toast({
        title: "No Web Leads Selected",
        description: "Please select web leads to mark as opened",
        variant: "destructive",
      });
      return;
    }
    
    // Mark each web lead as read
    webLeads.forEach(lead => {
      markLeadAsRead(lead.id);
    });
    
    const count = webLeads.length;
    setSelectedLeads(new Set());
    setAllPagesSelected(false);
    setBulkAction("");
    toast({
      title: "Leads Marked as Opened",
      description: `${count} web lead(s) marked as opened`,
    });
  };

  const allSelected = sortedLeads.length > 0 && selectedLeads.size === sortedLeads.length;
  const someSelected = selectedLeads.size > 0 && selectedLeads.size < sortedLeads.length;

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">All Leads</h3>
              {selectedLeads.size > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-semibold">
                    {selectedLeads.size} selected
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0"
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedLeads.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckSquare className="h-4 w-4" />
                {selectedLeads.size} selected
              </div>
              <div className="flex-1" />
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin && (
                  <>
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Bulk Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Update Status</SelectItem>
                        <SelectItem value="assign">Assign To</SelectItem>
                        <SelectItem value="markOpened">Mark as Opened</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>

                    {bulkAction === "status" && (
                      <>
                        <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as LeadStatus)}>
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleBulkUpdateStatus}>
                          Apply
                        </Button>
                      </>
                    )}

                    {bulkAction === "assign" && (
                      <>
                        <Select value={bulkAssignTo} onValueChange={setBulkAssignTo}>
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleBulkAssign} disabled={!bulkAssignTo}>
                          Assign
                        </Button>
                      </>
                    )}

                    {bulkAction === "markOpened" && (
                      <Button size="sm" onClick={handleBulkMarkAsOpened}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Mark as Opened
                      </Button>
                    )}

                    {bulkAction === "delete" && (
                      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                    )}
                  </>
                )}
                {isAdmin && selectedLeads.size > 0 && allLeadIds && selectedLeads.size < allLeadIds.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2"
                    onClick={handleSelectAllAcrossPages}
                  >
                    Select all {allLeadIds.length} leads
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLeads(new Set());
                    setBulkAction("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) {
                      (el as any).indeterminate = someSelected;
                    }
                  }}
                />
              </TableHead>
              <TableHead className="font-semibold">Lead</TableHead>
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">
                {viewMode === "web_contact"
                  ? "Reason"
                  : viewMode === "web_keyworkers"
                    ? "Length of Stay"
                    : "LP / Campaign"}
              </TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Revenue</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map((lead) => {
                const statusConfig = LEAD_STATUS_CONFIG[lead.lead_status];
                const sourceConfig = getSourceConfig(lead.source, sources);
                const isSelected = selectedLeads.has(lead.id);
                
                return (
                  <TableRow 
                    key={lead.id} 
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (isLeadUnread(lead.id, lead.source)) {
                        markLeadAsRead(lead.id);
                      }
                      onViewLead?.(lead);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleHot(e, lead);
                          }}
                          className="hover:scale-110 transition-transform"
                        >
                          <Flame className={cn(
                            "h-4 w-4 shrink-0",
                            lead.is_hot ? "text-warning fill-warning" : "text-muted-foreground/30"
                          )} />
                        </button>
                        <div>
                          <p
                            className={cn(
                              "font-medium",
                              isLeadUnread(lead.id, lead.source) && "font-semibold text-foreground"
                            )}
                          >
                            {lead.full_name}
                          </p>
                          <p
                            className={cn(
                              "text-sm text-muted-foreground",
                              isLeadUnread(lead.id, lead.source) && "text-foreground"
                            )}
                          >
                            {lead.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{sourceConfig.icon}</span>
                        <span className="text-sm">{sourceConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {viewMode === "web_contact" ? (
                        <span className="text-xs text-muted-foreground">
                          {lead.contact_reason || "-"}
                        </span>
                      ) : viewMode === "web_keyworkers" ? (
                        <span className="text-xs text-muted-foreground">
                          {lead.keyworker_length_of_stay || "-"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {lead.landing_page ?? "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        statusConfig.bgColor,
                        statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatCurrency(lead.potential_revenue)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewLead?.(lead)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => handleDelete(e as unknown as React.MouseEvent, lead)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{leadToDelete?.full_name}</strong>? This action cannot be undone and will permanently remove this lead and all associated data.
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Leads</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedLeads.size} lead(s)</strong>? This action cannot be undone and will permanently remove these leads and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedLeads.size} Lead(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
