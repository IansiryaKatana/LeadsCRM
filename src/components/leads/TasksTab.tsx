import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsivePanel,
  ResponsivePanelBody,
  ResponsivePanelDescription,
  ResponsivePanelFooter,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
} from "@/components/ui/responsive-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Loader2 } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useCompleteTask, useDeleteTask, type Task } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { subsectionTitleClass } from "@/lib/typography";
import { TaskListSection } from "@/components/tasks/TaskListSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TasksTabProps {
  leadId: string;
}

export function TasksTab({ leadId }: TasksTabProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    assigned_to: "",
  });

  const { data: tasks = [], isLoading } = useTasks(leadId);
  const { data: teamMembers = [] } = useTeamMembers();
  const { user } = useAuth();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleCreate = () => {
    createTask.mutate({
      lead_id: leadId,
      ...newTask,
      assigned_to: newTask.assigned_to || null,
      due_date: newTask.due_date || null,
    }, {
      onSuccess: () => {
        setNewTask({
          title: "",
          description: "",
          due_date: "",
          priority: "medium",
          assigned_to: "",
        });
        setCreateDialogOpen(false);
      },
    });
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
      priority: task.priority,
      assigned_to: task.assigned_to || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedTask) return;
    updateTask.mutate({
      id: selectedTask.id,
      ...newTask,
      assigned_to: newTask.assigned_to || null,
      due_date: newTask.due_date || null,
    }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        setSelectedTask(null);
      },
    });
  };

  const handleDelete = () => {
    if (!selectedTask) return;
    deleteTask.mutate(selectedTask.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedTask(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h3 className={subsectionTitleClass}>
            Tasks
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTasks.length} active, {completedTasks.length} completed
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      <TaskListSection
        title="Active Tasks"
        tasks={activeTasks}
        variant="active"
        showEditDelete
        onEdit={handleEdit}
        onDelete={(task) => {
          setSelectedTask(task);
          setDeleteDialogOpen(true);
        }}
        onComplete={(params) => completeTask.mutate(params)}
      />

      <TaskListSection
        title="Completed Tasks"
        tasks={completedTasks}
        variant="completed"
        onComplete={(params) => completeTask.mutate(params)}
      />

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first task to get started</p>
        </div>
      )}

      {/* Create Task */}
      <ResponsivePanel open={createDialogOpen} onOpenChange={setCreateDialogOpen} size="wide">
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>Create Task</ResponsivePanelTitle>
          <ResponsivePanelDescription>
            Create a follow-up task linked to this lead so your team can track next actions.
          </ResponsivePanelDescription>
        </ResponsivePanelHeader>
        <ResponsivePanelBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={newTask.assigned_to || "unassigned"}
                  onValueChange={(value) =>
                    setNewTask({
                      ...newTask,
                      assigned_to: value === "unassigned" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <RadioGroup
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value as "low" | "medium" | "high" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="priority-low" />
                  <Label htmlFor="priority-low" className="font-normal cursor-pointer">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="priority-medium" />
                  <Label htmlFor="priority-medium" className="font-normal cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="priority-high" />
                  <Label htmlFor="priority-high" className="font-normal cursor-pointer">High</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ResponsivePanelBody>
        <ResponsivePanelFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!newTask.title.trim() || createTask.isPending}
            className="w-full sm:w-auto"
          >
            {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </ResponsivePanelFooter>
      </ResponsivePanel>

      {/* Edit Task */}
      <ResponsivePanel open={editDialogOpen} onOpenChange={setEditDialogOpen} size="wide">
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>Edit Task</ResponsivePanelTitle>
          <ResponsivePanelDescription>
            Update task details or reassign it to another team member.
          </ResponsivePanelDescription>
        </ResponsivePanelHeader>
        <ResponsivePanelBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={newTask.assigned_to || "unassigned"}
                  onValueChange={(value) =>
                    setNewTask({
                      ...newTask,
                      assigned_to: value === "unassigned" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <RadioGroup
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value as "low" | "medium" | "high" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="edit-priority-low" />
                  <Label htmlFor="edit-priority-low" className="font-normal cursor-pointer">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="edit-priority-medium" />
                  <Label htmlFor="edit-priority-medium" className="font-normal cursor-pointer">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="edit-priority-high" />
                  <Label htmlFor="edit-priority-high" className="font-normal cursor-pointer">High</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ResponsivePanelBody>
        <ResponsivePanelFooter>
          <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!newTask.title.trim() || updateTask.isPending}
            className="w-full sm:w-auto"
          >
            {updateTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Task
          </Button>
        </ResponsivePanelFooter>
      </ResponsivePanel>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
