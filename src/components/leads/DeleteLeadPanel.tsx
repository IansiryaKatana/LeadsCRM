import {
  ResponsivePanel,
  ResponsivePanelBody,
  ResponsivePanelDescription,
  ResponsivePanelFooter,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
} from "@/components/ui/responsive-panel";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteLeadPanelProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leadName: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  isPending?: boolean;
}

export function DeleteLeadPanel({
  open,
  onClose,
  onConfirm,
  leadName,
  title = "Delete Lead",
  description,
  confirmLabel = "Delete Lead",
  isPending = false,
}: DeleteLeadPanelProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  return (
    <ResponsivePanel open={open} onOpenChange={handleOpenChange}>
      <ResponsivePanelHeader>
        <ResponsivePanelTitle>{title}</ResponsivePanelTitle>
        <ResponsivePanelDescription>
          {description ?? (
            <>
              Are you sure you want to delete <strong>{leadName}</strong>? This action cannot be undone
              and will permanently remove this lead and all associated data.
            </>
          )}
        </ResponsivePanelDescription>
      </ResponsivePanelHeader>

      <ResponsivePanelBody>
        <p className="text-sm text-muted-foreground">
          This will remove follow-ups, notes, tasks, emails, and audit history linked to this lead.
        </p>
      </ResponsivePanelBody>

      <ResponsivePanelFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {confirmLabel}
        </Button>
      </ResponsivePanelFooter>
    </ResponsivePanel>
  );
}
