import { useEffect, useState } from "react";
import {
  ResponsivePanel,
  ResponsivePanelBody,
  ResponsivePanelDescription,
  ResponsivePanelFooter,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
} from "@/components/ui/responsive-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConvertLeadPanelProps {
  open: boolean;
  onClose: () => void;
  defaultRevenue: number;
  formatCurrency: (amount: number) => string;
  onConfirm: (revenue: number) => void;
  isPending?: boolean;
}

export function ConvertLeadPanel({
  open,
  onClose,
  defaultRevenue,
  formatCurrency,
  onConfirm,
  isPending = false,
}: ConvertLeadPanelProps) {
  const [convertRevenue, setConvertRevenue] = useState("");

  useEffect(() => {
    if (open) {
      setConvertRevenue(String(defaultRevenue));
    }
  }, [open, defaultRevenue]);

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  const handleConfirm = () => {
    const parsedRevenue = parseFloat(convertRevenue);
    if (!Number.isFinite(parsedRevenue) || parsedRevenue < 0) {
      toast({
        title: "Invalid revenue",
        description: "Enter a valid converted revenue amount.",
        variant: "destructive",
      });
      return;
    }

    onConfirm(parsedRevenue);
  };

  return (
    <ResponsivePanel open={open} onOpenChange={handleOpenChange}>
      <ResponsivePanelHeader>
        <ResponsivePanelTitle>Convert Lead</ResponsivePanelTitle>
        <ResponsivePanelDescription>
          Confirm the final revenue for this conversion. Adjust the amount if a discount was offered.
        </ResponsivePanelDescription>
      </ResponsivePanelHeader>

      <ResponsivePanelBody>
        <div className="space-y-2">
          <Label htmlFor="convert-revenue">Converted revenue</Label>
          <Input
            id="convert-revenue"
            type="number"
            min="0"
            step="0.01"
            value={convertRevenue}
            onChange={(e) => setConvertRevenue(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Auto-calculated amount: {formatCurrency(defaultRevenue)}
          </p>
        </div>
      </ResponsivePanelBody>

      <ResponsivePanelFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Convert Lead
        </Button>
      </ResponsivePanelFooter>
    </ResponsivePanel>
  );
}
