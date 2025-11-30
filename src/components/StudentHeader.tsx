import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function StudentHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <SidebarTrigger className="mr-4" />

        <div className="flex items-center gap-4">
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
  );
}
