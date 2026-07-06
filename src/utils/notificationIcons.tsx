import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Phone,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function getNotificationTypeIcon(type: string): LucideIcon {
  switch (type) {
    case "followup_reminder":
    case "followup_overdue":
      return Phone;
    case "new_lead_assigned":
      return Target;
    case "lead_converted":
      return CheckCircle2;
    case "lead_status_changed":
      return Activity;
    case "exception_requested":
      return AlertTriangle;
    case "exception_approved":
      return Check;
    case "exception_rejected":
      return X;
    default:
      return Bell;
  }
}

interface NotificationTypeIconProps {
  type: string;
  className?: string;
}

export function NotificationTypeIcon({ type, className }: NotificationTypeIconProps) {
  const Icon = getNotificationTypeIcon(type);
  return <Icon className={cn("size-5 shrink-0 text-muted-foreground", className)} aria-hidden />;
}
