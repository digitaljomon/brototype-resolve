import { Home, FileText, Plus, Bell, User, HelpCircle, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Complaints", url: "/dashboard/complaints", icon: FileText },
  { title: "File a Complaint", url: "/dashboard/file-complaint", icon: Plus },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Help / FAQ", url: "/dashboard/help", icon: HelpCircle },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="p-4 border-b">
          <h2 className={`font-bold gradient-text bg-gradient-purple-blue ${isCollapsed ? "text-center text-xs" : "text-xl"}`}>
            {isCollapsed ? "BR" : "Brototype Resolve"}
          </h2>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-accent"
                      activeClassName="bg-gradient-purple-blue text-white font-medium"
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="p-4 border-t">
          <SidebarMenuButton
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
