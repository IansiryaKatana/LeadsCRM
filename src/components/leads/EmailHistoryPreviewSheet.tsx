import { format, formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { detailSectionTitleClass } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type EmailHistory = Database["public"]["Tables"]["email_history"]["Row"];

interface EmailHistoryPreviewSheetProps {
  email: EmailHistory | null;
  templateName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailHistoryPreviewSheet({
  email,
  templateName,
  open,
  onOpenChange,
}: EmailHistoryPreviewSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile ? "h-[min(92vh,720px)] rounded-t-xl" : "w-full sm:max-w-lg",
        )}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4 text-left">
          <SheetTitle className={cn(detailSectionTitleClass, "text-left line-clamp-2")}>
            {email?.subject || "Sent email"}
          </SheetTitle>
          <SheetDescription className="text-left font-body space-y-1">
            {email && (
              <>
                <span className="block">
                  To: <span className="font-medium text-foreground">{email.sent_to}</span>
                </span>
                <span className="block text-xs">
                  Sent {format(new Date(email.sent_at), "d MMM yyyy, h:mm a")} (
                  {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })})
                </span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          {email ? (
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {email.template_id && (
                  <Badge variant="outline" className="text-xs">
                    {templateName ? `Template: ${templateName}` : "From template"}
                  </Badge>
                )}
                {email.opened_at && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Mail className="h-3 w-3" />
                    Opened {formatDistanceToNow(new Date(email.opened_at), { addSuffix: true })}
                  </Badge>
                )}
              </div>

              <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="border-b bg-muted/30 px-4 py-2.5">
                  <p className="text-xs text-muted-foreground font-body">To</p>
                  <p className="text-sm font-medium truncate">{email.sent_to}</p>
                </div>
                <div className="border-b px-4 py-3">
                  <p className="text-xs text-muted-foreground font-body mb-0.5">Subject</p>
                  <p className="text-sm font-medium">{email.subject}</p>
                </div>
                <div
                  className="px-4 py-4 prose prose-sm max-w-none dark:prose-invert font-body"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
