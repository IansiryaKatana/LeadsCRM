import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Lock,
  Pencil,
  PhoneCall,
  Plus,
  StickyNote,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function getAuditActionIcon(action: string): LucideIcon {
  if (action.includes("created")) return Plus;
  if (action.includes("updated") || action.includes("changed")) return Pencil;
  if (action.includes("assigned")) return UserPlus;
  if (action.includes("deleted")) return Trash2;
  if (action.includes("converted")) return CheckCircle2;
  if (action.includes("closed")) return Lock;
  if (action.includes("followup")) return PhoneCall;
  if (action.includes("note")) return StickyNote;
  if (action.includes("exception")) return AlertTriangle;
  return ClipboardList;
}

interface AuditActionIconProps {
  action: string;
  className?: string;
}

export function AuditActionIcon({ action, className }: AuditActionIconProps) {
  const Icon = getAuditActionIcon(action);
  return <Icon className={cn("size-5 shrink-0", className)} aria-hidden />;
}
