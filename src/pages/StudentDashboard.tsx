import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { user } = useAuth();
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
  }, [user]);

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
      title: "Total Complaints",
      value: stats.total,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "In Progress",
      value: stats.in_progress,
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Here's an overview of your complaints</p>
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
              <Card key={card.title} className="glass-card hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Action Button */}
          <Card className="mb-8 glass-card bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <CardHeader>
              <CardTitle className="text-2xl">Need Help?</CardTitle>
              <CardDescription>File a new complaint and we'll assist you</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/dashboard/file-complaint")}
                className="bg-gradient-purple-blue hover:opacity-90 text-white font-semibold px-8 py-6 text-lg shadow-lg"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                File a New Complaint
              </Button>
            </CardContent>
          </Card>

          {/* Recent Complaints */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Complaints</CardTitle>
                <CardDescription>Your latest submissions</CardDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard/complaints")}
                className="gap-2"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentComplaints.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No complaints yet. Start by filing your first complaint!
                </p>
              ) : (
                <div className="space-y-4">
                  {recentComplaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-all"
                      onClick={() => navigate(`/dashboard/complaint/${complaint.id}`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{complaint.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {complaint.categories?.name || "Uncategorized"}
                          </span>
                          <span>{format(new Date(complaint.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                      <StatusBadge status={complaint.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
