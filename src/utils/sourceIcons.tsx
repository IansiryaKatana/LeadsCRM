import {
  Search,
  Facebook,
  Globe,
  Users,
  MessageCircle,
  Mail,
  Music,
  Tag,
  type LucideIcon,
} from "lucide-react";

// Map source slugs to Lucide React icons
export const SOURCE_ICON_MAP: Record<string, LucideIcon> = {
  google_ads: Search,
  meta: Facebook,
  website: Globe,
  referral: Users,
  whatsapp: MessageCircle,
  email: Mail,
  tiktok: Music,
  // Default fallback
  default: Tag,
};

// Get icon component for a source slug
export function getSourceIcon(slug: string): LucideIcon {
  return SOURCE_ICON_MAP[slug] || SOURCE_ICON_MAP.default;
}

