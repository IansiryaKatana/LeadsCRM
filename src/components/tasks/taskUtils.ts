import { cn } from "@/lib/utils";

export function getTaskPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium":
      return "bg-warning/10 text-warning border-warning/20";
    case "low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function isTaskOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return (
    new Date(dueDate) < new Date() &&
    new Date(dueDate).toDateString() !== new Date().toDateString()
  );
}

export function getTaskRowClassName(variant: "active" | "completed" | "overdue") {
  return cn(
    "group",
    variant === "completed" && "text-muted-foreground",
    variant === "overdue" && "bg-destructive/5",
  );
}
