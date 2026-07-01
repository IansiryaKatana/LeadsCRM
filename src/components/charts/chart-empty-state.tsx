import { cn } from "@/lib/utils";

interface ChartEmptyStateProps {
  message: string;
  className?: string;
}

export function ChartEmptyState({ message, className }: ChartEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[12rem] items-center justify-center text-sm text-muted-foreground font-body",
        className,
      )}
    >
      {message}
    </div>
  );
}
