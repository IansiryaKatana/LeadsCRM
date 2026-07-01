import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeadTable } from "@/components/leads/LeadTable";
import { CreateLeadForm } from "@/components/leads/CreateLeadForm";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import { useLeads } from "@/hooks/useLeads";
import { usePagination } from "@/hooks/usePagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flame, Calendar, Download } from "lucide-react";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { TablePagination } from "@/components/ui/table-pagination";
import { PaginationInfo } from "@/components/ui/pagination-info";
import { ExportDialog } from "@/components/dashboard/ExportDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  exportSourceToCSV,
  exportSourceToExcel,
  exportSourceToPDF,
} from "@/utils/exportSource";
import type { ExportFormat } from "@/components/dashboard/ExportDialog";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadTableViewMode = "default" | "web_contact" | "web_keyworkers" | "deposits_payments";

export interface SegmentLeadsPageProps {
  sourceSlug: string;
  title: string;
  subtitle: string;
  viewMode?: LeadTableViewMode;
  showExport?: boolean;
  showCreateLead?: boolean;
}

export function SegmentLeadsPage({
  sourceSlug,
  title,
  subtitle,
  viewMode = "default",
  showExport = true,
  showCreateLead = true,
}: SegmentLeadsPageProps) {
  const { academicYears, currentAcademicYear, setCurrentAcademicYear, currency } =
    useSystemSettingsContext();
  const { data: allLeads = [], isLoading } = useLeads(currentAcademicYear);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const segmentLeads = useMemo(
    () => allLeads.filter((lead) => lead.source === sourceSlug),
    [allLeads, sourceSlug],
  );

  const filterLeads = (status: string) => {
    if (status === "all") return segmentLeads;
    if (status === "hot") return segmentLeads.filter((l) => l.is_hot);
    return segmentLeads.filter((l) => l.lead_status === status);
  };

  const filteredLeads = useMemo(() => filterLeads(activeTab), [segmentLeads, activeTab]);

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

  useEffect(() => {
    if (currentPage > 1) {
      goToPage(1);
    }
  }, [activeTab]);

  const handleExport = async (format: ExportFormat, startDate: Date, endDate: Date) => {
    setIsExporting(true);
    try {
      const exportArgs = {
        startDate,
        endDate,
        currencySymbol: currency.symbol,
        sourceSlug,
        sourceName: title,
        viewMode,
      };
      if (format === "csv") {
        await exportSourceToCSV(exportArgs);
        toast({ title: "Export Successful", description: `CSV file for ${title} has been downloaded` });
      } else if (format === "excel") {
        await exportSourceToExcel(exportArgs);
        toast({ title: "Export Successful", description: `Excel file for ${title} has been downloaded` });
      } else {
        await exportSourceToPDF(exportArgs);
        toast({ title: "Export Successful", description: `PDF file for ${title} has been downloaded` });
      }
      setExportDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export data";
      toast({ title: "Export Failed", description: message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const tabCounts = {
    all: segmentLeads.length,
    hot: segmentLeads.filter((l) => l.is_hot).length,
    new: segmentLeads.filter((l) => l.lead_status === "new").length,
    high_interest: segmentLeads.filter((l) => l.lead_status === "high_interest").length,
    converted: segmentLeads.filter((l) => l.lead_status === "converted").length,
    closed: segmentLeads.filter((l) => l.lead_status === "closed").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={(currentAcademicYear ?? "") || "all"}
                onValueChange={(value) => {
                  setCurrentAcademicYear(value === "all" ? "" : value);
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
            {showExport && (
              <Button variant="outline" className="gap-2" onClick={() => setExportDialogOpen(true)}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {showCreateLead && <CreateLeadForm />}
          </div>
        </div>

        {!isLoading && filteredLeads.length > 0 && (
          <PaginationInfo
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            isLoading={isLoading}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1 overflow-x-auto scrollbar-hide">
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
              High Interest{" "}
              {!isLoading && (
                <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.high_interest}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="converted" className="gap-2 shrink-0">
              Converted{" "}
              {!isLoading && (
                <span className="text-xs bg-background px-2 py-0.5 rounded-full">{tabCounts.converted}</span>
              )}
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
                  viewMode={viewMode}
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

        <LeadDetailDialog lead={selectedLead} onClose={() => setSelectedLead(null)} />

        {showExport && (
          <ExportDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            onExport={handleExport}
            isExporting={isExporting}
            title={`Export ${title}`}
            description="Includes summary analytics and lead rows with columns matching this page (e.g. Payment ID & Amount for deposits)."
          />
        )}
      </div>
    </AppLayout>
  );
}
