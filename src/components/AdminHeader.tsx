import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";
import { LogOut, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AdminHeader() {
  const { signOut, user, userRole } = useAuth();

  return (
    <header className="border-b glass-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-bold gradient-multi gradient-text">
              Admin Dashboard
            </h1>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: {user.email} ({userRole})
              </p>
            )}
          </div>
          <nav className="flex gap-6">
            <NavLink 
              to="/admin"
              activeClassName="text-primary font-semibold"
              className="text-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/admin/analytics"
              activeClassName="text-primary font-semibold"
              className="text-foreground hover:text-primary transition-colors"
            >
              Analytics
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="glass-card hover:bg-primary/20 transition-all relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>
          <ThemeToggle />
          <Button
            onClick={signOut}
            variant="outline"
            size="icon"
            className="glass-card hover:bg-destructive hover:text-white transition-all"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
