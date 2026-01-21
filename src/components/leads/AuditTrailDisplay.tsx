import { useAuditTrail } from "@/hooks/useAuditTrail";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditTrailDisplayProps {
  leadId: string;
}

export function AuditTrailDisplay({ leadId }: AuditTrailDisplayProps) {
  const { data: auditTrail = [], isLoading } = useAuditTrail(leadId);

  const getActionIcon = (action: string) => {
    if (action.includes("created")) return "➕";
    if (action.includes("updated") || action.includes("changed")) return "✏️";
    if (action.includes("assigned")) return "👤";
    if (action.includes("deleted")) return "🗑️";
    if (action.includes("converted")) return "✅";
    if (action.includes("closed")) return "🔒";
    if (action.includes("followup")) return "📞";
    if (action.includes("note")) return "📝";
    if (action.includes("exception")) return "⚠️";
    return "📋";
  };

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

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {auditTrail.map((entry: any) => (
          <div
            key={entry.id}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <div className="flex-shrink-0 mt-1">
              <span className="text-2xl">{getActionIcon(entry.action)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className={cn("font-medium text-sm", getActionColor(entry.action))}>
                    {entry.action.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  {entry.metadata && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {Object.entries(entry.metadata).map(([key, value]: [string, any]) => (
                        <span key={key} className="mr-3">
                          <strong>{key.replace(/_/g, " ")}:</strong> {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>
                  {(entry.profiles as any)?.full_name || "System"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

