import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Search, ChevronLeft, ChevronRight, Download, MessageSquare } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ComplaintDetailsModal } from "@/components/ComplaintDetailsModal";
import { format } from "date-fns";

export default function ComplaintsManagement() {
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchComplaints();
    fetchCategories();
    fetchMessageCounts();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchQuery, selectedCategory, selectedPriority, selectedStatus]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        profiles:user_id (name, email),
        categories:category_id (name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching complaints",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setComplaints(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const setupRealtimeSubscription = () => {
    const complaintsChannel = supabase
      .channel("complaints-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        () => {
          fetchComplaints();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaint_messages" },
        () => {
          fetchMessageCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const fetchMessageCounts = async () => {
    const { data } = await supabase
      .from("complaint_messages")
      .select("complaint_id");

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((msg) => {
        counts[msg.complaint_id] = (counts[msg.complaint_id] || 0) + 1;
      });
      setMessageCounts(counts);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category_id === selectedCategory);
    }

    if (selectedPriority !== "all") {
      filtered = filtered.filter((c) => c.priority === selectedPriority);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((c) => c.status === selectedStatus);
    }

    setFilteredComplaints(filtered);
    setCurrentPage(1);
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", complaintId);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: "Complaint status has been updated successfully",
      });
      fetchComplaints();
    }
  };

  const handleDelete = async (complaintId: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;

    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", complaintId);

    if (error) {
      toast({
        title: "Error deleting complaint",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Complaint deleted",
        description: "The complaint has been deleted successfully",
      });
      fetchComplaints();
    }
  };

  const handleViewDetails = (complaint: any) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const exportToCSV = () => {
    const csvData = filteredComplaints.map((complaint) => ({
      Title: complaint.title,
      Description: complaint.description,
      Student: complaint.profiles?.name || "Unknown",
      Email: complaint.profiles?.email || "N/A",
      Category: complaint.categories?.name || "Uncategorized",
      Priority: complaint.priority,
      Status: complaint.status,
      "Created At": format(new Date(complaint.created_at), "MMM d, yyyy HH:mm"),
      "Updated At": format(new Date(complaint.updated_at), "MMM d, yyyy HH:mm"),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `complaints_${format(new Date(), "yyyy-MM-dd_HHmmss")}.csv`;
    link.click();

    toast({
      title: "Export successful",
      description: `${filteredComplaints.length} complaints exported to CSV`,
    });
  };

  const exportToExcel = () => {
    const excelData = filteredComplaints.map((complaint) => ({
      Title: complaint.title,
      Description: complaint.description,
      Student: complaint.profiles?.name || "Unknown",
      Email: complaint.profiles?.email || "N/A",
      Category: complaint.categories?.name || "Uncategorized",
      Priority: complaint.priority,
      Status: complaint.status,
      "Created At": format(new Date(complaint.created_at), "MMM d, yyyy HH:mm"),
      "Updated At": format(new Date(complaint.updated_at), "MMM d, yyyy HH:mm"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");

    XLSX.writeFile(
      workbook,
      `complaints_${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`
    );

    toast({
      title: "Export successful",
      description: `${filteredComplaints.length} complaints exported to Excel`,
    });
  };

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-gradient-to-r from-purple-500 to-pink-500",
      "bg-gradient-to-r from-blue-500 to-cyan-500",
      "bg-gradient-to-r from-green-500 to-emerald-500",
      "bg-gradient-to-r from-orange-500 to-red-500",
      "bg-gradient-to-r from-indigo-500 to-purple-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-purple to-electric-pink bg-clip-text text-transparent">
            All Complaints
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all student complaints
          </p>
        </div>

        {/* Filters Card */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Export Button */}
              <Select onValueChange={(value) => value === "csv" ? exportToCSV() : exportToExcel()}>
                <SelectTrigger className="w-[140px]">
                  <Download className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export as CSV</SelectItem>
                  <SelectItem value="excel">Export as Excel</SelectItem>
                </SelectContent>
              </Select>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredComplaints.length} of {complaints.length} complaints
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComplaints.map((complaint, index) => (
                  <TableRow
                    key={complaint.id}
                    className="hover:bg-muted/50 transition-colors border-border/30"
                  >
                    <TableCell className="font-medium max-w-xs truncate">
                      {complaint.title}
                    </TableCell>
                    <TableCell>{complaint.profiles?.name || "Unknown"}</TableCell>
                    <TableCell>
                      {complaint.categories ? (
                        <Badge
                          className={`${getCategoryColor(
                            categories.findIndex((c) => c.id === complaint.category_id)
                          )} text-white border-0 shadow-sm`}
                        >
                          {complaint.categories.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={complaint.priority} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={complaint.status}
                        onValueChange={(value) => handleStatusChange(complaint.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <StatusBadge status={complaint.status} />
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
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(complaint.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors relative"
                          onClick={() => handleViewDetails(complaint)}
                        >
                          <Eye className="h-4 w-4" />
                          {messageCounts[complaint.id] > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-electric-pink border-0">
                              {messageCounts[complaint.id]}
                            </Badge>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(complaint.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No complaints found matching your filters
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onUpdate={fetchComplaints}
        />
      )}
    </AdminLayout>
  );
}
