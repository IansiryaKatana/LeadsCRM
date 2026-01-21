import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download, AlertCircle, Loader2, Calendar, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { Label } from "@/components/ui/label";
import { useBulkUploadHistory } from "@/hooks/useBulkUploadHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

interface ParsedRow {
  full_name: string;
  email: string;
  phone: string;
  source?: string;
  room_choice?: string;
  stay_duration?: string;
  lead_status?: string;
  notes?: string;
  latest_comment?: string;
  date_of_inquiry?: string;
  estimated_revenue?: number;
  landing_page?: string;
  contact_reason?: string;
  contact_message?: string;
  keyworker_length_of_stay?: string;
  keyworker_preferred_date?: string;
  referrer_full_name?: string;
  referrer_room_number?: string;
  payment_plan?: string;
  status: "valid" | "invalid" | "duplicate";
  error?: string;
}

export default function BulkUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { academicYears, defaultAcademicYear } = useSystemSettingsContext();
  const [selectedYear, setSelectedYear] = useState(defaultAcademicYear);
  const { data: uploadHistory = [], isLoading: historyLoading } = useBulkUploadHistory();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const parseCSVValue = (value: string): string => {
    // Handle quoted values and scientific notation for phone numbers
    let result = value.trim().replace(/^["']|["']$/g, "");
    // Convert scientific notation to full number string (for phone numbers)
    if (/^\d+(\.\d+)?[eE][+\-]?\d+$/.test(result)) {
      result = Number(result).toFixed(0);
    }
    return result;
  };

  const parseCSV = (text: string): ParsedRow[] => {
    // Handle BOM and normalize line endings
    const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse CSV properly handling quoted fields
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(parseCSVValue(current));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(parseCSVValue(current));
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Map headers to indices
    const getIdx = (patterns: string[]) => headers.findIndex(h => patterns.some(p => h.includes(p)));
    
    const dateIdx = getIdx(["date of inquiry", "date", "created"]);
    const nameIdx = getIdx(["customer name", "name", "full_name"]);
    const emailIdx = getIdx(["email"]);
    const phoneIdx = getIdx(["phone"]);
    const sourceIdx = getIdx(["lead source", "source"]);
    const roomIdx = getIdx(["room grade", "room choice", "room"]);
    const durationIdx = getIdx(["stay duration", "duration", "stay"]);
    const statusIdx = getIdx(["lead status", "status"]);
    const revenueIdx = getIdx(["estimated revenue", "revenue"]);
    const commentIdx = getIdx(["latest comment", "comment"]);
    const notesIdx = getIdx(["notes"]);
    const landingIdx = getIdx(["landing page", "landing_page", "lp", "campaign"]);
    const contactReasonIdx = getIdx(["contact reason", "reason for contacting", "reason"]);
    const contactMessageIdx = getIdx(["contact message", "message"]);
    const keyworkerLengthIdx = getIdx(["keyworker length of stay", "keyworker_length_of_stay", "keyworker length", "length of stay"]);
    const keyworkerDateIdx = getIdx(["keyworker preferred date", "keyworker_preferred_date", "keyworker date", "preferred date"]);
    const referrerNameIdx = getIdx(["referrer full name", "referrer_full_name", "referrer name", "referrer"]);
    const referrerRoomIdx = getIdx(["referrer room number", "referrer_room_number", "referrer room", "referrer room no"]);
    const paymentPlanIdx = getIdx(["payment plan", "payment_plan", "installment plan", "installment"]);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    
    // Placeholder emails that allow duplicates (use phone as unique identifier instead)
    const placeholderEmails = new Set([
      "noemail@gmail.com",
      "noemail@gnail.com",
      "no-email@gmail.com",
      "none@gmail.com",
      "na@gmail.com",
      "n/a@gmail.com",
    ]);

    return lines.slice(1).map(line => {
      const values = parseLine(line);
      
      const date_of_inquiry = dateIdx >= 0 ? values[dateIdx] || "" : "";
      const full_name = nameIdx >= 0 ? values[nameIdx] || "" : "";
      const email = emailIdx >= 0 ? values[emailIdx]?.toLowerCase() || "" : "";
      const phone = phoneIdx >= 0 ? values[phoneIdx] || "" : "";
      const source = sourceIdx >= 0 ? values[sourceIdx] || "" : "";
      const room_choice = roomIdx >= 0 ? values[roomIdx] || "" : "";
      const stay_duration = durationIdx >= 0 ? values[durationIdx] || "" : "";
      const lead_status = statusIdx >= 0 ? values[statusIdx] || "" : "";
      const estimated_revenue = revenueIdx >= 0 ? Number(values[revenueIdx]) || 0 : 0;
      const latest_comment = commentIdx >= 0 ? values[commentIdx] || "" : "";
      const notes = notesIdx >= 0 ? values[notesIdx] || "" : "";
      const landing_page = landingIdx >= 0 ? values[landingIdx] || "" : "";
      const contact_reason = contactReasonIdx >= 0 ? values[contactReasonIdx] || "" : "";
      const contact_message = contactMessageIdx >= 0 ? values[contactMessageIdx] || "" : "";
      const keyworker_length_of_stay = keyworkerLengthIdx >= 0 ? values[keyworkerLengthIdx] || "" : "";
      const keyworker_preferred_date = keyworkerDateIdx >= 0 ? values[keyworkerDateIdx] || "" : "";
      const referrer_full_name = referrerNameIdx >= 0 ? values[referrerNameIdx] || "" : "";
      const referrer_room_number = referrerRoomIdx >= 0 ? values[referrerRoomIdx] || "" : "";
      const payment_plan = paymentPlanIdx >= 0 ? values[paymentPlanIdx] || "" : "";

      const isPlaceholderEmail = placeholderEmails.has(email);
      let status: "valid" | "invalid" | "duplicate" = "valid";
      let error: string | undefined;

      if (!email || !emailRegex.test(email)) {
        status = "invalid";
        error = "Invalid email format";
      } else if (!isPlaceholderEmail && seenEmails.has(email)) {
        // Only check email duplicates for real emails
        status = "duplicate";
        error = "Duplicate email";
      } else if (isPlaceholderEmail && phone && phone !== "0" && seenPhones.has(phone)) {
        // For placeholder emails, check phone duplicates
        status = "duplicate";
        error = "Duplicate phone";
      }

      if (status === "valid") {
        if (!isPlaceholderEmail) seenEmails.add(email);
        if (phone && phone !== "0") seenPhones.add(phone);
      }

      return { 
        full_name, 
        email, 
        phone, 
        source, 
        room_choice, 
        stay_duration, 
        lead_status,
        estimated_revenue,
        latest_comment,
        notes,
        date_of_inquiry,
        landing_page,
        contact_reason,
        contact_message,
        keyworker_length_of_stay,
        keyworker_preferred_date,
        referrer_full_name,
        referrer_room_number,
        payment_plan,
        status, 
        error 
      };
    }).filter(row => row.email || row.full_name);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!user) return;

    setUploading(true);
    setProgress(10);

    try {
      // Create import record
      const { data: importRecord, error: importError } = await supabase
        .from("lead_imports")
        .insert({
          file_name: file?.name || "upload.csv",
          total_rows: preview.length,
          created_by: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (importError) throw importError;

      setProgress(30);

      // Filter valid rows
      const validRows = preview
        .filter(r => r.status === "valid")
        .map(r => ({
          full_name: r.full_name,
          email: r.email,
          phone: r.phone,
          source: r.source,
          room_choice: r.room_choice,
          stay_duration: r.stay_duration,
          lead_status: r.lead_status,
          notes: r.notes,
          latest_comment: r.latest_comment,
          date_of_inquiry: r.date_of_inquiry,
          estimated_revenue: r.estimated_revenue,
          landing_page: r.landing_page,
          contact_reason: r.contact_reason,
          contact_message: r.contact_message,
          keyworker_length_of_stay: r.keyworker_length_of_stay,
          keyworker_preferred_date: r.keyworker_preferred_date,
          referrer_full_name: r.referrer_full_name,
          referrer_room_number: r.referrer_room_number,
          payment_plan: r.payment_plan,
        }));

      // Call edge function for processing
      const { data, error } = await supabase.functions.invoke("process-csv-import", {
        body: {
          rows: validRows,
          importId: importRecord.id,
          userId: user.id,
          academicYear: selectedYear,
        },
      });

      setProgress(90);

      if (error) throw error;

      setProgress(100);
      setUploadComplete(true);
      setImportResults({
        success: data.successCount || 0,
        failed: data.failCount || 0,
      });

      // Invalidate all leads queries (including those filtered by academic year)
      queryClient.invalidateQueries({ queryKey: ["leads"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bulk-upload-history"] });
      
      // Force refetch the current academic year's leads
      queryClient.refetchQueries({ queryKey: ["leads", selectedYear] });

      toast({
        title: "Upload Complete",
        description: `Successfully imported ${data.successCount} leads for ${selectedYear}.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to import leads",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview([]);
    setProgress(0);
    setUploadComplete(false);
    setImportResults(null);
  };

  const downloadTemplate = () => {
    const template = `Date of Inquiry,Customer Name,Phone Number,Email Address,Lead Source,Room Grade Choice,Stay Duration,Lead Status,Estimated Revenue,Latest Comment,Notes,Landing Page,Contact Reason,Contact Message,Keyworker Length of Stay,Keyworker Preferred Date,Referrer Full Name,Referrer Room Number,Payment Plan
2025-01-15,John Smith,+447700123456,john.smith@example.com,Google Ads,Platinum Studio,51 Weeks,New,0,Interested in premium accommodation,Initial inquiry from Google search,Main_Landing_Page,,,,,,
2025-01-16,Sarah Johnson,+447700234567,sarah.j@example.com,Meta Ads,Gold Studio,45 Weeks,High Interest,0,Very engaged,Responded quickly to ad,Student_Apartments_LP,,,,,,
2025-01-17,Michael Brown,+447700345678,michael.brown@example.com,Website,Silver Studio,51 Weeks,New,0,Found us through website,Organic website visitor,Home_Page,,,,,,
2025-01-18,Emily Davis,+447700456789,emily.davis@example.com,Referral,Bronze Studio,Short Stay,New,0,Referred by friend,Word of mouth referral,Referral_Page,,,John Doe,Room 101,,
2025-01-19,David Wilson,+447700567890,david.w@example.com,WhatsApp,Standard Studio,51 Weeks,High Interest,0,Active on WhatsApp,Direct WhatsApp contact,WhatsApp_Campaign,,,,,,
2025-01-20,Lisa Anderson,+447700678901,lisa.a@example.com,Email,Gold Studio,45 Weeks,New,0,Email campaign response,Email marketing lead,Email_Campaign,,,,,,
2025-01-21,James Taylor,+447700789012,james.t@example.com,TikTok,Silver Studio,51 Weeks,New,0,TikTok video viewer,Social media lead,TikTok_Campaign,,,,,,
2025-01-22,Emma White,+447700890123,emma.white@example.com,Web - Contact Form,,,New,0,General inquiry,Contact form submission,Contact_Page,Availability Question,"I'm looking for accommodation starting in September. What options do you have?",,,,
2025-01-23,Oliver Green,+447700901234,oliver.g@example.com,Web - Book Viewing,Platinum Studio,51 Weeks,New,0,Wants to view property,Booked viewing online,Viewing_LP,,,,,,
2025-01-24,Sophie Black,+447701012345,sophie.b@example.com,Web - Schedule Callback,Gold Studio,45 Weeks,New,0,Requested callback,Callback form submission,Callback_Page,,,,,,
2025-01-25,Noah Gray,+447701123456,noah.gray@example.com,Web - Deposit Payment,Platinum Studio,51 Weeks,Converted,5000,Paid deposit,Deposit payment received,Deposit_Page,,,,,Monthly Installment
2025-01-26,Isabella Brown,+447701234567,isabella.b@example.com,Google Ads,Silver Studio,51 Weeks,High Interest,0,Very interested,Follow-up needed,Google_Ads_LP,,,,,,
2025-01-27,Lucas Martinez,+447701345678,lucas.m@example.com,Meta Ads,Bronze Studio,Short Stay,New,0,Short stay inquiry,Short-term accommodation need,Meta_Ads_LP,,,,,,
2025-01-28,Mia Rodriguez,+447701456789,mia.r@example.com,Website,Standard Studio,45 Weeks,New,0,Website inquiry,Organic search,Home_Page,,,,,,
2025-01-29,Ethan Lee,+447701567890,ethan.lee@example.com,Referral,Gold Studio,51 Weeks,High Interest,0,Referred by current student,Student referral program,Referral_Page,,,Sarah Johnson,Room 205,,
2025-01-30,Ava Thompson,+447701678901,ava.t@example.com,WhatsApp,Platinum Studio,51 Weeks,Converted,6000,Converted via WhatsApp,WhatsApp conversion,WhatsApp_Campaign,,,,,,
2025-01-31,Robert Keyworker,+447701789012,robert.k@example.com,Web - Keyworkers,,,New,0,Keyworker application,Keyworker accommodation request,Keyworker_LP,,,21 days,2025-09-01,,,
2025-02-01,Alice Keyworker,+447701890123,alice.k@example.com,Web - Keyworkers,,,New,0,Keyworker inquiry,Keyworker form submission,Keyworker_LP,,,3 weeks,2025-10-15,,,`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lead_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = preview.filter((r) => r.status === "valid").length;
  const invalidCount = preview.filter((r) => r.status === "invalid").length;
  const duplicateCount = preview.filter((r) => r.status === "duplicate").length;

  type LeadImport = Database["public"]["Tables"]["lead_imports"]["Row"];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case "processing":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Processing</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Bulk Upload</h1>
            <p className="text-muted-foreground mt-1">Import leads from CSV files</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="upload" className="gap-2 shrink-0">
              <Upload className="h-4 w-4 shrink-0" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 shrink-0">
              <History className="h-4 w-4 shrink-0" />
              History
              {uploadHistory.length > 0 && (
                <span className="ml-1 text-xs bg-background px-2 py-0.5 rounded-full shrink-0">
                  {uploadHistory.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">

        {!file ? (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">
                  Drop your CSV file here
                </h3>
                <p className="text-muted-foreground mb-2">
                  or click to browse your files
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Uploading to: <span className="font-semibold text-primary">{selectedYear}</span>
                </p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button className="cursor-pointer" asChild>
                    <span>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Select CSV File
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • {preview.length} rows • Academic Year: {selectedYear}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={resetUpload}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-card border-success/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-display font-bold">{validCount}</p>
                    <p className="text-sm text-muted-foreground">Valid rows</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border-destructive/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-display font-bold">{invalidCount}</p>
                    <p className="text-sm text-muted-foreground">Invalid rows</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border-warning/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <AlertCircle className="h-8 w-8 text-warning" />
                  <div>
                    <p className="text-2xl font-display font-bold">{duplicateCount}</p>
                    <p className="text-sm text-muted-foreground">Duplicates</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Name</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Phone</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-4">{row.full_name}</td>
                          <td className="py-3 px-4">{row.email}</td>
                          <td className="py-3 px-4">{row.phone}</td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-semibold",
                                row.status === "valid" && "bg-success/10 text-success",
                                row.status === "invalid" && "bg-destructive/10 text-destructive",
                                row.status === "duplicate" && "bg-warning/10 text-warning"
                              )}
                            >
                              {row.status === "valid" ? "Valid" : row.error}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Showing 10 of {preview.length} rows
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                {uploading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading leads...
                      </span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                ) : uploadComplete && importResults ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-success">
                      <CheckCircle className="h-6 w-6" />
                      <span className="font-semibold">
                        Successfully imported {importResults.success} leads to {selectedYear}
                        {importResults.failed > 0 && ` (${importResults.failed} failed)`}
                      </span>
                    </div>
                    <Button onClick={resetUpload}>Upload Another File</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Ready to import {validCount} valid leads to {selectedYear}
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={resetUpload}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} disabled={validCount === 0}>
                        Import {validCount} Leads
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Upload History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : uploadHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upload history yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your bulk uploads will appear here
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">File Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Total Rows</th>
                          <th className="text-left py-3 px-4 font-semibold">Success</th>
                          <th className="text-left py-3 px-4 font-semibold">Failed</th>
                          <th className="text-left py-3 px-4 font-semibold">Created</th>
                          <th className="text-left py-3 px-4 font-semibold">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadHistory.map((importRecord: LeadImport) => (
                          <tr key={importRecord.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{importRecord.file_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(importRecord.status)}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {importRecord.total_rows}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-success font-semibold">
                                {importRecord.successful_rows}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {importRecord.failed_rows > 0 ? (
                                <span className="text-destructive font-semibold">
                                  {importRecord.failed_rows}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(importRecord.created_at)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {importRecord.completed_at ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-success" />
                                  {formatDate(importRecord.completed_at)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
