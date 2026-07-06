import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { pageTitleClass, subsectionTitleClass } from "@/lib/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTasks, useTasks, useCompleteTask, type Task } from "@/hooks/useTasks";
import { CheckCircle2 } from "lucide-react";
import { TaskListSection } from "@/components/tasks/TaskListSection";

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

  const renderTaskGroups = (tasks: Task[], showLeadLink: boolean) => {
    const { todayTasks, tomorrowTasks, thisWeekTasks, laterTasks, noDateTasks } = groupTasksByDate(tasks);

    return (
      <>
        <TaskListSection
          title="Today"
          tasks={todayTasks}
          showLeadLink={showLeadLink}
          onComplete={(params) => completeTask.mutate(params)}
        />
        <TaskListSection
          title="Tomorrow"
          tasks={tomorrowTasks}
          showLeadLink={showLeadLink}
          onComplete={(params) => completeTask.mutate(params)}
        />
        <TaskListSection
          title="This Week"
          tasks={thisWeekTasks}
          showLeadLink={showLeadLink}
          onComplete={(params) => completeTask.mutate(params)}
        />
        <TaskListSection
          title="Later"
          tasks={laterTasks}
          showLeadLink={showLeadLink}
          onComplete={(params) => completeTask.mutate(params)}
        />
        <TaskListSection
          title="No Due Date"
          tasks={noDateTasks}
          showLeadLink={showLeadLink}
          onComplete={(params) => completeTask.mutate(params)}
        />
      </>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={pageTitleClass}>Tasks</h1>
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
                {renderTaskGroups(myActiveTasks, true)}
                {myCompletedTasks.length > 0 && (
                  <div className="pt-6 border-t">
                    <TaskListSection
                      title="Completed"
                      tasks={myCompletedTasks}
                      variant="completed"
                      showLeadLink
                      onComplete={(params) => completeTask.mutate(params)}
                    />
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
                {renderTaskGroups(allActiveTasks, true)}
                {allCompletedTasks.length > 0 && (
                  <div className="pt-6 border-t">
                    <TaskListSection
                      title="Completed"
                      tasks={allCompletedTasks.slice(0, 10)}
                      variant="completed"
                      showLeadLink
                      onComplete={(params) => completeTask.mutate(params)}
                    />
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
              <TaskListSection
                tasks={overdueTasks}
                variant="overdue"
                showLeadLink
                onComplete={(params) => completeTask.mutate(params)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
