import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSystemSettings, CURRENCY_OPTIONS, RoomPrices, RoomLabels } from "@/hooks/useSystemSettings";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Image, DollarSign, Tag, Calendar, Plus, X, Building2, Mail } from "lucide-react";

export function SystemSettingsTab() {
  const { settings, isLoading, updateSetting } = useSystemSettings();
  
  const [currency, setCurrency] = useState(settings.currency.code);
  const [roomPrices, setRoomPrices] = useState<RoomPrices>(settings.room_prices);
  const [roomLabels, setRoomLabels] = useState<RoomLabels>(settings.room_labels);
  const [logoUrl, setLogoUrl] = useState(settings.branding.logo_url || "");
  const [faviconUrl, setFaviconUrl] = useState(settings.branding.favicon_url || "");
  const [systemName, setSystemName] = useState(settings.system_name || "Urban Hub Students Accommodations");
  const [emailFromAddress, setEmailFromAddress] = useState(settings.email_from_address || "Urban Hub <noreply@send.portal.urbanhub.uk>");
  const [academicYears, setAcademicYears] = useState<string[]>(settings.academic_years || []);
  const [defaultAcademicYear, setDefaultAcademicYear] = useState(settings.default_academic_year || "");
  const [newYearInput, setNewYearInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrency(settings.currency.code);
    setRoomPrices(settings.room_prices);
    setRoomLabels(settings.room_labels);
    setLogoUrl(settings.branding.logo_url || "");
    setFaviconUrl(settings.branding.favicon_url || "");
    setSystemName(settings.system_name || "Urban Hub Students Accommodations");
    setEmailFromAddress(settings.email_from_address || "Urban Hub <noreply@send.portal.urbanhub.uk>");
    setAcademicYears(settings.academic_years || []);
    setDefaultAcademicYear(settings.default_academic_year || "");
  }, [settings]);

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
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ 
        key: "email_from_address", 
        value: emailFromAddress.trim() 
      });
      toast({ title: "Email From Address Updated", description: "Email from address saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update email from address", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoomPrices = async () => {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: "room_prices", value: roomPrices });
      toast({ title: "Room Prices Updated", description: "Room pricing saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update room prices", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
    setNewYearInput("");
    
    // If this is the first year, set it as default
    if (updatedYears.length === 1) {
      setDefaultAcademicYear(year);
    }
  };

  const handleRemoveAcademicYear = (year: string) => {
    if (academicYears.length <= 1) {
      toast({ title: "Error", description: "You must have at least one academic year", variant: "destructive" });
      return;
    }
    
    const updatedYears = academicYears.filter(y => y !== year);
    setAcademicYears(updatedYears);
    
    // If removing the default year, set the first remaining year as default
    if (defaultAcademicYear === year && updatedYears.length > 0) {
      setDefaultAcademicYear(updatedYears[0]);
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
      await updateSetting.mutateAsync({ key: "academic_years", value: academicYears });
      await updateSetting.mutateAsync({ key: "default_academic_year", value: defaultAcademicYear });
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

  return (
    <div className="space-y-6">
      {/* Currency Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Settings
          </CardTitle>
          <CardDescription>Set the default currency for revenue display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full sm:w-[300px]">
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
          <div className="flex justify-end">
            <Button onClick={handleSaveCurrency} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Currency
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Image className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>Customize your system logo and favicon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input 
                id="logo-url" 
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              {logoUrl && (
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <img src={logoUrl} alt="Logo preview" className="max-h-16 object-contain" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon-url">Favicon URL</Label>
              <Input 
                id="favicon-url" 
                placeholder="https://example.com/favicon.ico"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
              />
              {faviconUrl && (
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <img src={faviconUrl} alt="Favicon preview" className="max-h-8 object-contain" />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveBranding} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Room Labels */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Room Names
          </CardTitle>
          <CardDescription>Customize display names for room types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="flex justify-end">
            <Button onClick={handleSaveRoomLabels} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Room Names
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Name Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            System Name
          </CardTitle>
          <CardDescription>Set the name displayed in the sidebar and throughout the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-name">System Name</Label>
            <Input 
              id="system-name" 
              placeholder="Urban Hub Leads CRM"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This name appears in the sidebar navigation and login page
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveSystemName} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save System Name
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email From Address Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email From Address
          </CardTitle>
          <CardDescription>Set the email address used when sending emails from the CRM (must use your verified Resend domain)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              ⚠️ Must use an email address from your verified Resend domain (e.g., send.portal.urbanhub.uk)
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveEmailFromAddress} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Email From Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Room Prices */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Room Pricing
          </CardTitle>
          <CardDescription>Configure base prices for each room type (per week)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    value={roomPrices[key]}
                    onChange={(e) => setRoomPrices(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveRoomPrices} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Prices
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Academic Years Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Academic Years
          </CardTitle>
          <CardDescription>Manage available academic years and set the default year for new leads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="flex justify-end">
            <Button onClick={handleSaveAcademicYears} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Academic Years
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}