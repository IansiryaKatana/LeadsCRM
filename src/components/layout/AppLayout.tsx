import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SIDEBAR_MAIN_MARGIN_CLASS } from "@/components/layout/sidebarLayout";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className={cn("flex-1 min-h-screen overflow-x-hidden", SIDEBAR_MAIN_MARGIN_CLASS)}>
        <div className="p-6 lg:p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
