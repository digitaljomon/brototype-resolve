import { ReactNode } from "react";
import { StudentSidebar } from "@/components/StudentSidebar";
import { StudentHeader } from "@/components/StudentHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

interface StudentLayoutProps {
  children: ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        <StudentSidebar />
        <div className="flex-1 flex flex-col">
          <StudentHeader />
          <main className="flex-1 overflow-auto">
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
