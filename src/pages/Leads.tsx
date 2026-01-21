import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeadTable } from "@/components/leads/LeadTable";
import { CreateLeadForm } from "@/components/leads/CreateLeadForm";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import { useLeads } from "@/hooks/useLeads";
import { usePagination } from "@/hooks/usePagination";
import { LEAD_STATUS_CONFIG } from "@/types/crm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flame, Calendar } from "lucide-react";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { TablePagination } from "@/components/ui/table-pagination";
import { PaginationInfo } from "@/components/ui/pagination-info";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function Leads() {
  const { academicYears, defaultAcademicYear, currentAcademicYear, setCurrentAcademicYear } = useSystemSettingsContext();

  // Track whether the user has manually changed the year in this session
  const [hasUserChangedYear, setHasUserChangedYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");

  // When settings/context change and the user hasn't changed the year yet,
  // keep the local selection in sync with the configured default/current year.
  useEffect(() => {
    if (!hasUserChangedYear) {
      const baseYear = currentAcademicYear || defaultAcademicYear || "";
      setSelectedYear(baseYear);
    }
  }, [currentAcademicYear, defaultAcademicYear, hasUserChangedYear]);

  // Keep shared currentAcademicYear in sync when local selection changes
  useEffect(() => {
    setCurrentAcademicYear(selectedYear);
  }, [selectedYear, setCurrentAcademicYear]);

  const { data: leads = [], isLoading } = useLeads(selectedYear || undefined);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filterLeads = (status: string) => {
    if (status === "all") return leads;
    if (status === "hot") return leads.filter((l) => l.is_hot);
    return leads.filter((l) => l.lead_status === status);
  };

  const filteredLeads = useMemo(() => filterLeads(activeTab), [leads, activeTab]);
  
  const {
    paginatedItems: paginatedLeads,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredLeads);

  // Reset to page 1 when tab changes
  useEffect(() => {
    if (currentPage > 1) {
      goToPage(1);
    }
  }, [activeTab]);

  const tabCounts = {
    all: leads.length,
    hot: leads.filter((l) => l.is_hot).length,
    new: leads.filter((l) => l.lead_status === "new").length,
    high_interest: leads.filter((l) => l.lead_status === "high_interest").length,
    converted: leads.filter((l) => l.lead_status === "converted").length,
    closed: leads.filter((l) => l.lead_status === "closed").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your leads
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedYear || "all"}
                onValueChange={(value) => {
                  const year = value === "all" ? "" : value;
                  setSelectedYear(year);
                  setHasUserChangedYear(true);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CreateLeadForm />
          </div>
        </div>

        {/* Pagination Info at Top */}
        {!isLoading && filteredLeads.length > 0 && (
          <PaginationInfo
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            isLoading={isLoading}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="gap-2 shrink-0">
              All {!isLoading && <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.all}</span>}
            </TabsTrigger>
            <TabsTrigger value="hot" className="gap-2 shrink-0">
              <Flame className="h-4 w-4 text-warning shrink-0" />
              Hot {!isLoading && <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.hot}</span>}
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2 shrink-0">
              New {!isLoading && <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.new}</span>}
            </TabsTrigger>
            <TabsTrigger value="high_interest" className="gap-2 shrink-0">
              High Interest {!isLoading && <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.high_interest}</span>}
            </TabsTrigger>
            <TabsTrigger value="converted" className="gap-2 shrink-0">
              Converted {!isLoading && <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.converted}</span>}
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2 shrink-0">
              Closed {!isLoading && <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.closed}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <SkeletonTable />
            ) : (
              <>
                <LeadTable
                  leads={paginatedLeads}
                  onViewLead={setSelectedLead}
                  allLeadIds={filteredLeads.map((l) => l.id)}
                />
                {filteredLeads.length > 0 && (
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    onPrevious={previousPage}
                    onNext={nextPage}
                    hasPrevious={hasPreviousPage}
                    hasNext={hasNextPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    totalItems={totalItems}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <LeadDetailDialog 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
        />
      </div>
    </AppLayout>
  );
}
