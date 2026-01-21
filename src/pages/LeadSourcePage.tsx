import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LeadTable } from "@/components/leads/LeadTable";
import { CreateLeadForm } from "@/components/leads/CreateLeadForm";
import { LeadDetailDialog } from "@/components/leads/LeadDetailDialog";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import { useLeads } from "@/hooks/useLeads";
import { useLeadSources } from "@/hooks/useLeadSources";
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
import { Flame, Calendar, Download } from "lucide-react";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { TablePagination } from "@/components/ui/table-pagination";
import { PaginationInfo } from "@/components/ui/pagination-info";
import { ExportDialog } from "@/components/dashboard/ExportDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { exportSourceToExcel, exportSourceToPDF } from "@/utils/exportSource";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function LeadSourcePage() {
  const { sourceSlug } = useParams<{ sourceSlug: string }>();
  const { academicYears, defaultAcademicYear, currency } = useSystemSettingsContext();
  const [selectedYear, setSelectedYear] = useState<string>(defaultAcademicYear || "");
  const { data: allLeads = [], isLoading } = useLeads(selectedYear || undefined);
  const { data: sources = [] } = useLeadSources();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Find the source by slug
  const source = sources.find(s => s.slug === sourceSlug);
  
  // Filter leads by source
  const sourceLeads = allLeads.filter(lead => lead.source === sourceSlug);

  const filterLeads = (status: string) => {
    if (status === "all") return sourceLeads;
    if (status === "hot") return sourceLeads.filter((l) => l.is_hot);
    return sourceLeads.filter((l) => l.lead_status === status);
  };

  const filteredLeads = useMemo(() => filterLeads(activeTab), [sourceLeads, activeTab]);
  
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

  const handleExport = async (format: "excel" | "pdf", startDate: Date, endDate: Date) => {
    if (!source) return;
    
    setIsExporting(true);
    try {
      if (format === "excel") {
        await exportSourceToExcel({
          startDate,
          endDate,
          currencySymbol: currency.symbol,
          sourceSlug: source.slug,
          sourceName: source.name,
        });
        toast({
          title: "Export Successful",
          description: `Excel file for ${source.name} has been downloaded`,
        });
      } else {
        await exportSourceToPDF({
          startDate,
          endDate,
          currencySymbol: currency.symbol,
          sourceSlug: source.slug,
          sourceName: source.name,
        });
        toast({
          title: "Export Successful",
          description: `PDF file for ${source.name} has been downloaded`,
        });
      }
      setExportDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export source data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const tabCounts = {
    all: sourceLeads.length,
    hot: sourceLeads.filter((l) => l.is_hot).length,
    new: sourceLeads.filter((l) => l.lead_status === "new").length,
    high_interest: sourceLeads.filter((l) => l.lead_status === "high_interest").length,
    converted: sourceLeads.filter((l) => l.lead_status === "converted").length,
    closed: sourceLeads.filter((l) => l.lead_status === "closed").length,
  };

  if (!source) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Source not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">
              {source.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track leads from {source.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedYear || undefined} onValueChange={(value) => setSelectedYear(value === "all" ? "" : value)}>
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
            <Button variant="outline" className="gap-2" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
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
                  viewMode={
                    sourceSlug === "web_contact"
                      ? "web_contact"
                      : sourceSlug === "web_keyworkers"
                        ? "web_keyworkers"
                        : "default"
                  }
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

        {source && (
          <ExportDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            onExport={handleExport}
            isExporting={isExporting}
            title={`Export ${source.name} Data`}
          />
        )}
      </div>
    </AppLayout>
  );
}

