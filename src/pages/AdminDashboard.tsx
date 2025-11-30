import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, FileText, AlertCircle, Clock, CheckCircle2, TrendingUp, Bell, Plus, ArrowRight, Tags, Users } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

export default function AdminDashboard() {
  const { signOut, user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ongoing: 0,
    completed: 0,
    high: 0,
    verified: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchComplaints(),
      fetchCategories(),
    ]);
    setLoading(false);
  };

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        categories (name),
        profiles (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: `Failed to fetch complaints: ${error.message}`,
        variant: "destructive",
      });
      setComplaints([]);
      calculateStats([]);
      calculateTrend([]);
    } else if (data) {
      setComplaints(data);
      calculateStats(data);
      calculateTrend(data);
      calculateCategoryDistribution(data);
    }
  };

  const calculateStats = (data: any[]) => {
    setStats({
      total: data.length,
      pending: data.filter((c) => c.status === "pending").length,
      ongoing: data.filter((c) => c.status === "ongoing").length,
      completed: data.filter((c) => c.status === "completed").length,
      high: data.filter((c) => c.priority === "high" && !["resolved", "completed", "closed", "rejected"].includes(c.status)).length,
      verified: data.filter((c) => c.status === "verified").length,
      assigned: data.filter((c) => c.status === "assigned").length,
      in_progress: data.filter((c) => c.status === "in_progress").length,
      resolved: data.filter((c) => c.status === "resolved").length,
    });
  };

  const calculateTrend = (data: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const trend = last7Days.map(date => {
      const count = data.filter(c => c.created_at.startsWith(date)).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        complaints: count,
      };
    });
    setTrendData(trend);
  };

  const calculateCategoryDistribution = (data: any[]) => {
    const catCounts = data.reduce((acc: any, c: any) => {
      const catName = c.categories?.name || "Uncategorized";
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});
    
    const catData = Object.entries(catCounts).map(([name, value], idx) => ({
      name,
      value,
      fill: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
    }));
    setCategoryData(catData);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("admin-complaints")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
        },
        (payload) => {
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getHighPriorityNotifications = () => {
    return complaints
      .filter(c => c.priority === "high" && c.status === "pending")
      .slice(0, 5);
  };

  const calculateSLA = () => {
    const completedComplaints = complaints.filter(c => c.status === "completed" || c.status === "resolved");
    if (completedComplaints.length === 0) return { avgDays: 0, onTime: 0 };

    const totalTime = completedComplaints.reduce((sum, c) => {
      const created = new Date(c.created_at).getTime();
      const updated = new Date(c.updated_at).getTime();
      return sum + (updated - created);
    }, 0);
    
    const avgDays = Math.round(totalTime / completedComplaints.length / (1000 * 60 * 60 * 24));
    const onTime = Math.round((completedComplaints.filter(c => {
      const created = new Date(c.created_at).getTime();
      const updated = new Date(c.updated_at).getTime();
      const days = (updated - created) / (1000 * 60 * 60 * 24);
      return days <= 7; // Assuming 7 days SLA
    }).length / completedComplaints.length) * 100);

    return { avgDays, onTime };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  const slaMetrics = calculateSLA();
  const highPriorityNotifications = getHighPriorityNotifications();

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-electric-pink flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <p className="text-sm text-muted-foreground">Monitor and manage complaints</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium opacity-90">Pending</p>
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium opacity-90">High Priority</p>
                <AlertCircle className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold">{stats.high}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-neon-blue to-neon-aqua p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium opacity-90">In Progress</p>
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold">{stats.in_progress + stats.ongoing}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium opacity-90">Completed</p>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold">{stats.completed + stats.resolved}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-neon-purple to-electric-pink p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium opacity-90">Total</p>
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Latest Complaints & Trend */}
          <div className="lg:col-span-2 space-y-4">
            {/* Trend Chart */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Complaints Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="complaints" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Latest Complaints */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Latest Complaints</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/complaints")}
                    className="text-primary hover:text-primary/80"
                  >
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div 
                      key={complaint.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/complaints")}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{complaint.title}</p>
                          <PriorityBadge priority={complaint.priority} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {complaint.profiles?.name} • {new Date(complaint.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={complaint.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Notifications, SLA, Category, Quick Links */}
          <div className="space-y-4">
            {/* Notifications */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {highPriorityNotifications.length > 0 ? (
                  <div className="space-y-2">
                    {highPriorityNotifications.map((notif) => (
                      <div key={notif.id} className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                        <p className="text-xs font-medium text-red-900 dark:text-red-100">{notif.title}</p>
                        <p className="text-xs text-red-700 dark:text-red-300">High priority pending</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No urgent notifications</p>
                )}
              </CardContent>
            </Card>

            {/* SLA Summary */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">SLA Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg. Resolution Time</span>
                  <span className="text-xl font-bold">{slaMetrics.avgDays} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">On-Time Rate</span>
                  <span className="text-xl font-bold text-green-600">{slaMetrics.onTime}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {categoryData.slice(0, 3).map((cat) => (
                    <div key={cat.name} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-medium">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/categories")}
                >
                  <Tags className="mr-2 h-4 w-4" />
                  Manage Categories
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/complaints")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Complaints
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/analytics")}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/users")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
