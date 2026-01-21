import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from "lucide-react";

const WEBHOOK_URL = "https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook";

export function WebhookIntegrationSettingsTab() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-display">Webhooks & Website Forms</CardTitle>
        <CardDescription>
          Connect your WordPress forms (WPForms, Elementor) to ISKA Leads CRM using the Supabase
          Edge Function webhook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Webhook URL</Label>
          <Input value={WEBHOOK_URL} readOnly className="font-mono text-sm" />
          <p className="text-xs text-muted-foreground">
            Use this URL as the destination for all your website forms (Request URL / Webhook URL).
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wpforms">WPForms</TabsTrigger>
            <TabsTrigger value="elementor">Elementor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ScrollArea className="h-[260px] pr-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  The <span className="font-mono">wordpress-webhook</span> edge function receives submissions
                  from your website and automatically creates leads in the CRM.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Supported forms: Web - Contact, Web - Book Viewing, Web - Schedule Callback, Web - Deposit Payment.</li>
                  <li>
                    Each form sends a <span className="font-mono">form_type</span> value so the CRM knows if it&apos;s a
                    contact, booking, callback, or deposit lead.
                  </li>
                  <li>
                    Landing page and campaign metadata are stored in the new{" "}
                    <span className="font-mono">LP / Campaign</span> column and lead notes.
                  </li>
                </ul>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="wpforms">
            <ScrollArea className="h-[260px] pr-4 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold">WPForms → Web - Book Viewing (example)</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Open your form → Settings → Webhooks.</li>
                  <li>Set <strong>Request URL</strong> to the webhook URL above.</li>
                  <li>Set <strong>Method</strong> to <span className="font-mono">POST</span> and format to <span className="font-mono">JSON</span>.</li>
                  <li>Add header: <span className="font-mono">Content-Type = application/json</span>.</li>
                  <li>
                    In <strong>Request Body</strong>, map your fields:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><span className="font-mono">full_name</span> → Name</li>
                      <li><span className="font-mono">email</span> → Email</li>
                      <li><span className="font-mono">phone</span> → Phone</li>
                      <li><span className="font-mono">studio_type</span> → Choose Studio Type</li>
                      <li><span className="font-mono">booking_datetime</span> or <span className="font-mono">preferred_date</span> → Date / Time</li>
                    </ul>
                  </li>
                  <li>
                    Add static fields using &quot;Add Custom Value&quot;:
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li><span className="font-mono">form_type</span> = <span className="font-mono">booking</span></li>
                      <li><span className="font-mono">form_name</span> = e.g. <span className="font-mono">Book a Viewing - Student Apartments LP</span></li>
                      <li><span className="font-mono">landing_page</span> = e.g. <span className="font-mono">Student_Apartments_LP</span></li>
                    </ul>
                  </li>
                </ol>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="elementor">
            <ScrollArea className="h-[260px] pr-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                <Code className="h-4 w-4" />
                <span>Elementor JSON body example (Book Viewing)</span>
              </div>
              <pre className="bg-muted rounded-md p-3 text-xs font-mono whitespace-pre-wrap">
{`{
  "full_name": "[field id=\\"name\\"]",
  "email": "[field id=\\"email\\"]",
  "phone": "[field id=\\"phone\\"]",
  "form_type": "booking",
  "form_name": "Book a Viewing - Homepage",
  "preferred_date": "[field id=\\"date\\"]",
  "preferred_time": "[field id=\\"time\\"]",
  "studio_type": "[field id=\\"studio_type\\"]",
  "landing_page": "Homepage_Book_Viewing"
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Configure this under <strong>Actions After Submit → Webhook</strong> in Elementor. Field IDs
                should match your actual form field IDs.
              </p>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

