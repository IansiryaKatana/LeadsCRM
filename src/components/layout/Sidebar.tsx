import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Upload,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  CheckSquare,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLeadSources } from "@/hooks/useLeadSources";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadWebLeadsCount, useUnreadWebLeadsCountBySource } from "@/hooks/useWebLeadsUnread";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getSourceIcon } from "@/utils/sourceIcons";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "All Leads", href: "/leads", icon: Users },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Bulk Upload", href: "/upload", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings, requireAdmin: true },
];

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  salesperson: "Salesperson",
  viewer: "Viewer",
};

// Component for showing unread count badge for a specific source
function UnreadCountBadgeForSource({ sourceSlug }: { sourceSlug: string }) {
  const { currentAcademicYear } = useSystemSettingsContext();
  const { data: count = 0 } = useUnreadWebLeadsCountBySource(sourceSlug, currentAcademicYear);
  
  if (count === 0) return null;
  
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-warning text-warning-foreground text-xs font-semibold px-2 py-0.5 min-w-[1.5rem]">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// Component for individual source nav item
function SourceNavItem({ 
  source, 
  isActive, 
  IconComponent, 
  isWebSource, 
  onNavigate 
}: { 
  source: { slug: string; name: string };
  isActive: boolean;
  IconComponent: React.ComponentType<{ className?: string }>;
  isWebSource: boolean;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={`/leads/source/${source.slug}`}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground",
        isActive && "bg-primary/10 text-primary font-medium"
      )}
      onClick={onNavigate}
    >
      <IconComponent className="h-4 w-4 shrink-0" />
      <span className="flex-1">{source.name}</span>
      {isWebSource && <UnreadCountBadgeForSource sourceSlug={source.slug} />}
    </NavLink>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const { profile, role, signOut, isAdmin } = useAuth();
  const { settings, systemName, defaultAcademicYear, currentAcademicYear } = useSystemSettingsContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: sources = [] } = useLeadSources();
  const { data: unreadWebLeads = 0 } = useUnreadWebLeadsCount(currentAcademicYear);

  // Only show sources that actually have leads in the current academic year
  const { data: sourceCounts } = useQuery({
    queryKey: ["sidebar-source-counts", currentAcademicYear || "all"],
    queryFn: async () => {
      let query = supabase.from("leads").select("source");

      // Filter by current academic year
      if (currentAcademicYear && currentAcademicYear.trim() !== "") {
        query = query.eq("academic_year", currentAcademicYear);
      }

      const { data, error } = await query;
      if (error) throw error;
      const counts = new Map<string, number>();
      data?.forEach((lead) => {
        counts.set(lead.source as string, (counts.get(lead.source as string) || 0) + 1);
      });
      return counts;
    },
  });

  const activeSources = sources.filter((s) => (sourceCounts?.get(s.slug) || 0) > 0);
  
  const logoUrl = settings.branding?.logo_url;
  
  // Check if we're on a source page
  const isSourcePage = location.pathname.startsWith("/leads/source/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setLogoutDialogOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Detect vertical scrolling on mobile - show yellow when not at top
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      // Show yellow background when scrolled down (not at top), clear when at top
      setIsScrolling(scrollTop > 10);
    };

    // Check initial scroll position
    handleScroll();

    // Only add listener on mobile
    if (window.innerWidth < 1024) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 left-4 z-50 lg:hidden transition-colors duration-200",
          (isOpen || isScrolling) && "bg-warning text-warning-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-card shadow-elevated transform transition-transform duration-300 lg:translate-x-0 lg:shadow-card",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                )}
              </div>
              <div>
                <h1 className="font-display text-xl font-bold">{systemName.split(' ')[0]}</h1>
                <p className="text-xs text-muted-foreground">{systemName.split(' ').slice(1).join(' ')}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {navigation
              .filter((item) => !item.requireAdmin || isAdmin)
              .map((item) => {
                // Special handling for "All Leads" to add expandable sources
                if (item.name === "All Leads") {
                  return (
                    <div key={item.name} className="space-y-1">
                      <Collapsible open={sourcesExpanded} onOpenChange={setSourcesExpanded}>
                        <CollapsibleTrigger asChild>
                          <NavLink
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground w-full",
                              !isSourcePage && location.pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-card"
                            )}
                            activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-card"
                            onClick={(e) => {
                              if (e.currentTarget === e.target || (e.target as HTMLElement).closest('.chevron-icon')) {
                                // Only toggle if clicking the chevron or the link itself
                                if ((e.target as HTMLElement).closest('.chevron-icon')) {
                                  e.preventDefault();
                                  setSourcesExpanded(!sourcesExpanded);
                                } else {
                                  setIsOpen(false);
                                }
                              }
                            }}
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium flex-1">{item.name}</span>
                            {unreadWebLeads > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-warning text-warning-foreground text-xs font-semibold px-2 py-0.5 min-w-[1.5rem]">
                                {unreadWebLeads > 9 ? "9+" : unreadWebLeads}
                              </span>
                            )}
                            {activeSources.length > 0 && (
                              <span className="chevron-icon ml-1">
                                {sourcesExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                            )}
                          </NavLink>
                        </CollapsibleTrigger>
                        
                        {/* Expandable Sources Menu */}
                        {activeSources.length > 0 && (
                          <CollapsibleContent className="pl-4 space-y-1 mt-1">
                            {activeSources.map((source) => {
                              const isActive = location.pathname === `/leads/source/${source.slug}`;
                              const IconComponent = getSourceIcon(source.slug);
                              const isWebSource = ["web_contact", "web_booking", "web_callback", "web_deposit", "web_keyworkers"].includes(source.slug);
                              
                              return (
                                <SourceNavItem
                                  key={source.slug}
                                  source={source}
                                  isActive={isActive}
                                  IconComponent={IconComponent}
                                  isWebSource={isWebSource}
                                  onNavigate={() => setIsOpen(false)}
                                />
                              );
                            })}
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    </div>
                  );
                }
                
                // Regular navigation items
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                    )}
                    activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-card"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                );
              })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center gap-2 justify-end mb-2">
              <NotificationCenter />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">
                  {profile ? getInitials(profile.full_name) : "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {role ? roleLabels[role] : "Loading..."}
                </p>
              </div>
              <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <LogOut className="h-5 w-5 text-muted-foreground" />
                      Sign Out
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out? You'll need to log in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
