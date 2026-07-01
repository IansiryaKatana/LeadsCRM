import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Mail,
  MessageSquare,
  Phone,
  PhoneOff,
  User,
  UserX,
  Voicemail,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FollowUpOutcome, FollowUpType } from "@/types/crm";

export const FOLLOWUP_TYPE_ICON_MAP: Record<FollowUpType, LucideIcon> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  in_person: User,
  other: ClipboardList,
};

export const FOLLOWUP_OUTCOME_ICON_MAP: Record<FollowUpOutcome, LucideIcon> = {
  contacted: CheckCircle2,
  no_answer: PhoneOff,
  voicemail: Voicemail,
  not_interested: XCircle,
  interested: Lightbulb,
  callback_requested: Calendar,
  wrong_contact_info: UserX,
};

export function getFollowUpTypeIcon(type: FollowUpType): LucideIcon {
  return FOLLOWUP_TYPE_ICON_MAP[type] ?? ClipboardList;
}

export function getFollowUpOutcomeIcon(outcome: FollowUpOutcome): LucideIcon {
  return FOLLOWUP_OUTCOME_ICON_MAP[outcome] ?? CheckCircle2;
}

interface FollowUpTypeIconProps {
  type: FollowUpType;
  className?: string;
}

export function FollowUpTypeIcon({ type, className }: FollowUpTypeIconProps) {
  const Icon = getFollowUpTypeIcon(type);
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}

interface FollowUpOutcomeIconProps {
  outcome: FollowUpOutcome;
  className?: string;
}

export function FollowUpOutcomeIcon({ outcome, className }: FollowUpOutcomeIconProps) {
  const Icon = getFollowUpOutcomeIcon(outcome);
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}
