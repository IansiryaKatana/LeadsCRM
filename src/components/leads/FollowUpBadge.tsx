import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FollowUpBadgeProps {
  count: number;
  total?: number;
  className?: string;
}

export function FollowUpBadge({ count, total = 3, className }: FollowUpBadgeProps) {
  const getVariant = () => {
    if (count === 0) return "destructive";
    if (count < total) return "secondary";
    return "default";
  };

  const getColorClasses = () => {
    if (count === 0) return "bg-destructive/10 text-destructive border-destructive/20";
    if (count < total) return "bg-warning/10 text-warning border-warning/20";
    return "bg-success/10 text-success border-success/20";
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("font-semibold", getColorClasses(), className)}
    >
      Follow-ups: {count}/{total}
    </Badge>
  );
}

