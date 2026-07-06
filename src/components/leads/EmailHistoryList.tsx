import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EmailHistory = Database["public"]["Tables"]["email_history"]["Row"];

interface EmailHistoryListProps {
  emails: EmailHistory[];
  templateNameById: Record<string, string>;
  onSelect: (email: EmailHistory) => void;
}

export function EmailHistoryList({
  emails,
  templateNameById,
  onSelect,
}: EmailHistoryListProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-10 pl-4" />
              <TableHead>Subject</TableHead>
              <TableHead className="w-48">To</TableHead>
              <TableHead className="w-36">Sent</TableHead>
              <TableHead className="w-28 pr-4">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow
                key={email.id}
                className="cursor-pointer group"
                onClick={() => onSelect(email)}
              >
                <TableCell className="py-3 pl-4 pr-0">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                </TableCell>
                <TableCell className="py-3 min-w-[200px]">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {email.subject}
                  </p>
                  {email.opened_at && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Opened {formatDistanceToNow(new Date(email.opened_at), { addSuffix: true })}
                    </p>
                  )}
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground truncate">
                  {email.sent_to}
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="py-3 pr-4">
                  {email.template_id ? (
                    <Badge variant="outline" className="text-xs font-normal truncate max-w-[7rem]">
                      {templateNameById[email.template_id] || "Template"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Custom</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile two-column grid */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {emails.map((email) => (
          <button
            key={email.id}
            type="button"
            onClick={() => onSelect(email)}
            className={cn(
              "text-left rounded-xl border bg-card p-3 space-y-2",
              "hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <div className="flex items-start gap-1.5 min-w-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-medium line-clamp-2 leading-snug">{email.subject}</p>
            </div>
            <p className="text-xs text-muted-foreground truncate">{email.sent_to}</p>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
              </span>
              {email.template_id && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                  Template
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
