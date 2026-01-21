import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLeadSources, useCreateLeadSource, useUpdateLeadSource, useDeleteLeadSource, type LeadSource } from "@/hooks/useLeadSources";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Tag } from "lucide-react";
import { getSourceIcon } from "@/utils/sourceIcons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function LeadSourcesManagement() {
  const { role } = useAuth();
  const { data: sources = [], isLoading } = useLeadSources(role === "super_admin");
  const createSource = useCreateLeadSource();
  const updateSource = useUpdateLeadSource();
  const deleteSource = useDeleteLeadSource();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<LeadSource | null>(null);
  
  const [newSourceData, setNewSourceData] = useState({
    name: "",
    slug: "",
    icon: "📋",
    color: "#6366f1",
    display_order: 0,
  });

  const [editSourceData, setEditSourceData] = useState({
    name: "",
    slug: "",
    icon: "📋",
    color: "#6366f1",
    is_active: true,
    display_order: 0,
  });

  // Get lead counts for each source
  const { data: sourceCounts } = useQuery({
    queryKey: ["source-lead-counts"],
    queryFn: async () => {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("source");
      
      if (error) throw error;
      
      const counts = new Map<string, number>();
      leads?.forEach(lead => {
        counts.set(lead.source, (counts.get(lead.source) || 0) + 1);
      });
      
      return counts;
    },
  });

  const handleCreateSource = async () => {
    if (!newSourceData.name.trim() || !newSourceData.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }

    // Auto-generate slug from name if not provided
    const slug = newSourceData.slug.trim() || newSourceData.name.toLowerCase().replace(/\s+/g, "_");

    await createSource.mutateAsync({
      ...newSourceData,
      slug,
      is_active: true,
    });

    setNewSourceData({ name: "", slug: "", icon: "📋", color: "#6366f1", display_order: 0 });
    setCreateDialogOpen(false);
  };

  const handleEditSource = (source: LeadSource) => {
    setSelectedSource(source);
    setEditSourceData({
      name: source.name,
      slug: source.slug,
      icon: source.icon,
      color: source.color,
      is_active: source.is_active,
      display_order: source.display_order,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSource = async () => {
    if (!selectedSource) return;

    await updateSource.mutateAsync({
      id: selectedSource.id,
      ...editSourceData,
    });

    setEditDialogOpen(false);
    setSelectedSource(null);
  };

  const handleDeleteSource = async (id: string) => {
    await deleteSource.mutateAsync(id);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Lead Sources Management
            </CardTitle>
            <CardDescription>
              Add, edit, or remove lead source categories
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Lead Source</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newSourceData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewSourceData({
                        ...newSourceData,
                        name,
                        slug: newSourceData.slug || generateSlug(name),
                      });
                    }}
                    placeholder="e.g., Instagram Ads"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL-friendly identifier)</Label>
                  <Input
                    value={newSourceData.slug}
                    onChange={(e) => setNewSourceData({ ...newSourceData, slug: e.target.value })}
                    placeholder="e.g., instagram_ads"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from name if left empty
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon (Emoji)</Label>
                    <Input
                      value={newSourceData.icon}
                      onChange={(e) => setNewSourceData({ ...newSourceData, icon: e.target.value })}
                      placeholder="📱"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={newSourceData.color}
                        onChange={(e) => setNewSourceData({ ...newSourceData, color: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={newSourceData.color}
                        onChange={(e) => setNewSourceData({ ...newSourceData, color: e.target.value })}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={newSourceData.display_order}
                    onChange={(e) => setNewSourceData({ ...newSourceData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateSource}
                    disabled={createSource.isPending || !newSourceData.name.trim()}
                  >
                    {createSource.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Source
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {sources.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sources found</p>
            ) : (
              sources.map((source) => {
                const leadCount = sourceCounts?.get(source.slug) || 0;
                return (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      !source.is_active ? "opacity-60 bg-muted/30" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {(() => {
                        const IconComponent = getSourceIcon(source.slug);
                        return (
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${source.color}20`, color: source.color }}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>
                        );
                      })()}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{source.name}</p>
                          {!source.is_active && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{source.slug}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {leadCount} {leadCount === 1 ? "lead" : "leads"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSource(source)}
                        className="flex items-center justify-center p-2 h-auto sm:px-4 sm:py-2"
                      >
                        <Edit className="h-4 w-4 shrink-0 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive flex items-center justify-center p-2 h-auto sm:px-4 sm:py-2"
                            disabled={leadCount > 0 && source.is_active}
                          >
                            <Trash2 className="h-4 w-4 shrink-0 sm:mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Lead Source</AlertDialogTitle>
                            <AlertDialogDescription>
                              {leadCount > 0 ? (
                                <>
                                  This source is being used by <strong>{leadCount} {leadCount === 1 ? "lead" : "leads"}</strong>.
                                  It will be deactivated instead of deleted. You can reactivate it later if needed.
                                </>
                              ) : (
                                <>
                                  Are you sure you want to delete <strong>{source.name}</strong>? This action cannot be undone.
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSource(source.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {leadCount > 0 ? "Deactivate" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead Source</DialogTitle>
          </DialogHeader>
          {selectedSource && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editSourceData.name}
                  onChange={(e) => setEditSourceData({ ...editSourceData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={editSourceData.slug}
                  onChange={(e) => setEditSourceData({ ...editSourceData, slug: e.target.value })}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon (Emoji)</Label>
                  <Input
                    value={editSourceData.icon}
                    onChange={(e) => setEditSourceData({ ...editSourceData, icon: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editSourceData.color}
                      onChange={(e) => setEditSourceData({ ...editSourceData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={editSourceData.color}
                      onChange={(e) => setEditSourceData({ ...editSourceData, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={editSourceData.display_order}
                  onChange={(e) => setEditSourceData({ ...editSourceData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editSourceData.is_active}
                  onChange={(e) => setEditSourceData({ ...editSourceData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active (visible in dropdowns and navigation)
                </Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpdateSource}
                  disabled={updateSource.isPending}
                >
                  {updateSource.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Source
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

