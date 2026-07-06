import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { subsectionTitleClass } from "@/lib/typography";
import type { Task } from "@/hooks/useTasks";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskCard } from "@/components/tasks/TaskCard";

interface TaskListSectionProps {
  title?: string;
  tasks: Task[];
  variant?: "active" | "completed" | "overdue";
  showLeadLink?: boolean;
  showEditDelete?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onComplete: (params: { id: string; completed: boolean }) => void;
}

export function TaskListSection({
  title,
  tasks,
  variant = "active",
  showLeadLink = false,
  showEditDelete = false,
  onEdit,
  onDelete,
  onComplete,
}: TaskListSectionProps) {
  if (tasks.length === 0) return null;

  const isCompleted = variant === "completed";

  return (
    <div className="space-y-3">
      {title && <h4 className={subsectionTitleClass}>{title}</h4>}

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-12 pl-4" />
              <TableHead>Task</TableHead>
              {!isCompleted && (
                <>
                  <TableHead className="w-40">Due</TableHead>
                  <TableHead className="w-36">Assigned</TableHead>
                  <TableHead className="w-28">Priority</TableHead>
                </>
              )}
              {isCompleted && <TableHead colSpan={3}>Completed</TableHead>}
              <TableHead className="w-28 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                variant={variant}
                showLeadLink={showLeadLink}
                showEditDelete={showEditDelete}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            variant={variant}
            showLeadLink={showLeadLink}
            showEditDelete={showEditDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
          />
        ))}
      </div>
    </div>
  );
}
