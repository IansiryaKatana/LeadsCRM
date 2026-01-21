import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type EmailTemplate = Database["public"]["Tables"]["email_templates"]["Row"];
type EmailHistory = Database["public"]["Tables"]["email_history"]["Row"];

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  category: string;
  variables?: string[];
}

export interface UpdateEmailTemplateInput {
  id: string;
  name?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  category?: string;
  is_active?: boolean;
  variables?: string[];
}

export interface SendEmailInput {
  leadId: string;
  templateId?: string;
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export function useEmailTemplates(category?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email-templates", category],
    queryFn: async (): Promise<EmailTemplate[]> => {
      let query = supabase
        .from("email_templates")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching email templates:", error);
        throw error;
      }

      return (data || []) as EmailTemplate[];
    },
    enabled: !!user,
  });
}

export function useEmailHistory(leadId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email-history", leadId],
    queryFn: async (): Promise<EmailHistory[]> => {
      const { data, error } = await supabase
        .from("email_history")
        .select("*")
        .eq("lead_id", leadId)
        .order("sent_at", { ascending: false });

      if (error) {
        console.error("Error fetching email history:", error);
        throw error;
      }

      return (data || []) as EmailHistory[];
    },
    enabled: !!user && !!leadId,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEmailTemplateInput) => {
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          ...input,
          variables: input.variables || [],
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Template Created",
        description: "Email template has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email template",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEmailTemplateInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("email_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email template",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email template",
        variant: "destructive",
      });
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SendEmailInput & { templateId?: string; placeholders?: Record<string, string> }) => {
      // Call edge function to send email
      const { data: edgeFunctionData, error: edgeError } = await supabase.functions.invoke(
        "send-notification",
        {
          body: {
            type: "email",
            to: input.to,
            subject: input.subject,
            bodyHtml: input.bodyHtml,
            bodyText: input.bodyText,
            templateId: input.templateId,
            placeholders: input.placeholders,
          },
        }
      );

      if (edgeError) throw edgeError;

      // Save to email history
      const { data, error } = await supabase
        .from("email_history")
        .insert({
          lead_id: input.leadId,
          template_id: input.templateId || null,
          sent_to: input.to,
          subject: input.subject,
          body_html: input.bodyHtml,
          sent_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving email history:", error);
        // Don't throw - email was sent, just history save failed
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["email-history", variables.leadId] });
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });
}

// Helper function to replace template variables
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, String(value));
  });
  return result;
}

