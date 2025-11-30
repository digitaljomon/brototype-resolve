import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut, isSuperAdmin } = useAuth();
  
  const mainItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Complaints", url: "/admin/complaints", icon: FileText },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Manage Categories", url: "/admin/categories", icon: Tags },
    { title: "User Management", url: "/admin/users", icon: Users },
    ...(isSuperAdmin ? [{ title: "Admin Management", url: "/admin/admins", icon: Shield }] : []),
  ];
  
  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

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
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
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

      {/* Footer with Settings and Logout */}
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/admin/settings"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/10"
                activeClassName="bg-gradient-to-r from-sidebar-accent/20 to-sidebar-accent/10 text-sidebar-accent font-semibold"
              >
                <Settings className="h-5 w-5" />
                {open && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
