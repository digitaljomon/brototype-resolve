import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { BarChart3, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from "recharts";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    statusDistribution: [],
    categoryDistribution: [],
    priorityDistribution: [],
    complaintsOverTime: [],
    avgResolutionTime: 0,
  });

  const COLORS = {
    pending: "hsl(var(--chart-1))",
    ongoing: "hsl(var(--chart-2))",
    completed: "hsl(var(--chart-3))",
    low: "hsl(var(--chart-4))",
    medium: "hsl(var(--chart-5))",
    high: "hsl(var(--destructive))",
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: complaints, error } = await supabase
        .from("complaints")
        .select(`
          *,
          categories (name)
        `);

      if (error) throw error;

      if (complaints) {
        // Status distribution
        const statusCounts = complaints.reduce((acc: any, c: any) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {});
        
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: COLORS[name as keyof typeof COLORS] || "hsl(var(--chart-1))",
        }));

        // Category distribution
        const categoryCounts = complaints.reduce((acc: any, c: any) => {
          const catName = c.categories?.name || "Uncategorized";
          acc[catName] = (acc[catName] || 0) + 1;
          return acc;
        }, {});
        
        const categoryData = Object.entries(categoryCounts).map(([name, value], idx) => ({
          name,
          value,
          fill: `hsl(var(--chart-${(idx % 5) + 1}))`,
        }));

        // Priority distribution
        const priorityCounts = complaints.reduce((acc: any, c: any) => {
          acc[c.priority] = (acc[c.priority] || 0) + 1;
          return acc;
        }, {});
        
        const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          fill: COLORS[name as keyof typeof COLORS] || "hsl(var(--chart-1))",
        }));

        // Complaints over time (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        const timeData = last7Days.map(date => {
          const count = complaints.filter(c => 
            c.created_at.startsWith(date)
          ).length;
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            complaints: count,
          };
        });

        // Average resolution time (for completed complaints)
        const completedComplaints = complaints.filter(c => c.status === 'completed');
        let avgTime = 0;
        if (completedComplaints.length > 0) {
          const totalTime = completedComplaints.reduce((sum, c) => {
            const created = new Date(c.created_at).getTime();
            const updated = new Date(c.updated_at).getTime();
            return sum + (updated - created);
          }, 0);
          avgTime = Math.round(totalTime / completedComplaints.length / (1000 * 60 * 60 * 24)); // Convert to days
        }

        setAnalyticsData({
          statusDistribution: statusData,
          categoryDistribution: categoryData,
          priorityDistribution: priorityData,
          complaintsOverTime: timeData,
          avgResolutionTime: avgTime,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-aqua flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Analytics</h2>
            <p className="text-muted-foreground">Insights and statistics for complaints</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-neon-blue p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Total</p>
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold">
                {analyticsData.statusDistribution.reduce((sum: number, item: any) => sum + item.value, 0)}
              </p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Avg Resolution</p>
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold">{analyticsData.avgResolutionTime}</p>
              <p className="text-sm opacity-90 mt-1">days</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">High Priority</p>
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold">
                {analyticsData.priorityDistribution.find((p: any) => p.name === "High")?.value || 0}
              </p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-br from-neon-purple to-electric-pink p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Completion Rate</p>
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold">
                {(() => {
                  const total = analyticsData.statusDistribution.reduce((sum: number, item: any) => sum + item.value, 0);
                  const completed = analyticsData.statusDistribution.find((s: any) => s.name === "Completed")?.value || 0;
                  return total > 0 ? Math.round((completed / total) * 100) : 0;
                })()}%
              </p>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {analyticsData.statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.priorityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {analyticsData.priorityDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {analyticsData.categoryDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Complaints Over Time */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Complaints Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.complaintsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="complaints" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
