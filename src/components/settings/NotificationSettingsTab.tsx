import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotifications";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export function NotificationSettingsTab() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [localPreferences, setLocalPreferences] = useState<any>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    } else if (!isLoading) {
      // Initialize with defaults if no preferences exist
      setLocalPreferences({
        new_lead_assigned: true,
        followup_reminder: true,
        followup_overdue: true,
        lead_converted: true,
        lead_status_changed: true,
        hot_lead_update: true,
        exception_requested: true,
        exception_approved: true,
        exception_rejected: true,
        daily_summary: false,
        email_enabled: true,
        push_enabled: true,
      });
    }
  }, [preferences, isLoading]);

  const handleToggle = (key: string, value: boolean) => {
    if (!localPreferences) return;
    setLocalPreferences({ ...localPreferences, [key]: value });
  };

  const handleSave = async () => {
    if (!localPreferences) return;

    try {
      await updatePreferences.mutateAsync(localPreferences);
      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!localPreferences) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  const notificationTypes = [
    {
      key: "new_lead_assigned",
      label: "New Lead Assigned",
      description: "Get notified when a new lead is assigned to you",
    },
    {
      key: "followup_reminder",
      label: "Follow-Up Reminders",
      description: "Notifications for scheduled follow-ups",
    },
    {
      key: "followup_overdue",
      label: "Overdue Follow-Ups",
      description: "Alerts for leads with overdue follow-ups",
    },
    {
      key: "lead_converted",
      label: "Lead Converted",
      description: "Celebrate when a lead converts to a booking",
    },
    {
      key: "lead_status_changed",
      label: "Status Changes",
      description: "Notifications when lead status is updated",
    },
    {
      key: "hot_lead_update",
      label: "Hot Lead Updates",
      description: "Notifications for high-priority lead activities",
    },
    {
      key: "exception_requested",
      label: "Exception Requests",
      description: "Notifications when exception requests are submitted",
    },
    {
      key: "exception_approved",
      label: "Exception Approved",
      description: "Notifications when your exception request is approved",
    },
    {
      key: "exception_rejected",
      label: "Exception Rejected",
      description: "Notifications when your exception request is rejected",
    },
    {
      key: "daily_summary",
      label: "Daily Summary",
      description: "Receive a daily recap of your lead activities",
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display">Notification Preferences</CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Notification Types</h3>
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
            >
              <div className="flex-1">
                <Label htmlFor={type.key} className="font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
              </div>
              <Switch
                id={type.key}
                checked={localPreferences[type.key] || false}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Delivery Methods</h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex-1">
              <Label htmlFor="email_enabled" className="font-medium cursor-pointer">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email_enabled"
              checked={localPreferences.email_enabled || false}
              onCheckedChange={(checked) => handleToggle("email_enabled", checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex-1">
              <Label htmlFor="push_enabled" className="font-medium cursor-pointer">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Enable push notifications on this device
              </p>
            </div>
            <Switch
              id="push_enabled"
              checked={localPreferences.push_enabled || false}
              onCheckedChange={(checked) => handleToggle("push_enabled", checked)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={updatePreferences.isPending}>
            {updatePreferences.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

