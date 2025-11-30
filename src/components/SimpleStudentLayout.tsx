import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Home, FileText, Plus, Bell, User, HelpCircle, LogOut, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

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

function StudentSidebarContent() {
  const { open } = useSidebar();
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        {/* Logo/Brand */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-electric-pink flex items-center justify-center">
              <span className="text-white font-bold text-sm">BR</span>
            </div>
            {open && (
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">Brototype</h1>
                <p className="text-xs text-muted-foreground">Resolve</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/10"
                      activeClassName="bg-gradient-to-r from-sidebar-accent/20 to-sidebar-accent/10 text-sidebar-accent font-semibold border-l-2 border-sidebar-accent"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Logout */}
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground w-full"
              >
                <LogOut className="h-5 w-5" />
                {open && <span>Logout</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function SimpleStudentLayout({ children }: SimpleStudentLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        <StudentSidebarContent />

        {/* Main Content */}
        <div className="flex-1 flex flex-col w-full">
          {/* Header */}
          <header className="glass-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-xl">
            <div className="px-6">
              <div className="flex items-center justify-between h-16">
                <SidebarTrigger className="hover:bg-sidebar-accent/10" />

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-sidebar-accent/10"
                    onClick={() => navigate("/dashboard/notifications")}
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
                  </Button>

                  <ThemeToggle />

                  <Avatar
                    className="cursor-pointer h-8 w-8"
                    onClick={() => navigate("/dashboard/profile")}
                  >
                    <AvatarImage src="" alt={user?.email} />
                    <AvatarFallback className="bg-gradient-purple-blue text-white">
                      {user?.email ? getInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
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
    </SidebarProvider>
  );
}
