import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Smartphone, CheckCircle2, Download } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function PWASettingsTab() {
  const { isInstalled, isInstallable, installPWA } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    const result = await installPWA();
    setIsInstalling(false);

    if (result.success) {
      toast({
        title: "Installation Started",
        description: "The app is being installed on your device",
      });
    } else {
      toast({
        title: "Installation Unavailable",
        description: result.error || "Install prompt is not available. You may need to use your browser's menu to install.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display">Install App</CardTitle>
        <CardDescription>
          Install ISKA Leads CRM as a Progressive Web App
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isInstalled ? (
          <div className="p-6 rounded-2xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-4 mb-4">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <div>
                <h3 className="font-display text-xl font-bold text-success">
                  App Installed
                </h3>
                <p className="text-muted-foreground">
                  ISKA Leads CRM is installed on your device
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <div className="flex items-center gap-4 mb-4">
              <Smartphone className="h-12 w-12" />
              <div>
                <h3 className="font-display text-xl font-bold">
                  Get the Mobile Experience
                </h3>
                <p className="opacity-80">
                  Access your CRM from anywhere, even offline
                </p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 opacity-90">
              <li className="flex items-center gap-2">
                ✓ Works offline with cached data
              </li>
              <li className="flex items-center gap-2">
                ✓ Push notifications for lead updates
              </li>
              <li className="flex items-center gap-2">
                ✓ Fast loading with app-like experience
              </li>
              <li className="flex items-center gap-2">
                ✓ Add to home screen
              </li>
            </ul>
            {isInstallable ? (
              <Button 
                variant="secondary" 
                className="w-full sm:w-auto"
                onClick={handleInstall}
                disabled={isInstalling}
              >
                <Download className="mr-2 h-4 w-4" />
                {isInstalling ? "Installing..." : "Install ISKA Leads CRM"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="secondary" className="w-full sm:w-auto" disabled>
                  Install Not Available
                </Button>
                <p className="text-xs opacity-75">
                  To install: Use your browser menu (Chrome: ⋮ → Install app, Safari: Share → Add to Home Screen)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-semibold">Offline Settings</h4>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium">Cache Lead Data</p>
              <p className="text-sm text-muted-foreground">
                Store recent leads for offline access
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium">Auto-sync Notes</p>
              <p className="text-sm text-muted-foreground">
                Sync notes when connection is restored
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

