import { useAuditTrail } from "@/hooks/useAuditTrail";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuditActionIcon } from "@/utils/auditTrailIcons";
import { History, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditTrailDisplayProps {
  leadId: string;
  /** When true, renders inline without a nested scroll container (e.g. mobile sheet). */
  embedded?: boolean;
}

export function AuditTrailDisplay({ leadId, embedded = false }: AuditTrailDisplayProps) {
  const { data: auditTrail = [], isLoading } = useAuditTrail(leadId);

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "text-primary";
    if (action.includes("converted")) return "text-green-600";
    if (action.includes("closed") || action.includes("deleted")) return "text-destructive";
    if (action.includes("exception")) return "text-warning";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (auditTrail.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground text-sm">No activity recorded yet</p>
      </div>
    );
  }

  const entries = (
    <div className="space-y-2 sm:space-y-3">
      {auditTrail.map((entry: any) => (
        <div
          key={entry.id}
          className="flex gap-2 rounded-lg border border-border bg-muted/50 p-2.5 sm:gap-3 sm:p-3"
        >
          <div className="flex-shrink-0">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background sm:h-9 sm:w-9",
                getActionColor(entry.action),
              )}
            >
              <AuditActionIcon action={entry.action} className="size-4 sm:size-5" />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className={cn("text-sm font-medium leading-tight", getActionColor(entry.action))}>
              {entry.action.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
              </span>
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {(entry.profiles as any)?.full_name || "System"}
                </span>
              </span>
            </div>
            {entry.metadata && (
              <div className="text-xs text-muted-foreground">
                {Object.entries(entry.metadata).map(([key, value]: [string, any]) => (
                  <span key={key} className="mr-2 last:mr-0">
                    <strong>{key.replace(/_/g, " ")}:</strong> {String(value)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (embedded) {
    return entries;
  }

  return (
    <ScrollArea className="h-[400px] pr-2 sm:pr-4">
      {entries}
    </ScrollArea>
  );
}

