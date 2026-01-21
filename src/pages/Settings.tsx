import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Smartphone, Settings2, Database, Users, Mail, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SystemSettingsTab } from "@/components/settings/SystemSettingsTab";
import { DataSettingsTab } from "@/components/settings/DataSettingsTab";
import { UsersSettingsTab } from "@/components/settings/UsersSettingsTab";
import { PWASettingsTab } from "@/components/settings/PWASettingsTab";
import { NotificationSettingsTab } from "@/components/settings/NotificationSettingsTab";
import { EmailTemplatesSettingsTab } from "@/components/settings/EmailTemplatesSettingsTab";
import { WebhookIntegrationSettingsTab } from "@/components/settings/WebhookIntegrationSettingsTab";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

export default function Settings() {
  const { role, isAdmin } = useAuth();

  // Only super_admin and admin can access settings
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="system" className="gap-2 shrink-0">
              <Settings2 className="h-4 w-4 shrink-0" />
              System
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 shrink-0">
              <Users className="h-4 w-4 shrink-0" />
              Users
            </TabsTrigger>
            {role === "super_admin" && (
              <TabsTrigger value="data" className="gap-2 shrink-0">
                <Database className="h-4 w-4 shrink-0" />
                Data
              </TabsTrigger>
            )}
            <TabsTrigger value="profile" className="gap-2 shrink-0">
              <User className="h-4 w-4 shrink-0" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 shrink-0">
              <Bell className="h-4 w-4 shrink-0" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="gap-2 shrink-0">
              <Mail className="h-4 w-4 shrink-0" />
              Email Templates
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2 shrink-0">
              <Link2 className="h-4 w-4 shrink-0" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 shrink-0">
              <Shield className="h-4 w-4 shrink-0" />
              Security
            </TabsTrigger>
            <TabsTrigger value="pwa" className="gap-2 shrink-0">
              <Smartphone className="h-4 w-4 shrink-0" />
              PWA
            </TabsTrigger>
          </TabsList>

          {/* System Tab */}
          <TabsContent value="system">
            <SystemSettingsTab />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UsersSettingsTab />
          </TabsContent>

          {/* Data Tab - Super Admin Only */}
          {role === "super_admin" && (
            <TabsContent value="data">
              <DataSettingsTab />
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">IK</span>
                  </div>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue="Ian Katana" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="admin@urbanhub.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue="+254 700 000 000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Super Admin" disabled />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationSettingsTab />
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email-templates">
            <EmailTemplatesSettingsTab />
          </TabsContent>

          {/* Webhooks Integration Tab */}
          <TabsContent value="webhooks">
            <WebhookIntegrationSettingsTab />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium">Active Sessions</p>
                      <p className="text-sm text-muted-foreground">
                        Manage your active sessions across devices
                      </p>
                    </div>
                    <Button variant="outline">View Sessions</Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PWA Tab */}
          <TabsContent value="pwa">
            <PWASettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}