import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Plus, Shield } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ComplaintForm } from "@/components/ComplaintForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
    setupRealtimeSubscription();
  }, [user]);

  const fetchComplaints = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        categories (name),
        profiles (name, email)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComplaints(data);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("student-complaints")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchComplaints();
          
          if (payload.eventType === "UPDATE") {
            toast({
              title: "Status Updated",
              description: "Your complaint status has been updated by admin",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleComplaintSubmitted = () => {
    setIsDialogOpen(false);
    fetchComplaints();
    toast({
      title: "Success!",
      description: "Your complaint has been submitted",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b glass-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-purple-blue gradient-text">
            Brototype Complaints
          </h1>
          <div className="flex items-center gap-4">
            {userRole === "admin" && (
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="glass-card hover:bg-gradient-purple-blue hover:text-white transition-all"
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
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

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Complaints</h2>
            <p className="text-muted-foreground">Track and manage your submitted complaints</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-purple-blue hover:opacity-90 text-white font-semibold px-6 py-6 text-lg shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <ComplaintForm onSuccess={handleComplaintSubmitted} />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : complaints.length === 0 ? (
          <Card className="p-12 text-center glass-card">
            <p className="text-muted-foreground text-lg">No complaints yet. Click "New Complaint" to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="p-6 glass-card hover:shadow-xl transition-all duration-300 border-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{complaint.title}</h3>
                    <p className="text-muted-foreground mb-4">{complaint.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="bg-gradient-blue-cyan px-3 py-1 rounded-full text-white font-medium">
                    {complaint.categories?.name || "Uncategorized"}
                  </span>
                  <span>
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
