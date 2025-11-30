import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, FileText, Plus, Bell, User, HelpCircle, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleStudentLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Complaints", url: "/dashboard/complaints", icon: FileText },
  { title: "File a Complaint", url: "/dashboard/file-complaint", icon: Plus },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Help / FAQ", url: "/dashboard/help", icon: HelpCircle },
];

export function SimpleStudentLayout({ children }: SimpleStudentLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold gradient-text bg-gradient-purple-blue">
              Brototype Resolve
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium shadow-sm" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="h-full px-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-4 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/dashboard/notifications")}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
              </Button>

              <ThemeToggle />

              <Avatar
                className="cursor-pointer"
                onClick={() => navigate("/dashboard/profile")}
              >
                <AvatarImage src="" alt={user?.email} />
                <AvatarFallback className="bg-gradient-purple-blue text-white">
                  {user?.email ? getInitials(user.email) : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* Footer */}
        <footer className="border-t bg-card/50 backdrop-blur-sm py-3">
          <p className="text-center text-xs text-muted-foreground">
            All Rights Reserved. 2025. Developed by Jomon Joseph
          </p>
        </footer>
      </div>
    </div>
  );
}
