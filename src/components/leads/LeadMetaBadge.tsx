import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_BADGE_CLASSES, LEAD_STATUS_CONFIG, type LeadStatus } from "@/types/crm";
import { SourceIcon } from "@/utils/sourceIcons";
import { cn } from "@/lib/utils";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(LEAD_STATUS_BADGE_CLASSES[status], className)}>
      {config.label}
    </Badge>
  );
}

interface LeadSourceBadgeProps {
  slug: string;
  label: string;
  className?: string;
}

export function LeadSourceBadge({ slug, label, className }: LeadSourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("max-w-full gap-1.5 border-border bg-muted/50 text-foreground", className)}
    >
      <SourceIcon slug={slug} className="size-3" />
      <span className="truncate">{label}</span>
    </Badge>
  );
}
