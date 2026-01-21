import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SystemSettingsProvider, useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useFavicon } from "@/hooks/useFavicon";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadSourcePage from "./pages/LeadSourcePage";
import Reports from "./pages/Reports";
import BulkUpload from "./pages/BulkUpload";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle favicon updates
function FaviconUpdater() {
  const { settings } = useSystemSettingsContext();
  useFavicon(settings.branding?.favicon_url || null);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <SystemSettingsProvider>
            <FaviconUpdater />
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads/source/:sourceSlug" element={<ProtectedRoute><LeadSourcePage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requireRole={["super_admin", "admin"]}><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </SystemSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
