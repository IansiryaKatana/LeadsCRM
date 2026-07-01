import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Table2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExportFormat = "csv" | "excel" | "pdf";

interface ExportFormatBarProps {
  className?: string;
  disabled?: boolean;
  loadingCsv?: boolean;
  loadingExcel?: boolean;
  loadingPdf?: boolean;
  onCsv?: () => void;
  onExcel?: () => void;
  onPdf?: () => void;
}

export function ExportFormatBar({
  className,
  disabled = false,
  loadingCsv = false,
  loadingExcel = false,
  loadingPdf = false,
  onCsv,
  onExcel,
  onPdf,
}: ExportFormatBarProps) {
  const btnClass =
    "h-9 min-w-0 flex-1 gap-2 rounded-lg border-border/80 bg-card font-body text-xs sm:flex-initial sm:text-sm shadow-sm hover:bg-muted/50";

  return (
    <div
      className={cn(
        "flex w-full items-stretch justify-stretch gap-2 rounded-xl border border-border/60 bg-muted/20 p-2 sm:w-auto sm:items-center sm:justify-end",
        className
      )}
    >
      {onCsv && (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onCsv}
          disabled={disabled || loadingCsv}
        >
          {loadingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table2 className="h-4 w-4" />}
          CSV
        </Button>
      )}
      {onExcel && (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onExcel}
          disabled={disabled || loadingExcel}
        >
          {loadingExcel ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Excel
        </Button>
      )}
      {onPdf && (
        <Button
          variant="outline"
          size="sm"
          className={btnClass}
          onClick={onPdf}
          disabled={disabled || loadingPdf}
        >
          {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          PDF
        </Button>
      )}
    </div>
  );
}
