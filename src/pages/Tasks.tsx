import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTasks, useTasks, useCompleteTask, type Task } from "@/hooks/useTasks";
import { formatDistanceToNow, format } from "date-fns";
import { Calendar, User, CheckCircle2, Circle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("my-tasks");
  const { data: myTasks = [], isLoading: myTasksLoading } = useMyTasks();
  const { data: allTasks = [], isLoading: allTasksLoading } = useTasks();
  const completeTask = useCompleteTask();

  const myActiveTasks = myTasks.filter(t => !t.completed);
  const myCompletedTasks = myTasks.filter(t => t.completed);
  const allActiveTasks = allTasks.filter(t => !t.completed);
  const allCompletedTasks = allTasks.filter(t => t.completed);

  const overdueTasks = allActiveTasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && new Date(t.due_date).toDateString() !== new Date().toDateString();
  });

  const getPriorityColor = (priority: string) => {
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
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todayTasks: Task[] = [];
    const tomorrowTasks: Task[] = [];
    const thisWeekTasks: Task[] = [];
    const laterTasks: Task[] = [];
    const noDateTasks: Task[] = [];

    tasks.forEach(task => {
      if (!task.due_date) {
        noDateTasks.push(task);
        return;
      }
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        tomorrowTasks.push(task);
      } else if (dueDate >= tomorrow && dueDate <= nextWeek) {
        thisWeekTasks.push(task);
      } else {
        laterTasks.push(task);
      }
    });

    return { todayTasks, tomorrowTasks, thisWeekTasks, laterTasks, noDateTasks };
  };

  const renderTaskGroup = (title: string, tasks: Task[], emptyMessage: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) =>
                  completeTask.mutate({ id: task.id, completed: checked as boolean })
                }
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    {task.lead_id && (
                      <Link
                        to={`/leads/${task.lead_id}`}
                        className="text-sm text-primary hover:underline mt-1 inline-block"
                      >
                        View Lead →
                      </Link>
                    )}
                  </div>
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className={cn(isOverdue(task.due_date) && "text-destructive font-semibold")}>
                        {format(new Date(task.due_date), "MMM d, yyyy")} ({formatDistanceToNow(new Date(task.due_date), { addSuffix: true })})
                      </span>
                    </div>
                  )}
                  {task.assigned_profile && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{task.assigned_profile.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your tasks
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="mt-6 space-y-6">
            {myTasksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : myActiveTasks.length === 0 && myCompletedTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No tasks assigned to you</p>
              </div>
            ) : (
              <>
                {(() => {
                  const { todayTasks, tomorrowTasks, thisWeekTasks, laterTasks, noDateTasks } = groupTasksByDate(myActiveTasks);
                  return (
                    <>
                      {renderTaskGroup("Today", todayTasks, "")}
                      {renderTaskGroup("Tomorrow", tomorrowTasks, "")}
                      {renderTaskGroup("This Week", thisWeekTasks, "")}
                      {renderTaskGroup("Later", laterTasks, "")}
                      {renderTaskGroup("No Due Date", noDateTasks, "")}
                    </>
                  );
                })()}
                {myCompletedTasks.length > 0 && (
                  <div className="space-y-3 pt-6 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                    {myCompletedTasks.map((task) => (
                      <Card key={task.id} className="p-4 opacity-60">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success mt-1" />
                          <div className="flex-1">
                            <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                            {task.completed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => completeTask.mutate({ id: task.id, completed: false })}
                          >
                            Reopen
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="all-tasks" className="mt-6 space-y-6">
            {allTasksLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : allActiveTasks.length === 0 && allCompletedTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No tasks in the system</p>
              </div>
            ) : (
              <>
                {(() => {
                  const { todayTasks, tomorrowTasks, thisWeekTasks, laterTasks, noDateTasks } = groupTasksByDate(allActiveTasks);
                  return (
                    <>
                      {renderTaskGroup("Today", todayTasks, "")}
                      {renderTaskGroup("Tomorrow", tomorrowTasks, "")}
                      {renderTaskGroup("This Week", thisWeekTasks, "")}
                      {renderTaskGroup("Later", laterTasks, "")}
                      {renderTaskGroup("No Due Date", noDateTasks, "")}
                    </>
                  );
                })()}
                {allCompletedTasks.length > 0 && (
                  <div className="space-y-3 pt-6 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                    {allCompletedTasks.slice(0, 10).map((task) => (
                      <Card key={task.id} className="p-4 opacity-60">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success mt-1" />
                          <div className="flex-1">
                            <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                            {task.completed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="mt-6 space-y-6">
            {overdueTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-success/50 mb-2" />
                <p className="text-muted-foreground">No overdue tasks</p>
                <p className="text-sm text-muted-foreground mt-1">Great job staying on top of your tasks!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <Card key={task.id} className="p-4 border-destructive/20 bg-destructive/5">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) =>
                          completeTask.mutate({ id: task.id, completed: checked as boolean })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            {task.lead_id && (
                              <Link
                                to={`/leads/${task.lead_id}`}
                                className="text-sm text-primary hover:underline mt-1 inline-block"
                              >
                                View Lead →
                              </Link>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            Overdue
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-destructive font-semibold">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Due: {format(new Date(task.due_date), "MMM d, yyyy")} ({formatDistanceToNow(new Date(task.due_date), { addSuffix: true })})
                              </span>
                            </div>
                          )}
                          {task.assigned_profile && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assigned_profile.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
