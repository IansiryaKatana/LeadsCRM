import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileSpreadsheet, FileText, Table2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type ExportFormat = "csv" | "excel" | "pdf";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat, startDate: Date, endDate: Date) => Promise<void>;
  isExporting?: boolean;
  title?: string;
  description?: string;
}

const FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
}[] = [
  { id: "csv", label: "CSV", description: "Spreadsheet-friendly text", icon: Table2 },
  { id: "excel", label: "Excel", description: "Formatted .xlsx workbook", icon: FileSpreadsheet },
  { id: "pdf", label: "PDF", description: "Print-ready report", icon: FileText },
];

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting = false,
  title = "Export Data",
  description = "Choose a format and date range. Exports include summary stats and lead records with the correct columns for this page.",
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleExport = async () => {
    if (!startDate || !endDate) return;
    await onExport(exportFormat, startDate, endDate);
  };

  const isDateRangeValid = startDate && endDate && startDate <= endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="font-display text-xl sm:text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">{description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Export format</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = exportFormat === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setExportFormat(option.id)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          selected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Date range</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-normal">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                      {startDate ? format(startDate, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-normal">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                      {endDate ? format(endDate, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {startDate && endDate && startDate > endDate && (
              <p className="text-xs text-destructive">Start date must be on or before the end date.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t bg-muted/20">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleExport}
            disabled={!isDateRangeValid || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                {exportFormat === "excel" && <FileSpreadsheet className="mr-2 h-4 w-4" />}
                {exportFormat === "pdf" && <FileText className="mr-2 h-4 w-4" />}
                {exportFormat === "csv" && <Table2 className="mr-2 h-4 w-4" />}
                Download {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
