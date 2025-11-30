import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const AdminHeader = () => {
  const { user, userRole } = useAuth();

  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-xl">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-sidebar-accent/10" />
            <div>
              <p className="text-sm text-muted-foreground">
                {user?.email} • <span className="capitalize">{userRole}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative hover:bg-sidebar-accent/10">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-br from-electric-pink to-primary text-white text-xs border-0">
                3
              </Badge>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
