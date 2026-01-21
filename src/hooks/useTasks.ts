import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  completed: boolean;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string };
  assigned_profile?: { full_name: string };
}

export interface CreateTaskInput {
  lead_id?: string | null;
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: "low" | "medium" | "high";
  assigned_to?: string | null;
}

export function useTasks(leadId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", leadId],
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsLast: true })
        .order("created_at", { ascending: false });

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data: tasksData, error: tasksError } = await query;

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        throw tasksError;
      }

      if (!tasksData || tasksData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      tasksData.forEach(task => {
        if (task.created_by) userIds.add(task.created_by);
        if (task.assigned_to) userIds.add(task.assigned_to);
      });

      // Fetch profiles
      const profilesMap = new Map<string, { full_name: string }>();
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(userIds));

        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, { full_name: profile.full_name });
          });
        }
      }

      // Merge profiles with tasks
      return tasksData.map(task => ({
        ...task,
        profiles: task.created_by ? profilesMap.get(task.created_by) : undefined,
        assigned_profile: task.assigned_to ? profilesMap.get(task.assigned_to) : undefined,
      }));
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useMyTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-tasks"],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];

      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", user.id)
        .eq("completed", false)
        .order("due_date", { ascending: true, nullsLast: true })
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("Error fetching my tasks:", tasksError);
        throw tasksError;
      }

      if (!tasksData || tasksData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      tasksData.forEach(task => {
        if (task.created_by) userIds.add(task.created_by);
        if (task.assigned_to) userIds.add(task.assigned_to);
      });

      // Fetch profiles
      const profilesMap = new Map<string, { full_name: string }>();
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", Array.from(userIds));

        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap.set(profile.user_id, { full_name: profile.full_name });
          });
        }
      }

      return tasksData.map(task => ({
        ...task,
        profiles: task.created_by ? profilesMap.get(task.created_by) : undefined,
        assigned_profile: task.assigned_to ? profilesMap.get(task.assigned_to) : undefined,
      }));
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...input,
          created_by: user?.id,
          priority: input.priority || "medium",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (variables.lead_id) {
        await queryClient.invalidateQueries({ queryKey: ["tasks", variables.lead_id] });
      }
      await queryClient.invalidateQueries({ queryKey: ["my-tasks"] });

      toast({ title: "Task created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (data.lead_id) {
        await queryClient.invalidateQueries({ queryKey: ["tasks", data.lead_id] });
      }
      await queryClient.invalidateQueries({ queryKey: ["my-tasks"] });

      toast({ title: "Task updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (data.lead_id) {
        await queryClient.invalidateQueries({ queryKey: ["tasks", data.lead_id] });
      }
      await queryClient.invalidateQueries({ queryKey: ["my-tasks"] });

      toast({ 
        title: data.completed ? "Task completed" : "Task reopened",
      });
    },
    onError: (error) => {
      toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["my-tasks"] });

      toast({ title: "Task deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
    },
  });
}
