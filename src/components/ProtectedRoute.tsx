import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const hasOAuthCallbackParams =
    location.hash.includes("access_token=") ||
    location.hash.includes("provider_token=") ||
    /[?&]code=/.test(location.search);

  if (loading || hasOAuthCallbackParams) {
    console.log("[ProtectedRoute] waiting", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      loading,
      hasOAuthCallbackParams,
      hasUser: !!user,
    });

    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log("[ProtectedRoute] redirecting to /auth", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
    return <Navigate to="/auth" replace />;
  }
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
