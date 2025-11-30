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
    <div className="container mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="mb-8 flex items-start gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-1">Dashboard Overview</h2>
          <p className="text-muted-foreground">Monitor and manage your complaints</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiCards.map((card) => (
              <Card 
                key={card.title} 
                className={`border-0 bg-gradient-to-br ${card.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm font-medium opacity-90">{card.title}</div>
                    <div className={`p-2 rounded-full ${card.iconBg}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-5xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Complaints - Takes 2 columns */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Latest Complaints</CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard/complaints")}
                    className="gap-2 text-primary hover:text-primary"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {recentComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No complaints yet</p>
                    <Button
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
                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => navigate(`/dashboard/complaint/${complaint.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{complaint.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-xs">
                              {format(new Date(complaint.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={complaint.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Sidebar Widgets */}
            <div className="space-y-6">
              {/* Quick Action Card */}
              <Card className="shadow-sm border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                  <CardDescription>File a new complaint quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate("/dashboard/file-complaint")}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold py-6 shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    File a New Complaint
                  </Button>
                </CardContent>
              </Card>

              {/* Status Summary */}
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-lg">Status Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <span className="text-sm font-bold">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <span className="text-sm font-bold">{stats.in_progress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Resolved</span>
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
