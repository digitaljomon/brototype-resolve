import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireStudent = false 
}: ProtectedRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect non-admins trying to access admin routes
  if (requireAdmin && userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect admins trying to access student-only routes
  if (requireStudent && userRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
