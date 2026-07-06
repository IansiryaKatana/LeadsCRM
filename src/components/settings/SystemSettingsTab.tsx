import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSystemSettings, CURRENCY_OPTIONS, RoomPrices, RoomLabels } from "@/hooks/useSystemSettings";
import { getLatestAcademicYear } from "@/utils/academicYear";
import {
  ensureYearPricing,
  normalizeRoomPricesByYear,
  DEFAULT_ROOM_PRICES,
  type RoomPricesByYear,
} from "@/utils/roomPrices";
import { Loader2, Upload, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function SystemSettingsTab() {
  const { settings, isLoading, updateSetting } = useSystemSettings();
  const queryClient = useQueryClient();
  
  const [currency, setCurrency] = useState(settings.currency.code);
  const [roomPricesByYear, setRoomPricesByYear] = useState<RoomPricesByYear>(settings.room_prices);
  const [selectedPricingYear, setSelectedPricingYear] = useState(
    settings.default_academic_year || getLatestAcademicYear(settings.academic_years || []),
  );
  const [roomLabels, setRoomLabels] = useState<RoomLabels>(settings.room_labels);
  const [logoUrl, setLogoUrl] = useState(settings.branding.logo_url || "");
  const [faviconUrl, setFaviconUrl] = useState(settings.branding.favicon_url || "");
  const [systemName, setSystemName] = useState(settings.system_name || "Urban Hub Students Accommodations");
  const [emailFromAddress, setEmailFromAddress] = useState(settings.email_from_address || "Urban Hub <noreply@send.portal.urbanhub.uk>");
  const [emailReplyToAddress, setEmailReplyToAddress] = useState(settings.email_reply_to_address || "operations@urbanhub.uk");
  const [emailCcAddresses, setEmailCcAddresses] = useState<string[]>(settings.email_cc_addresses || ["Leads@urbanhub.uk"]);
  const [newEmailCcAddress, setNewEmailCcAddress] = useState("");
  const [notificationEmails, setNotificationEmails] = useState<string[]>(settings.notification_emails || []);
  const [newNotificationEmail, setNewNotificationEmail] = useState("");
  const [academicYears, setAcademicYears] = useState<string[]>(settings.academic_years || []);
  const [defaultAcademicYear, setDefaultAcademicYear] = useState(settings.default_academic_year || "");
  const [newYearInput, setNewYearInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrency(settings.currency.code);
    setRoomPricesByYear(settings.room_prices);
    setSelectedPricingYear(
      (current) =>
        current && settings.academic_years?.includes(current)
          ? current
          : settings.default_academic_year ||
            getLatestAcademicYear(settings.academic_years || []),
    );
    setRoomLabels(settings.room_labels);
    setLogoUrl(settings.branding.logo_url || "");
    setFaviconUrl(settings.branding.favicon_url || "");
    setSystemName(settings.system_name || "Urban Hub Students Accommodations");
    setEmailFromAddress(settings.email_from_address || "Urban Hub <noreply@send.portal.urbanhub.uk>");
    setEmailReplyToAddress(settings.email_reply_to_address || "operations@urbanhub.uk");
    setEmailCcAddresses(settings.email_cc_addresses || ["Leads@urbanhub.uk"]);
    setNotificationEmails(settings.notification_emails || []);
    setAcademicYears(settings.academic_years || []);
    setDefaultAcademicYear(settings.default_academic_year || "");
  }, [settings]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = type === 'logo' ? ['image/png', 'image/jpeg', 'image/svg+xml'] : ['image/x-icon', 'image/png', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: type === 'logo' ? "Please upload a PNG, JPEG or SVG image." : "Please upload an ICO or PNG image.",
        variant: "destructive"
      });
      return;
    }

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      if (type === 'logo') setLogoUrl(publicUrl);
      else setFaviconUrl(publicUrl);

      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully. Don't forget to save changes.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleSaveCurrency = async () => {
    setSaving(true);
    try {
      const selectedCurrency = CURRENCY_OPTIONS.find(c => c.code === currency);
      if (selectedCurrency) {
        await updateSetting.mutateAsync({ key: "currency", value: selectedCurrency });
        toast({ title: "Currency Updated", description: `Currency set to ${selectedCurrency.name}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update currency", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ 
        key: "branding", 
        value: { logo_url: logoUrl || null, favicon_url: faviconUrl || null } 
      });
      toast({ title: "Branding Updated", description: "Logo and favicon settings saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update branding", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemName = async () => {
    if (!systemName.trim()) {
      toast({ title: "Error", description: "System name cannot be empty", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ 
        key: "system_name", 
        value: systemName.trim() 
      });
      toast({ title: "System Name Updated", description: "System name saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update system name", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailFromAddress = async () => {
    if (!emailFromAddress.trim()) {
      toast({ title: "Error", description: "Email from address cannot be empty", variant: "destructive" });
      return;
    }
    // Validate format: should be "Name <email@domain.com>" or just "email@domain.com"
    const emailRegex = /^(.+?)\s*<(.+?)>$|^(.+?)$/;
    if (!emailRegex.test(emailFromAddress.trim())) {
      toast({ title: "Error", description: "Invalid email format. Use 'Name <email@domain.com>' or 'email@domain.com'", variant: "destructive" });
      return;
    }
    if (!emailReplyToAddress.trim()) {
      toast({ title: "Error", description: "Reply-to address cannot be empty", variant: "destructive" });
      return;
    }
    const replyToRegex = /^(.+?)\s*<(.+?)>$|^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!replyToRegex.test(emailReplyToAddress.trim())) {
      toast({ title: "Error", description: "Invalid reply-to format. Use 'Name <email@domain.com>' or 'email@domain.com'", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateSetting.mutateAsync({
        key: "email_from_address",
        value: emailFromAddress.trim(),
      });
      await updateSetting.mutateAsync({
        key: "email_reply_to_address",
        value: emailReplyToAddress.trim(),
      });
      await updateSetting.mutateAsync({
        key: "email_cc_addresses",
        value: emailCcAddresses,
      });
      toast({
        title: "Email Settings Updated",
        description: "From, reply-to, and CC addresses saved. Student replies will go to the reply-to address.",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update email settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmailCcAddress = () => {
    const email = newEmailCcAddress.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (emailCcAddresses.includes(email)) {
      toast({ title: "Already exists", description: "This email is already in the CC list", variant: "destructive" });
      return;
    }

    setEmailCcAddresses([...emailCcAddresses, email]);
    setNewEmailCcAddress("");
  };

  const handleRemoveEmailCcAddress = (email: string) => {
    setEmailCcAddresses(emailCcAddresses.filter((entry) => entry !== email));
  };

  const handleAddNotificationEmail = () => {
    const email = newNotificationEmail.trim().toLowerCase();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (notificationEmails.includes(email)) {
      toast({ title: "Already exists", description: "This email is already in the list", variant: "destructive" });
      return;
    }

    setNotificationEmails([...notificationEmails, email]);
    setNewNotificationEmail("");
  };

  const handleRemoveNotificationEmail = (email: string) => {
    setNotificationEmails(notificationEmails.filter(e => e !== email));
  };

  const handleSaveNotificationEmails = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ 
        key: "notification_emails", 
        value: notificationEmails 
      });
      toast({ title: "Notification Emails Updated", description: "Email list saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update notification emails", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoomPrices = async () => {
    setSaving(true);
    try {
      const normalized = normalizeRoomPricesByYear(roomPricesByYear, academicYears);
      await updateSetting.mutateAsync({ key: "room_prices", value: normalized });
      setRoomPricesByYear(normalized);

      const { data: updatedCount, error: recalcError } = await supabase.rpc(
        "recalculate_pipeline_potential_revenue",
      );
      if (recalcError) {
        console.error("Failed to recalculate lead potential revenue:", recalcError);
      } else {
        queryClient.invalidateQueries({ queryKey: ["leads"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["channel-performance"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["monthly-lead-data"], exact: false });
      }

      toast({
        title: "Room Prices Updated",
        description:
          typeof updatedCount === "number"
            ? `Room pricing saved. Updated potential revenue on ${updatedCount} leads.`
            : "Room pricing saved successfully",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update room prices", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateSelectedYearPrices = (updater: (current: RoomPrices) => RoomPrices) => {
    if (!activePricingYear) return;
    setRoomPricesByYear((prev) => {
      const current =
        prev[activePricingYear] ??
        settings.room_prices[activePricingYear] ??
        DEFAULT_ROOM_PRICES;
      return {
        ...prev,
        [activePricingYear]: updater(current),
      };
    });
  };

  const handleSaveRoomLabels = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "room_labels", value: roomLabels });
      toast({ title: "Room Labels Updated", description: "Room names saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update room labels", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAcademicYear = () => {
    const year = newYearInput.trim();
    if (!year) {
      toast({ title: "Error", description: "Please enter an academic year", variant: "destructive" });
      return;
    }
    
    // Validate format (e.g., "2024/2025")
    if (!/^\d{4}\/\d{4}$/.test(year)) {
      toast({ title: "Error", description: "Academic year must be in format YYYY/YYYY (e.g., 2024/2025)", variant: "destructive" });
      return;
    }
    
    if (academicYears.includes(year)) {
      toast({ title: "Error", description: "This academic year already exists", variant: "destructive" });
      return;
    }
    
    const updatedYears = [...academicYears, year].sort();
    setAcademicYears(updatedYears);
    setRoomPricesByYear((prev) =>
      ensureYearPricing(prev, year, getLatestAcademicYear(academicYears)),
    );
    setNewYearInput("");
    setDefaultAcademicYear(getLatestAcademicYear(updatedYears));
    if (!selectedPricingYear) {
      setSelectedPricingYear(year);
    }
  };

  const handleRemoveAcademicYear = (year: string) => {
    if (academicYears.length <= 1) {
      toast({ title: "Error", description: "You must have at least one academic year", variant: "destructive" });
      return;
    }
    
    const updatedYears = academicYears.filter(y => y !== year);
    setAcademicYears(updatedYears);
    setRoomPricesByYear((prev) => {
      const next = { ...prev };
      delete next[year];
      return next;
    });
    if (selectedPricingYear === year) {
      setSelectedPricingYear(getLatestAcademicYear(updatedYears));
    }
    
    // If removing the default year, set the first remaining year as default
    if (defaultAcademicYear === year && updatedYears.length > 0) {
      setDefaultAcademicYear(getLatestAcademicYear(updatedYears));
    }
  };

  const handleSaveAcademicYears = async () => {
    if (academicYears.length === 0) {
      toast({ title: "Error", description: "You must have at least one academic year", variant: "destructive" });
      return;
    }
    
    if (!defaultAcademicYear || !academicYears.includes(defaultAcademicYear)) {
      toast({ title: "Error", description: "Default academic year must be one of the available years", variant: "destructive" });
      return;
    }
    
    setSaving(true);
    try {
      const pricingForYears = normalizeRoomPricesByYear(roomPricesByYear, academicYears);
      await updateSetting.mutateAsync({ key: "academic_years", value: academicYears });
      await updateSetting.mutateAsync({ key: "default_academic_year", value: defaultAcademicYear });
      await updateSetting.mutateAsync({ key: "room_prices", value: pricingForYears });
      setRoomPricesByYear(pricingForYears);
      toast({ title: "Academic Years Updated", description: "Academic year settings saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update academic years", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const roomKeys: (keyof RoomPrices)[] = ["platinum", "gold", "silver", "bronze", "standard"];
  const activePricingYear =
    selectedPricingYear && academicYears.includes(selectedPricingYear)
      ? selectedPricingYear
      : defaultAcademicYear || getLatestAcademicYear(academicYears);
  const activeYearPrices =
    (activePricingYear && roomPricesByYear[activePricingYear]) ||
    roomPricesByYear[getLatestAcademicYear(academicYears)] ||
    DEFAULT_ROOM_PRICES;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Currency Settings */}
        <Card className="shadow-card flex h-full flex-col">
          <CardHeader>
            <CardTitle>
              Currency Settings
            </CardTitle>
            <CardDescription>Set the default currency for revenue display</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-0">
            <div className="flex-1 space-y-2">
              <Label>Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="mt-auto justify-start border-t border-border/60 px-5 pb-5 pt-4">
            <Button onClick={handleSaveCurrency} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Currency
            </Button>
          </CardFooter>
        </Card>

        {/* Branding Settings */}
        <Card className="shadow-card flex h-full flex-col">
          <CardHeader>
            <CardTitle>
              Branding
            </CardTitle>
            <CardDescription>Customize your system logo and favicon</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-0">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="logo-url" 
                      placeholder="https://example.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                    <input
                      type="file"
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {logoUrl && (
                  <div className="p-4 border rounded-lg bg-muted/50 overflow-hidden">
                    <img src={logoUrl} alt="Logo preview" className="max-h-16 max-w-full w-auto object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="favicon-url">Favicon URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="favicon-url" 
                      placeholder="https://example.com/favicon.ico"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                    />
                    <input
                      type="file"
                      ref={faviconInputRef}
                      className="hidden"
                      accept=".ico,.png,image/x-icon,image/png"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                    />
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploadingFavicon}
                    >
                      {uploadingFavicon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {faviconUrl && (
                  <div className="p-4 border rounded-lg bg-muted/50 overflow-hidden">
                    <img src={faviconUrl} alt="Favicon preview" className="max-h-8 max-w-full w-auto object-contain" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto justify-start border-t border-border/60 px-5 pb-5 pt-4">
            <Button onClick={handleSaveBranding} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Branding
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Lead Notifications Settings */}
        <Card className="shadow-card flex h-full flex-col">
          <CardHeader>
            <CardTitle>
              Lead Notifications
            </CardTitle>
            <CardDescription>Manage who receives email notifications when a new lead is added</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-0">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-notification-email">Add Recipient Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-notification-email"
                    placeholder="admin@example.com"
                    value={newNotificationEmail}
                    onChange={(e) => setNewNotificationEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNotificationEmail();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddNotificationEmail} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Recipients</Label>
                <div className="space-y-2">
                  {notificationEmails.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-3 border rounded-lg border-dashed">
                      No recipients configured. All admins/managers will receive notifications by default (legacy behavior).
                    </p>
                  ) : (
                    notificationEmails.map((email) => (
                      <div key={email} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <span className="text-sm font-medium">{email}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNotificationEmail(email)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto justify-start border-t border-border/60 px-5 pb-5 pt-4">
            <Button onClick={handleSaveNotificationEmails} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notification Emails
            </Button>
          </CardFooter>
        </Card>

        {/* Room Labels */}
        <Card className="shadow-card flex h-full flex-col">
          <CardHeader>
            <CardTitle>
              Room Names
            </CardTitle>
            <CardDescription>Customize display names for room types</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-0">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roomKeys.map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`label-${key}`} className="capitalize text-muted-foreground text-xs">
                    {key} Display Name
                  </Label>
                  <Input 
                    id={`label-${key}`}
                    value={roomLabels[key]}
                    onChange={(e) => setRoomLabels(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="mt-auto justify-start border-t border-border/60 px-5 pb-5 pt-4">
            <Button onClick={handleSaveRoomLabels} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Room Names
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* System name + student email settings */}
      <Card className="shadow-card flex flex-col">
        <CardHeader>
          <CardTitle>
            System & Student Email Settings
          </CardTitle>
          <CardDescription>
            System branding name and outbound student email configuration. The reply-to address is used when students click Reply.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-6 pt-0">
          <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system-name">System Name</Label>
            <Input 
              id="system-name" 
              placeholder="Urban Hub Leads CRM"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown in the sidebar navigation and login page
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="email-from-address">From Address</Label>
            <Input 
              id="email-from-address" 
              placeholder="Urban Hub CRM <noreply@send.portal.urbanhub.uk>"
              value={emailFromAddress}
              onChange={(e) => setEmailFromAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Format: "Name &lt;email@your-verified-domain.com&gt;" or just "email@your-verified-domain.com"
            </p>
            <p className="text-xs text-warning">
              Must use an email address from your verified Resend domain (e.g., send.portal.urbanhub.uk)
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="email-reply-to-address">Reply-To Address</Label>
            <Input
              id="email-reply-to-address"
              placeholder="operations@urbanhub.uk"
              value={emailReplyToAddress}
              onChange={(e) => setEmailReplyToAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              When a student clicks Reply, their email app will address replies to this inbox.
            </p>
          </div>

          <div className="space-y-3">
            <Label>CC Addresses</Label>
            <p className="text-xs text-muted-foreground">
              Internal team addresses copied on every student email (CRM sends and website confirmations).
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Add CC email address"
                value={newEmailCcAddress}
                onChange={(e) => setNewEmailCcAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEmailCcAddress();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddEmailCcAddress}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {emailCcAddresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No CC addresses configured.</p>
              ) : (
                emailCcAddresses.map((email) => (
                  <div key={email} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEmailCcAddress(email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex flex-wrap justify-start gap-2 border-t border-border/60 px-5 pb-5 pt-4">
          <Button onClick={handleSaveSystemName} disabled={saving} variant="outline">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save System Name
          </Button>
          <Button onClick={handleSaveEmailFromAddress} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Email Settings
          </Button>
        </CardFooter>
      </Card>

      {/* Room Prices */}
      <Card className="shadow-card flex flex-col">
        <CardHeader>
          <CardTitle>
            Room Pricing
          </CardTitle>
          <CardDescription>
            Configure base prices for each room type (per week) by academic year
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4 pt-0">
          <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select
              value={activePricingYear}
              onValueChange={setSelectedPricingYear}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Prices apply to leads tagged with this academic year
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`price-${key}`} className="flex items-center gap-2">
                  <span className="font-medium">{roomLabels[key]}</span>
                  <span className="text-muted-foreground text-xs">({key})</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {settings.currency.symbol}
                  </span>
                  <Input 
                    id={`price-${key}`}
                    type="number"
                    className="pl-10"
                    value={activeYearPrices?.[key] ?? 0}
                    onChange={(e) =>
                      updateSelectedYearPrices((current) => ({
                        ...current,
                        [key]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto justify-start border-t border-border/60 px-5 pb-5 pt-4">
          <Button onClick={handleSaveRoomPrices} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Prices
          </Button>
        </CardFooter>
      </Card>

      {/* Academic Years Settings */}
      <Card className="shadow-card flex flex-col">
        <CardHeader>
          <CardTitle>
            Academic Years
          </CardTitle>
          <CardDescription>Manage available academic years and set the default year for new leads</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4 pt-0">
          <div className="flex-1 space-y-4">
          <div className="space-y-3">
            <Label>Available Academic Years</Label>
            <div className="space-y-2">
              {academicYears.map((year) => (
                <div key={year} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <span className="font-medium">{year}</span>
                  <div className="flex items-center gap-3">
                    {defaultAcademicYear === year && (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                        Default
                      </span>
                    )}
                    {academicYears.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAcademicYear(year)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-year">Add Academic Year</Label>
            <div className="flex gap-2">
              <Input
                id="new-year"
                placeholder="2024/2025"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAcademicYear();
                  }
                }}
              />
              <Button type="button" onClick={handleAddAcademicYear} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Format: YYYY/YYYY (e.g., 2024/2025)</p>
          </div>

          <div className="space-y-2">
            <Label>Default Academic Year</Label>
            <Select value={defaultAcademicYear} onValueChange={setDefaultAcademicYear}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select default year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This year will be used for new leads by default</p>
          </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto justify-start border-t border-border/60 px-5 pb-5 pt-4">
          <Button onClick={handleSaveAcademicYears} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Academic Years
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}