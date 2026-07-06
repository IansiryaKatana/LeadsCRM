import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { pageTitleClass } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { PANEL_WIDTH_CLASSES, type PanelSize } from "@/components/ui/panel-layout";

interface ResponsivePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  size?: PanelSize;
}

export function ResponsivePanel({
  open,
  onOpenChange,
  children,
  size = "default",
}: ResponsivePanelProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile && "h-[min(92vh,720px)] rounded-t-xl",
          !isMobile && ["w-full", PANEL_WIDTH_CLASSES[size]],
        )}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}

export function ResponsivePanelHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <SheetHeader
      className={cn("shrink-0 border-b px-6 py-4 text-left", className)}
      {...props}
    />
  );
}

export function ResponsivePanelTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetTitle>) {
  return (
    <SheetTitle
      className={cn(pageTitleClass, "text-left", className)}
      {...props}
    />
  );
}

export function ResponsivePanelDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetDescription>) {
  return (
    <SheetDescription className={cn("text-left font-body", className)} {...props} />
  );
}

export function ResponsivePanelBody({
  className,
  children,
  scroll = true,
}: {
  className?: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  if (scroll) {
    return (
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn("px-6 py-5", className)}>{children}</div>
      </ScrollArea>
    );
  }

  return (
    <div className={cn("flex-1 min-h-0 overflow-y-auto px-6 py-5", className)}>
      {children}
    </div>
  );
}

export function ResponsivePanelFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <SheetFooter
      className={cn("shrink-0 border-t px-6 py-4 gap-3 sm:justify-between", className)}
      {...props}
    />
  );
}
