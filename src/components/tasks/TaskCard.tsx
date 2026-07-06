import { format, formatDistanceToNow } from "date-fns";
import { Calendar, CheckCircle2, Edit, Trash2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { getTaskPriorityColor, isTaskOverdue } from "@/components/tasks/taskUtils";

interface TaskCardProps {
  task: Task;
  variant?: "active" | "completed" | "overdue";
  showLeadLink?: boolean;
  showEditDelete?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onComplete: (params: { id: string; completed: boolean }) => void;
}

export function TaskCard({
  task,
  variant = "active",
  showLeadLink = false,
  showEditDelete = false,
  onEdit,
  onDelete,
  onComplete,
}: TaskCardProps) {
  const isCompleted = variant === "completed";
  const isOverdueVariant = variant === "overdue";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 space-y-2",
        isCompleted && "opacity-60",
        isOverdueVariant && "border-destructive/20 bg-destructive/5",
      )}
    >
      <div className="flex items-start gap-2">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
        ) : (
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) =>
              onComplete({ id: task.id, completed: checked as boolean })
            }
            className="mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                isCompleted && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </p>
            {!isCompleted && (
              isOverdueVariant ? (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/20 shrink-0 text-[10px]"
                >
                  Overdue
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={cn(getTaskPriorityColor(task.priority), "shrink-0 text-[10px]")}
                >
                  {task.priority}
                </Badge>
              )
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          {showLeadLink && task.lead_id && (
            <Link
              to={`/leads/${task.lead_id}`}
              className="text-xs text-primary hover:underline inline-block"
            >
              View Lead →
            </Link>
          )}

          {isCompleted && task.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
            </p>
          )}

          {!isCompleted && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {task.due_date && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    (isOverdueVariant || isTaskOverdue(task.due_date)) &&
                      "text-destructive font-semibold",
                  )}
                >
                  <Calendar className="h-3 w-3 shrink-0" />
                  {format(new Date(task.due_date), "MMM d")} (
                  {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })})
                </span>
              )}
              {task.assigned_profile && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{task.assigned_profile.full_name}</span>
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1 pt-0.5">
            {isCompleted ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onComplete({ id: task.id, completed: false })}
              >
                Reopen
              </Button>
            ) : (
              showEditDelete && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit?.(task)}
                    aria-label="Edit task"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => onDelete?.(task)}
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
