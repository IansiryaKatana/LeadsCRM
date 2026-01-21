import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { LeadSourcesManagement } from "./LeadSourcesManagement";

export function DataSettingsTab() {
  const { role, isAdmin } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Get total leads count
  const { data: leadsCount, isLoading: countLoading } = useQuery({
    queryKey: ["total-leads-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const handleDeleteAllLeads = async () => {
    if (role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "Only super administrators can delete all leads",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all leads - super_admin can do this based on RLS
      const { error } = await supabase
        .from("leads")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // This condition is always true, so it deletes all

      if (error) throw error;

      toast({
        title: "Success",
        description: `All ${leadsCount || 0} leads have been deleted from the system`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete leads",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (role !== "super_admin") {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display">Data Management</CardTitle>
          <CardDescription>Manage system data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Restricted</AlertTitle>
            <AlertDescription>
              Only super administrators can access data management features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <LeadSourcesManagement />
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Data Management
          </CardTitle>
          <CardDescription>Dangerous operations - use with caution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Danger Zone</AlertTitle>
          <AlertDescription>
            These operations cannot be undone. Please proceed with extreme caution.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-destructive">Delete All Leads</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete all leads from the system
                </p>
                {countLoading ? (
                  <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Current total: <span className="font-semibold">{leadsCount || 0} leads</span>
                  </p>
                )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting || countLoading}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{" "}
                      <strong>{leadsCount || 0} leads</strong> from the system, including all
                      associated notes and audit trail records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllLeads}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete all leads
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

