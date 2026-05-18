import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { parseLeadNote } from "@/utils/parseLeadNote";

interface LeadNoteContentProps {
  note: string;
  className?: string;
}

function NoteFieldGrid({
  fields,
  columns = 2,
}: {
  fields: { label: string; value: string }[];
  columns?: 1 | 2;
}) {
  return (
    <dl
      className={cn(
        "grid gap-3",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
      )}
    >
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {field.label}
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground break-words whitespace-pre-wrap">
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function LeadNoteContent({ note, className }: LeadNoteContentProps) {
  const parsed = useMemo(() => parseLeadNote(note), [note]);

  if (parsed.type === "plain") {
    return (
      <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", className)}>
        {parsed.plain}
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {parsed.summary && parsed.summary.length > 0 && (
        <NoteFieldGrid fields={parsed.summary} />
      )}

      {parsed.message && (
        <div className="rounded-lg border border-border/60 bg-background/70 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Message
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{parsed.message}</p>
        </div>
      )}

      {parsed.details && parsed.details.length > 0 && (
        <div className="space-y-3 pt-1 border-t border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Submission details
          </p>
          <NoteFieldGrid fields={parsed.details} columns={2} />
        </div>
      )}
    </div>
  );
}
