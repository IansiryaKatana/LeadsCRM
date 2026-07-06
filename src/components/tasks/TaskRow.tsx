import { format, formatDistanceToNow } from "date-fns";
import { Calendar, CheckCircle2, Edit, Trash2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import {
  getTaskPriorityColor,
  getTaskRowClassName,
  isTaskOverdue,
} from "@/components/tasks/taskUtils";

interface TaskRowProps {
  task: Task;
  variant?: "active" | "completed" | "overdue";
  showLeadLink?: boolean;
  showEditDelete?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onComplete: (params: { id: string; completed: boolean }) => void;
}

export function TaskRow({
  task,
  variant = "active",
  showLeadLink = false,
  showEditDelete = false,
  onEdit,
  onDelete,
  onComplete,
}: TaskRowProps) {
  const isCompleted = variant === "completed";
  const isOverdueVariant = variant === "overdue";

  return (
    <TableRow className={getTaskRowClassName(variant)}>
      <TableCell className="w-12 py-3 pl-4 pr-0">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        ) : (
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) =>
              onComplete({ id: task.id, completed: checked as boolean })
            }
          />
        )}
      </TableCell>

      <TableCell className="py-3 min-w-[200px]">
        <div className="min-w-0">
          <p
            className={cn(
              "font-medium truncate",
              isCompleted && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {task.description}
            </p>
          )}
          {showLeadLink && task.lead_id && (
            <Link
              to={`/leads/${task.lead_id}`}
              className="text-sm text-primary hover:underline mt-0.5 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              View Lead →
            </Link>
          )}
        </div>
      </TableCell>

      {!isCompleted && (
        <>
          <TableCell className="w-40 py-3 text-sm whitespace-nowrap">
            {task.due_date ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  (isOverdueVariant || isTaskOverdue(task.due_date)) &&
                    "text-destructive font-semibold",
                  !isOverdueVariant && !isTaskOverdue(task.due_date) && "text-muted-foreground",
                )}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {format(new Date(task.due_date), "MMM d, yyyy")}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>

          <TableCell className="w-36 py-3 text-sm text-muted-foreground truncate">
            {task.assigned_profile ? (
              <span className="inline-flex items-center gap-1 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{task.assigned_profile.full_name}</span>
              </span>
            ) : (
              "—"
            )}
          </TableCell>

          <TableCell className="w-28 py-3">
            {isOverdueVariant ? (
              <Badge
                variant="outline"
                className="bg-destructive/10 text-destructive border-destructive/20"
              >
                Overdue
              </Badge>
            ) : (
              <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            )}
          </TableCell>
        </>
      )}

      {isCompleted && (
        <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap" colSpan={3}>
          {task.completed_at
            ? `Completed ${formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}`
            : "—"}
        </TableCell>
      )}

      <TableCell className="w-28 py-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          {isCompleted ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => onComplete({ id: task.id, completed: false })}
            >
              Reopen
            </Button>
          ) : (
            showEditDelete && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit?.(task)}
                  aria-label="Edit task"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete?.(task)}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
