import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { useLeadSources } from "@/hooks/useLeadSources";
import { useTeamMembers } from "@/hooks/useDashboardStats";
import { LEAD_STATUS_CONFIG } from "@/types/crm";
import { cn } from "@/lib/utils";

export interface LeadFilters {
  statuses: string[];
  sources: string[];
  roomChoices: string[];
  assignedTo: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  hotOnly: boolean;
  hasOverdueFollowups: boolean;
  hasNotes: boolean;
  minRevenue: number | null;
}

const defaultFilters: LeadFilters = {
  statuses: [],
  sources: [],
  roomChoices: [],
  assignedTo: null,
  dateFrom: null,
  dateTo: null,
  hotOnly: false,
  hasOverdueFollowups: false,
  hasNotes: false,
  minRevenue: null,
};

interface LeadFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  onClear: () => void;
}

export function LeadFilters({ filters, onFiltersChange, onClear }: LeadFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);
  const { data: sources = [] } = useLeadSources();
  const { data: teamMembers = [] } = useTeamMembers();

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    onClear();
    setOpen(false);
  };

  const activeFilterCount = 
    filters.statuses.length +
    filters.sources.length +
    filters.roomChoices.length +
    (filters.assignedTo ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.hotOnly ? 1 : 0) +
    (filters.hasOverdueFollowups ? 1 : 0) +
    (filters.hasNotes ? 1 : 0) +
    (filters.minRevenue ? 1 : 0);

  const toggleStatus = (status: string) => {
    setLocalFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const toggleSource = (sourceSlug: string) => {
    setLocalFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(sourceSlug)
        ? prev.sources.filter(s => s !== sourceSlug)
        : [...prev.sources, sourceSlug],
    }));
  };

  const toggleRoomChoice = (room: string) => {
    setLocalFilters(prev => ({
      ...prev,
      roomChoices: prev.roomChoices.includes(room)
        ? prev.roomChoices.filter(r => r !== room)
        : [...prev.roomChoices, room],
    }));
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className={cn("shrink-0", activeFilterCount > 0 && "bg-primary/10 border-primary")}
        onClick={() => setOpen(true)}
      >
        <Filter className="h-4 w-4" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Status</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(LEAD_STATUS_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${key}`}
                      checked={localFilters.statuses.includes(key)}
                      onCheckedChange={() => toggleStatus(key)}
                    />
                    <Label
                      htmlFor={`status-${key}`}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Source</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {sources.map((source) => (
                  <div key={source.slug} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source.slug}`}
                      checked={localFilters.sources.includes(source.slug)}
                      onCheckedChange={() => toggleSource(source.slug)}
                    />
                    <Label
                      htmlFor={`source-${source.slug}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {source.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Choice Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Room Choice</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {["platinum", "gold", "silver", "bronze", "standard"].map((room) => (
                  <div key={room} className="flex items-center space-x-2">
                    <Checkbox
                      id={`room-${room}`}
                      checked={localFilters.roomChoices.includes(room)}
                      onCheckedChange={() => toggleRoomChoice(room)}
                    />
                    <Label
                      htmlFor={`room-${room}`}
                      className="text-sm font-normal cursor-pointer capitalize"
                    >
                      {room}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned To Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Assigned To</Label>
              <Select
                value={localFilters.assignedTo || ""}
                onValueChange={(value) =>
                  setLocalFilters(prev => ({ ...prev, assignedTo: value || null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Date Range</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={localFilters.dateFrom || ""}
                    onChange={(e) =>
                      setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value || null }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={localFilters.dateTo || ""}
                    onChange={(e) =>
                      setLocalFilters(prev => ({ ...prev, dateTo: e.target.value || null }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Additional Filters</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hot-only"
                    checked={localFilters.hotOnly}
                    onCheckedChange={(checked) =>
                      setLocalFilters(prev => ({ ...prev, hotOnly: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hot-only" className="text-sm font-normal cursor-pointer">
                    Hot leads only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overdue-followups"
                    checked={localFilters.hasOverdueFollowups}
                    onCheckedChange={(checked) =>
                      setLocalFilters(prev => ({ ...prev, hasOverdueFollowups: checked as boolean }))
                    }
                  />
                  <Label htmlFor="overdue-followups" className="text-sm font-normal cursor-pointer">
                    Has overdue follow-ups
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-notes"
                    checked={localFilters.hasNotes}
                    onCheckedChange={(checked) =>
                      setLocalFilters(prev => ({ ...prev, hasNotes: checked as boolean }))
                    }
                  />
                  <Label htmlFor="has-notes" className="text-sm font-normal cursor-pointer">
                    Has notes
                  </Label>
                </div>
                <div className="flex items-center space-x-2 gap-3">
                  <Checkbox
                    id="min-revenue"
                    checked={!!localFilters.minRevenue}
                    onCheckedChange={(checked) =>
                      setLocalFilters(prev => ({
                        ...prev,
                        minRevenue: checked ? 0 : null,
                      }))
                    }
                  />
                  <Label htmlFor="min-revenue" className="text-sm font-normal cursor-pointer">
                    Minimum revenue:
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={localFilters.minRevenue || ""}
                    onChange={(e) =>
                      setLocalFilters(prev => ({
                        ...prev,
                        minRevenue: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    disabled={!localFilters.minRevenue && localFilters.minRevenue !== 0}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              Clear All
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ActiveFiltersDisplay({ filters, onRemoveFilter }: { filters: LeadFilters; onRemoveFilter: (type: string, value?: string) => void }) {
  const { data: sources = [] } = useLeadSources();
  const { data: teamMembers = [] } = useTeamMembers();

  const activeFilters: Array<{ type: string; label: string; value?: string }> = [];

  filters.statuses.forEach(status => {
    activeFilters.push({
      type: "status",
      label: LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG]?.label || status,
      value: status,
    });
  });

  filters.sources.forEach(sourceSlug => {
    const source = sources.find(s => s.slug === sourceSlug);
    activeFilters.push({
      type: "source",
      label: source?.name || sourceSlug,
      value: sourceSlug,
    });
  });

  filters.roomChoices.forEach(room => {
    activeFilters.push({
      type: "room",
      label: room.charAt(0).toUpperCase() + room.slice(1),
      value: room,
    });
  });

  if (filters.assignedTo) {
    const member = teamMembers.find(m => m.user_id === filters.assignedTo);
    activeFilters.push({
      type: "assigned",
      label: `Assigned: ${member?.full_name || "Unknown"}`,
      value: filters.assignedTo,
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    activeFilters.push({
      type: "date",
      label: `Date: ${filters.dateFrom || "..."} to ${filters.dateTo || "..."}`,
    });
  }

  if (filters.hotOnly) {
    activeFilters.push({ type: "hot", label: "Hot leads only" });
  }

  if (filters.hasOverdueFollowups) {
    activeFilters.push({ type: "overdue", label: "Has overdue follow-ups" });
  }

  if (filters.hasNotes) {
    activeFilters.push({ type: "notes", label: "Has notes" });
  }

  if (filters.minRevenue !== null) {
    activeFilters.push({ type: "revenue", label: `Revenue ≥ £${filters.minRevenue}` });
  }

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {filter.label}
          <button
            onClick={() => onRemoveFilter(filter.type, filter.value)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          activeFilters.forEach(filter => onRemoveFilter(filter.type, filter.value));
        }}
        className="h-6 text-xs"
      >
        Clear all
      </Button>
    </div>
  );
}
