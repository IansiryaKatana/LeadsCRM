import { cn } from "@/lib/utils";
import { LeadStatus, LEAD_STATUS_CONFIG } from "@/types/crm";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";

interface LeadStatusCardProps {
  status: LeadStatus;
  count: number;
  revenue: number;
  className?: string;
}

export function LeadStatusCard({ status, count, revenue, className }: LeadStatusCardProps) {
  const config = LEAD_STATUS_CONFIG[status];
  const { formatCurrency } = useSystemSettingsContext();
  
  return (
    <div
      className={cn(
        "rounded-xl p-4 bg-card shadow-card card-hover border border-border/50",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          config.bgColor,
          config.color
        )}>
          {config.label}
        </span>
        <span className="font-display text-2xl font-bold">{count}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatCurrency(revenue)}
        </span>
        <span className="ml-1">potential</span>
      </div>
    </div>
  );
}