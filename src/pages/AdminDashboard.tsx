import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ComplaintDetailsModal } from "@/components/ComplaintDetailsModal";
import { Badge } from "@/components/ui/badge";

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
  const [deleteComplaintId, setDeleteComplaintId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleDeleteComplaint = async () => {
    if (!deleteComplaintId) return;

    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", deleteComplaintId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Complaint deleted successfully",
      });
      fetchComplaints();
    }

    setIsDeleteDialogOpen(false);
    setDeleteComplaintId(null);
  };

  const openDeleteDialog = (e: React.MouseEvent, complaintId: string) => {
    e.stopPropagation();
    setDeleteComplaintId(complaintId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-electric-pink flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Admin Dashboard</h2>
            <p className="text-muted-foreground">Manage complaints and categories</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-neon-blue p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Total</p>
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold tracking-tight">{stats.total}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Pending</p>
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold tracking-tight">{stats.pending}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="bg-gradient-to-br from-neon-blue to-neon-aqua p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Ongoing</p>
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold tracking-tight">{stats.ongoing}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">Completed</p>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold tracking-tight">{stats.completed}</p>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium opacity-90">High Priority</p>
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-4xl font-bold tracking-tight">{stats.high}</p>
            </div>
          </Card>
        </div>

        {/* Categories Management */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Categories</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Manage complaint categories</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90 transition-opacity">
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
                      />
                    </div>
                    <Button
                      onClick={addCategory}
                      className="w-full bg-gradient-to-r from-primary to-neon-blue hover:opacity-90"
                    >
                      Add Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  className="px-4 py-2 text-base bg-gradient-to-r from-primary/10 to-neon-blue/10 text-primary hover:from-primary/20 hover:to-neon-blue/20 border border-primary/20"
                >
                  <span>{category.name}</span>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="ml-2 hover:bg-destructive/20 rounded-full p-1 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">All Complaints</CardTitle>
            <p className="text-sm text-muted-foreground">View and manage all submitted complaints</p>
          </CardHeader>
          <CardContent>
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
                          <Badge variant="secondary">
                            {complaint.categories?.name || "N/A"}
                          </Badge>
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
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={complaint.status} />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => openDeleteDialog(e, complaint.id)}
                              className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the complaint
                and all associated notes and history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteComplaint}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
