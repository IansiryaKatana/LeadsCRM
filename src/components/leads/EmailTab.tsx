import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { EmailHistoryList } from "@/components/leads/EmailHistoryList";
import { EmailHistoryPreviewSheet } from "@/components/leads/EmailHistoryPreviewSheet";
import { Mail, Send, Loader2, RotateCcw } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { STAY_DURATION_CONFIG } from "@/types/crm";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { cn } from "@/lib/utils";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type EmailHistory = Database["public"]["Tables"]["email_history"]["Row"];

const CUSTOM_TEMPLATE_VALUE = "__custom__";

interface EmailTabProps {
  lead: Lead;
}

export function EmailTab({ lead }: EmailTabProps) {
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();
  const { data: emailHistory, isLoading: historyLoading } = useEmailHistory(lead.id);
  const sendEmail = useSendEmail();
  const { formatCurrency, getRoomLabel } = useSystemSettingsContext();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBodyHtml, setDraftBodyHtml] = useState("");
  const [bodyEditorKey, setBodyEditorKey] = useState(0);
  const [previewEmail, setPreviewEmail] = useState<EmailHistory | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const bodyEditorRef = useRef<HTMLDivElement>(null);

  const templateNameById = useMemo(() => {
    const map: Record<string, string> = {};
    templates?.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [templates]);

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);
  const hasComposerContent = Boolean(draftSubject.trim() || draftBodyHtml.trim());
  const isCustomMode = !selectedTemplateId;

  const getPlaceholders = (): Record<string, string> => ({
    lead_name: lead.full_name,
    room_choice: getRoomLabel(lead.room_choice) || lead.room_choice,
    email: lead.email,
    phone: lead.phone || "",
    stay_duration:
      STAY_DURATION_CONFIG[lead.stay_duration as keyof typeof STAY_DURATION_CONFIG]?.label ||
      lead.stay_duration,
    revenue: formatCurrency(lead.potential_revenue || 0),
    academic_year: lead.academic_year || "",
  });

  const syncBodyEditor = (html: string) => {
    setDraftBodyHtml(html);
    setBodyEditorKey((key) => key + 1);
  };

  const applyTemplateToDraft = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;

    const placeholders = getPlaceholders();
    setDraftSubject(replaceTemplateVariables(template.subject, placeholders));
    syncBodyEditor(replaceTemplateVariables(template.body_html, placeholders));
  };

  const handleTemplateSelect = (value: string) => {
    if (value === CUSTOM_TEMPLATE_VALUE) {
      setSelectedTemplateId("");
      setDraftSubject("");
      syncBodyEditor("");
      return;
    }

    setSelectedTemplateId(value);
    applyTemplateToDraft(value);
  };

  const handleResetToTemplate = () => {
    if (selectedTemplateId) {
      applyTemplateToDraft(selectedTemplateId);
    }
  };

  const handleBodyInput = () => {
    if (bodyEditorRef.current) {
      setDraftBodyHtml(bodyEditorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = draftBodyHtml;
    }
  }, [bodyEditorKey]);

  const handleSendEmail = async () => {
    if (!lead.email) return;

    const subject = draftSubject.trim();
    const bodyHtml = (bodyEditorRef.current?.innerHTML || draftBodyHtml).trim();
    if (!subject || !bodyHtml) return;

    const placeholders = getPlaceholders();

    try {
      await sendEmail.mutateAsync({
        leadId: lead.id,
        to: lead.email,
        subject,
        bodyHtml,
        bodyText: selectedTemplate?.body_text
          ? replaceTemplateVariables(selectedTemplate.body_text, placeholders)
          : undefined,
        templateId: selectedTemplateId || undefined,
        placeholders,
      });

      setDraftSubject("");
      syncBodyEditor("");
      setSelectedTemplateId("");
    } catch {
      // Error handled by hook
    }
  };

  const canSend = Boolean(draftSubject.trim() && draftBodyHtml.trim() && lead.email);

  const handleSelectHistoryEmail = (email: EmailHistory) => {
    setPreviewEmail(email);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card rounded-2xl border-0">
        <CardHeader className="pb-2">
          <CardTitle>Send Email</CardTitle>
          <CardDescription className="font-body">
            Pick a template, then edit the message below exactly as {lead.full_name} will see
            it. Your changes apply to this send only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-select">Template</Label>
            {templatesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedTemplateId || CUSTOM_TEMPLATE_VALUE}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CUSTOM_TEMPLATE_VALUE}>Custom message</SelectItem>
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

          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
              <p className="text-xs text-muted-foreground font-body truncate">
                To: <span className="font-medium text-foreground">{lead.email || "—"}</span>
              </p>
              {selectedTemplateId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs shrink-0"
                  onClick={handleResetToTemplate}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>

            <div className="border-b px-4 py-3">
              <Label htmlFor="email-subject" className="sr-only">
                Subject
              </Label>
              <Input
                id="email-subject"
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                placeholder="Subject line..."
                className="border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0 h-auto"
              />
            </div>

            <div
              key={bodyEditorKey}
              ref={bodyEditorRef}
              role="textbox"
              aria-multiline="true"
              aria-label="Email message"
              contentEditable
              suppressContentEditableWarning
              onInput={handleBodyInput}
              data-placeholder={
                isCustomMode
                  ? "Write your message here..."
                  : "Select a template to load the message..."
              }
              className={cn(
                "min-h-[14rem] max-h-[28rem] overflow-y-auto px-4 py-4",
                "prose prose-sm max-w-none dark:prose-invert font-body",
                "outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20",
                "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
              )}
            />
          </div>

          {!hasComposerContent && (
            <p className="text-xs text-muted-foreground font-body text-center">
              Select a template to load the email, then click the message area to edit.
            </p>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground font-body">
              {selectedTemplate ? (
                <Badge variant="outline" className="text-xs font-normal">
                  Based on: {selectedTemplate.name}
                </Badge>
              ) : (
                <span>Custom message</span>
              )}
            </div>
            <Button
              onClick={handleSendEmail}
              disabled={!canSend || sendEmail.isPending}
              className="gap-2 shrink-0"
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

      <Card className="shadow-card rounded-2xl border-0">
        <CardHeader className="pb-2">
          <CardTitle>Email History</CardTitle>
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
            <EmailHistoryList
              emails={emailHistory}
              templateNameById={templateNameById}
              onSelect={handleSelectHistoryEmail}
            />
          )}
        </CardContent>
      </Card>

      <EmailHistoryPreviewSheet
        email={previewEmail}
        templateName={
          previewEmail?.template_id ? templateNameById[previewEmail.template_id] : null
        }
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
