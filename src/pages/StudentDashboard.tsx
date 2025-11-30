import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return () => {};

    console.log("Setting up realtime subscription for user:", user.id);

    const channel = supabase
      .channel("student-complaints-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("✅ Realtime complaint update received:", payload);
          fetchData();
          
          if (payload.eventType === "UPDATE") {
            toast({
              title: "Status Updated",
              description: "One of your complaints has been updated by admin",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to complaint updates");
        }
      });

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        categories (name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStats({
        total: data.length,
        pending: data.filter((c) => c.status === "pending").length,
        in_progress: data.filter((c) => c.status === "in_progress").length,
        resolved: data.filter((c) => c.status === "resolved").length,
      });
      setRecentComplaints(data.slice(0, 5));
    }
    setLoading(false);
  };

  const kpiCards = [
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      gradient: "from-orange-400 to-orange-500",
      iconBg: "bg-white/20",
    },
    {
      title: "In Progress",
      value: stats.in_progress,
      icon: AlertCircle,
      gradient: "from-cyan-400 to-cyan-500",
      iconBg: "bg-white/20",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      gradient: "from-green-400 to-green-500",
      iconBg: "bg-white/20",
    },
    {
      title: "Total",
      value: stats.total,
      icon: FileText,
      gradient: "from-purple-400 to-pink-500",
      iconBg: "bg-white/20",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Header Section */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-electric-pink flex items-center justify-center shadow-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage your complaints</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {kpiCards.map((card) => (
              <Card 
                key={card.title} 
                className="shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                <div className={`bg-gradient-to-br ${card.gradient} p-4 text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium opacity-90">{card.title}</p>
                    <card.icon className="h-4 w-4" />
                  </div>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Complaints - Takes 2 columns */}
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Latest Complaints</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard/complaints")}
                    className="text-primary hover:text-primary/80"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {recentComplaints.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No complaints yet</p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/dashboard/file-complaint")}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      File Your First Complaint
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentComplaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/dashboard/complaint/${complaint.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate mb-1">{complaint.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(complaint.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <StatusBadge status={complaint.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Sidebar Widgets */}
            <div className="space-y-4">
              {/* Quick Action Card */}
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Action</CardTitle>
                  <CardDescription className="text-xs">File a new complaint</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => navigate("/dashboard/file-complaint")}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    File Complaint
                  </Button>
                </CardContent>
              </Card>

              {/* Status Summary */}
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Status Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <span className="text-sm font-bold">{stats.in_progress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm">Resolved</span>
                    </div>
                    <span className="text-sm font-bold">{stats.resolved}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </>
        )}
    </div>
  );
}
