import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "super_admin" | "admin" | ("super_admin" | "admin")[];
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, loading, role, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!role || !allowedRoles.includes(role as any)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
