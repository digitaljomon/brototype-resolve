import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const RoleBasedRedirect = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect based on user role
  if (userRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};
