import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminHeader } from "@/components/AdminHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full">
          <AdminHeader />
          
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

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
