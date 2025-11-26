import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Plus, Trash2, Bell } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplaintDetailsModal } from "@/components/ComplaintDetailsModal";

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
  });
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchComplaints(), fetchCategories()]);
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

    console.log("Fetch complaints result:", { data, error });

    if (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: `Failed to fetch complaints: ${error.message}`,
        variant: "destructive",
      });
      setComplaints([]);
      calculateStats([]);
    } else if (data) {
      console.log(`Found ${data.length} complaints`);
      setComplaints(data);
      calculateStats(data);
    }
  };

  const calculateStats = (data: any[]) => {
    setStats({
      total: data.length,
      pending: data.filter((c) => c.status === "pending").length,
      ongoing: data.filter((c) => c.status === "ongoing").length,
      completed: data.filter((c) => c.status === "completed").length,
      high: data.filter((c) => c.priority === "high").length,
    });
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
          console.log("Realtime update:", payload);
          fetchComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: "Complaint status updated successfully",
      });
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const { error } = await supabase
      .from("categories")
      .insert({ name: newCategory });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category added successfully",
      });
      setNewCategory("");
      setIsDialogOpen(false);
      fetchCategories();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Category deleted successfully",
      });
      fetchCategories();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b glass-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 border-2 gradient-purple-blue text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm opacity-90 mb-3 font-medium">Total Complaints</p>
            <p className="text-5xl font-bold tracking-tight">{stats.total}</p>
          </Card>
          <Card className="p-6 border-2 gradient-pending text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm opacity-90 mb-3 font-medium">Pending</p>
            <p className="text-5xl font-bold tracking-tight">{stats.pending}</p>
          </Card>
          <Card className="p-6 border-2 gradient-ongoing text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm opacity-90 mb-3 font-medium">Ongoing</p>
            <p className="text-5xl font-bold tracking-tight">{stats.ongoing}</p>
          </Card>
          <Card className="p-6 border-2 gradient-completed text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm opacity-90 mb-3 font-medium">Completed</p>
            <p className="text-5xl font-bold tracking-tight">{stats.completed}</p>
          </Card>
          <Card className="p-6 border-2 gradient-high text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm opacity-90 mb-3 font-medium">High Priority</p>
            <p className="text-5xl font-bold tracking-tight">{stats.high}</p>
          </Card>
        </div>

        {/* Categories Management */}
        <Card className="p-6 glass-card mb-8 border-2 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-pink-purple gradient-text">
              Manage Categories
            </h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-pink-purple text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter category name"
                      className="glass-card"
                    />
                  </div>
                  <Button
                    onClick={addCategory}
                    className="w-full bg-gradient-pink-purple text-white"
                  >
                    Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 bg-gradient-blue-cyan text-white px-4 py-2 rounded-full font-medium"
              >
                <span>{category.name}</span>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="hover:bg-white/20 rounded-full p-1 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Complaints Table */}
        <Card className="glass-card border-2 shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 gradient-blue-cyan gradient-text">
              All Complaints
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow 
                        key={complaint.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {complaint.title}
                        </TableCell>
                        <TableCell>{complaint.profiles?.name}</TableCell>
                        <TableCell>
                          <span className="bg-gradient-blue-cyan px-3 py-1 rounded-full text-white text-sm">
                            {complaint.categories?.name || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={complaint.priority} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={complaint.status}
                            onValueChange={(value) =>
                              updateStatus(complaint.id, value)
                            }
                          >
                            <SelectTrigger className="w-36 glass-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={complaint.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <ComplaintDetailsModal
            complaint={selectedComplaint}
            open={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            onUpdate={fetchComplaints}
          />
        )}
      </main>
    </div>
  );
}
