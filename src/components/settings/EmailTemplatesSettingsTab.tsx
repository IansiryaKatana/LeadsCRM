import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  type CreateEmailTemplateInput,
  type UpdateEmailTemplateInput,
} from "@/hooks/useEmailTemplates";
import { Mail, Plus, Edit, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TEMPLATE_CATEGORIES = [
  { value: "welcome", label: "Welcome" },
  { value: "followup_1", label: "Follow-up #1" },
  { value: "followup_2", label: "Follow-up #2" },
  { value: "followup_3", label: "Follow-up #3" },
  { value: "conversion", label: "Conversion" },
  { value: "general", label: "General" },
];

const AVAILABLE_VARIABLES = [
  { key: "{{lead_name}}", description: "Lead's full name" },
  { key: "{{room_choice}}", description: "Selected room type" },
  { key: "{{email}}", description: "Lead's email address" },
  { key: "{{phone}}", description: "Lead's phone number" },
  { key: "{{stay_duration}}", description: "Selected stay duration" },
  { key: "{{revenue}}", description: "Potential revenue" },
  { key: "{{academic_year}}", description: "Academic year" },
];

export function EmailTemplatesSettingsTab() {
  const { data: templates, isLoading } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateEmailTemplateInput>({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    category: "general",
    variables: [],
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.subject || !formData.body_html) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTemplate.mutateAsync(formData);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || "",
      category: template.category,
      variables: template.variables || [],
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTemplate || !formData.name || !formData.subject || !formData.body_html) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: UpdateEmailTemplateInput = {
        id: selectedTemplate.id,
        ...formData,
        is_active: selectedTemplate.is_active,
      };
      await updateTemplate.mutateAsync(updateData);
      setEditDialogOpen(false);
      resetForm();
      setSelectedTemplate(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteTemplate.mutateAsync(selectedTemplate.id);
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteClick = (template: any) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      body_html: "",
      body_text: "",
      category: "general",
      variables: [],
    });
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = text.matchAll(variableRegex);
    const variables = Array.from(matches, (m) => `{{${m[1]}}}`);
    return [...new Set(variables)];
  };

  const handleBodyHtmlChange = (value: string) => {
    setFormData({
      ...formData,
      body_html: value,
      variables: extractVariables(value + " " + formData.subject),
    });
  };

  const handleSubjectChange = (value: string) => {
    setFormData({
      ...formData,
      subject: value,
      variables: extractVariables(value + " " + formData.body_html),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Create and manage email templates for automated and manual communications
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Template</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Email Template</DialogTitle>
                  <DialogDescription>
                    Create a new email template for your communications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Welcome Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      placeholder="e.g., Welcome {{lead_name}}!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body_html">Email Body (HTML) *</Label>
                    <Textarea
                      id="body_html"
                      value={formData.body_html}
                      onChange={(e) => handleBodyHtmlChange(e.target.value)}
                      placeholder="<h2>Hello {{lead_name}},</h2><p>Your message here...</p>"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body_text">Email Body (Plain Text) - Optional</Label>
                    <Textarea
                      id="body_text"
                      value={formData.body_text}
                      onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                      placeholder="Plain text version of your email"
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Available Variables</Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                      {AVAILABLE_VARIABLES.map((variable) => (
                        <Badge key={variable.key} variant="outline" className="text-xs">
                          {variable.key}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Detected variables: {formData.variables?.join(", ") || "None"}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Template"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
            {!templates || templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No email templates found. Create your first template to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label ||
                            template.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(template.variables as string[])?.slice(0, 3).map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {(template.variables as string[])?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(template.variables as string[]).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(template)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
              <DialogDescription>
                Update the email template details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Template Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject *</Label>
                <Input
                  id="edit-subject"
                  value={formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  placeholder="e.g., Welcome {{lead_name}}!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-body_html">Email Body (HTML) *</Label>
                <Textarea
                  id="edit-body_html"
                  value={formData.body_html}
                  onChange={(e) => handleBodyHtmlChange(e.target.value)}
                  placeholder="<h2>Hello {{lead_name}},</h2><p>Your message here...</p>"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-body_text">Email Body (Plain Text) - Optional</Label>
                <Textarea
                  id="edit-body_text"
                  value={formData.body_text}
                  onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                  placeholder="Plain text version of your email"
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-active">Active</Label>
                  <Switch
                    id="edit-active"
                    checked={selectedTemplate?.is_active ?? true}
                    onCheckedChange={(checked) => {
                      if (selectedTemplate) {
                        setSelectedTemplate({ ...selectedTemplate, is_active: checked });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <Badge key={variable.key} variant="outline" className="text-xs">
                      {variable.key}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Detected variables: {formData.variables?.join(", ") || "None"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateTemplate.isPending}>
                {updateTemplate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Template"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteTemplate.isPending}
              >
                {deleteTemplate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

