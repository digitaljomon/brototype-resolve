import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import StudentComplaints from "./pages/StudentComplaints";
import FileComplaint from "./pages/FileComplaint";
import StudentNotifications from "./pages/StudentNotifications";
import StudentProfile from "./pages/StudentProfile";
import StudentHelp from "./pages/StudentHelp";
import { SimpleStudentLayout } from "@/components/SimpleStudentLayout";
import AdminDashboard from "./pages/AdminDashboard";
import ComplaintsManagement from "./pages/ComplaintsManagement";
import AdminAnalytics from "./pages/AdminAnalytics";
import ComplaintCategories from "./pages/ComplaintCategories";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <RoleBasedRedirect />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/auth" element={<Auth />} />
                
                {/* Student Routes with Simple Layout */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute requireStudent>
                      <SimpleStudentLayout>
                        <StudentDashboard />
                      </SimpleStudentLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/complaints"
                  element={
                    <ProtectedRoute requireStudent>
                      <SimpleStudentLayout>
                        <StudentComplaints />
                      </SimpleStudentLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/file-complaint"
                  element={
                    <ProtectedRoute requireStudent>
                      <SimpleStudentLayout>
                        <FileComplaint />
                      </SimpleStudentLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/notifications"
                  element={
                    <ProtectedRoute requireStudent>
                      <SimpleStudentLayout>
                        <StudentNotifications />
                      </SimpleStudentLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/profile"
                  element={
                    <ProtectedRoute requireStudent>
                      <SimpleStudentLayout>
                        <StudentProfile />
                      </SimpleStudentLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/help"
                  element={
                    <ProtectedRoute requireStudent>
                      <SimpleStudentLayout>
                        <StudentHelp />
                      </SimpleStudentLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/complaints"
                  element={
                    <ProtectedRoute requireStudent>
                      <StudentComplaints />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/file-complaint"
                  element={
                    <ProtectedRoute requireStudent>
                      <FileComplaint />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/notifications"
                  element={
                    <ProtectedRoute requireStudent>
                      <StudentNotifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/profile"
                  element={
                    <ProtectedRoute requireStudent>
                      <StudentProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/help"
                  element={
                    <ProtectedRoute requireStudent>
                      <StudentHelp />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/complaints"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ComplaintsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ComplaintCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
