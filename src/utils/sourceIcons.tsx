import {
  Ambulance,
  Banknote,
  Briefcase,
  Calendar,
  Camera,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  Handshake,
  Hotel,
  Lock,
  Mail,
  MessageCircle,
  Music,
  Phone,
  Search,
  Share2,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const SOURCE_ICON_MAP: Record<string, LucideIcon> = {
  google_ads: Search,
  meta: Share2,
  website: Globe,
  referral: Users,
  whatsapp: MessageCircle,
  email: Mail,
  tiktok: Music,
  web_contact: FileText,
  web_booking: Calendar,
  web_callback: Phone,
  web_deposit: Banknote,
  web_tourist: Hotel,
  web_keyworker: Ambulance,
  web_keyworkers: Briefcase,
  web_creator: Camera,
  web_secure_booking: Lock,
  web_refer_friend: Handshake,
  web_urban_hub_payment: CreditCard,
  default: Tag,
};

export function getSourceIcon(slug: string): LucideIcon {
  return SOURCE_ICON_MAP[slug] ?? SOURCE_ICON_MAP.default;
}

interface SourceIconProps {
  slug: string;
  className?: string;
}

export function SourceIcon({ slug, className }: SourceIconProps) {
  const Icon = getSourceIcon(slug);
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}

interface SourceIconBadgeProps {
  slug: string;
  color?: string;
  className?: string;
}

export function SourceIconBadge({ slug, color, className }: SourceIconBadgeProps) {
  const Icon = getSourceIcon(slug);

  return (
    <span
      className={cn(
        "flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm",
        className,
      )}
      style={
        color
          ? {
              backgroundColor: color,
              color: "#ffffff",
            }
          : undefined
      }
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}
