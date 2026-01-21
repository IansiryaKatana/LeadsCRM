import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEmailTemplates,
  useSendEmail,
  useEmailHistory,
  replaceTemplateVariables,
} from "@/hooks/useEmailTemplates";
import { Mail, Send, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { ROOM_CHOICE_CONFIG, STAY_DURATION_CONFIG } from "@/types/crm";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface EmailTabProps {
  lead: Lead;
}

export function EmailTab({ lead }: EmailTabProps) {
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();
  const { data: emailHistory, isLoading: historyLoading } = useEmailHistory(lead.id);
  const sendEmail = useSendEmail();
  const { formatCurrency, getRoomLabel } = useSystemSettingsContext();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  // Prepare placeholders from lead data
  const getPlaceholders = (): Record<string, string> => {
    return {
      lead_name: lead.full_name,
      room_choice: getRoomLabel(lead.room_choice) || lead.room_choice,
      email: lead.email,
      phone: lead.phone || "",
      stay_duration: STAY_DURATION_CONFIG[lead.stay_duration as keyof typeof STAY_DURATION_CONFIG]?.label || lead.stay_duration,
      revenue: formatCurrency(lead.potential_revenue || 0),
      academic_year: lead.academic_year || "",
    };
  };

  const handleSendEmail = async () => {
    if (!lead.email) {
      return;
    }

    const placeholders = getPlaceholders();
    let subject = customSubject;
    let bodyHtml = customBody;

    if (useTemplate && selectedTemplate) {
      subject = replaceTemplateVariables(selectedTemplate.subject, placeholders);
      bodyHtml = replaceTemplateVariables(selectedTemplate.body_html, placeholders);
    }

    if (!subject || !bodyHtml) {
      return;
    }

    try {
      await sendEmail.mutateAsync({
        leadId: lead.id,
        to: lead.email,
        subject,
        bodyHtml,
        bodyText: selectedTemplate?.body_text
          ? replaceTemplateVariables(selectedTemplate.body_text, placeholders)
          : undefined,
        templateId: useTemplate ? selectedTemplateId : undefined,
        placeholders,
      });

      // Reset form
      setCustomSubject("");
      setCustomBody("");
      setSelectedTemplateId("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      const placeholders = getPlaceholders();
      setCustomSubject(replaceTemplateVariables(template.subject, placeholders));
      setCustomBody(replaceTemplateVariables(template.body_html, placeholders));
    }
  };

  const canSend = useTemplate
    ? selectedTemplateId && lead.email
    : customSubject && customBody && lead.email;

  return (
    <div className="space-y-6">
      {/* Send Email Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="use-template" className="flex items-center gap-2 cursor-pointer">
              <input
                id="use-template"
                type="checkbox"
                checked={useTemplate}
                onChange={(e) => setUseTemplate(e.target.checked)}
                className="rounded"
              />
              Use Template
            </Label>
          </div>

          {useTemplate && (
            <div className="space-y-2">
              <Label htmlFor="template-select">Select Template</Label>
              {templatesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      ?.filter((t) => t.is_active)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject *</Label>
            <Input
              id="email-subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Email subject..."
              disabled={useTemplate && selectedTemplate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Email Body (HTML) *</Label>
            <Textarea
              id="email-body"
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              placeholder="Email body..."
              rows={10}
              disabled={useTemplate && selectedTemplate}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              To: <span className="font-medium">{lead.email}</span>
            </div>
            <Button
              onClick={handleSendEmail}
              disabled={!canSend || sendEmail.isPending}
              className="gap-2"
            >
              {sendEmail.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email History Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !emailHistory || emailHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No emails sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emailHistory.map((email) => (
                <div
                  key={email.id}
                  className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{email.subject}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        To: {email.sent_to}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                    {email.template_id && (
                      <Badge variant="outline" className="text-xs">
                        Template
                      </Badge>
                    )}
                  </div>
                  {email.opened_at && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Opened {formatDistanceToNow(new Date(email.opened_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

