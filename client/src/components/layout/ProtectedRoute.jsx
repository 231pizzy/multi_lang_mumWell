import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { PageSpinner } from "@/components/PageSpinner";
import { ConsentGate } from "@/components/legal/ConsentGate";
import { hasContactDetails, hasRequiredConsents } from "@/lib/consents";

// Wraps routes that require a signed-in user who has given the required consents.
export default function ProtectedRoute() {
  const { user, isAuthenticated, loading } = useSession();
  const location = useLocation();

  if (loading) return <PageSpinner />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!hasRequiredConsents(user) || !hasContactDetails(user)) return <ConsentGate />;
  return <Outlet />;
}

// For /login and /signup: signed-in users go straight to the dashboard.
export function GuestOnlyRoute() {
  const { isAuthenticated, loading } = useSession();
  if (loading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
