import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleStudentLayout } from "@/components/SimpleStudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  Paperclip
} from "lucide-react";
import { format } from "date-fns";

interface ComplaintData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  attachments: any;
  categories: { name: string } | null;
  profiles: { name: string; email: string } | null;
}

interface HistoryItem {
  id: string;
  change_type: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: string;
  profiles: { name: string } | null;
}

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchComplaintDetails();
      fetchHistory();
      setupRealtimeSubscription();
    }
  }, [id]);

  const setupRealtimeSubscription = () => {
    // Subscribe to complaint updates
    const complaintChannel = supabase
      .channel(`complaint-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("Complaint updated:", payload);
          fetchComplaintDetails();
          toast({
            title: "Complaint Updated",
            description: "This complaint has been updated by an admin",
          });
        }
      )
      .subscribe();

    // Subscribe to history updates
    const historyChannel = supabase
      .channel(`history-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaint_history",
          filter: `complaint_id=eq.${id}`,
        },
        (payload) => {
          console.log("New history entry:", payload);
          fetchHistory();
          toast({
            title: "New Update",
            description: "Admin has added a new update to your complaint",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(complaintChannel);
      supabase.removeChannel(historyChannel);
    };
  };

  const fetchComplaintDetails = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        categories (name),
        profiles (name, email)
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      // Check if user owns this complaint
      if (data.user_id !== user?.id) {
        navigate("/dashboard");
        return;
      }
      setComplaint(data);
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("complaint_history")
      .select(`
        *,
        profiles:changed_by (name)
      `)
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      setHistory(data);
    }
  };

  const getTimelineIcon = (type: string, value?: string) => {
    if (type === "created") return <FileText className="h-5 w-5" />;
    if (value === "resolved" || value === "closed") return <CheckCircle2 className="h-5 w-5" />;
    if (value === "in_progress" || value === "assigned") return <Clock className="h-5 w-5" />;
    if (value === "rejected") return <XCircle className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  const getTimelineColor = (type: string, value?: string) => {
    if (type === "created") return "bg-purple-500";
    if (value === "resolved" || value === "closed") return "bg-green-500";
    if (value === "in_progress" || value === "assigned") return "bg-cyan-500";
    if (value === "rejected") return "bg-red-500";
    if (value === "pending") return "bg-orange-500";
    return "bg-gray-500";
  };

  const getChangeLabel = (item: HistoryItem) => {
    if (item.change_type === "created") {
      return "Complaint Submitted";
    }
    if (item.change_type === "status_change") {
      return `Status changed from ${item.old_value?.replace("_", " ")} to ${item.new_value?.replace("_", " ")}`;
    }
    if (item.change_type === "priority_change") {
      return `Priority changed from ${item.old_value} to ${item.new_value}`;
    }
    return item.change_type;
  };

  if (loading) {
    return (
      <SimpleStudentLayout>
        <div className="container mx-auto px-6 py-8 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </SimpleStudentLayout>
    );
  }

  if (!complaint) {
    return (
      <SimpleStudentLayout>
        <div className="container mx-auto px-6 py-8">
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Complaint not found</p>
            <Button onClick={() => navigate("/dashboard/complaints")}>
              Back to Complaints
            </Button>
          </Card>
        </div>
      </SimpleStudentLayout>
    );
  }

  return (
    <SimpleStudentLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/complaints")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Details Card */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-3">{complaint.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority as any} />
                      {complaint.categories && (
                        <Badge className="bg-primary/10 text-primary border-0">
                          <Tag className="h-3 w-3 mr-1" />
                          {complaint.categories.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                    <p className="text-base leading-relaxed">{complaint.description}</p>
                  </div>

                  {complaint.attachments && Array.isArray(complaint.attachments) && complaint.attachments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({complaint.attachments.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {complaint.attachments.map((attachment: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="px-3 py-2">
                            <Paperclip className="h-3 w-3 mr-2" />
                            {attachment.name || `Attachment ${idx + 1}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {format(new Date(complaint.created_at), "MMM d, yyyy 'at' HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Updated: {format(new Date(complaint.updated_at), "MMM d, yyyy 'at' HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Status Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[17px] top-8 bottom-8 w-0.5 bg-border"></div>

                  {/* Timeline Items */}
                  <div className="space-y-8">
                    {history.map((item, index) => (
                      <div key={item.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* Icon */}
                        <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full ${getTimelineColor(item.change_type, item.new_value || undefined)} text-white shadow-lg ring-4 ring-background`}>
                          {getTimelineIcon(item.change_type, item.new_value || undefined)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-8">
                          <div className="bg-muted/50 rounded-lg p-4 border">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm">{getChangeLabel(item)}</h4>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.created_at), "MMM d, HH:mm")}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-sm text-muted-foreground mt-2">{item.note}</p>
                            )}
                            {item.profiles && (
                              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>by {item.profiles.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info Card */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-sm">Submitted By</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {complaint.profiles?.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{complaint.profiles?.name}</p>
                    <p className="text-xs text-muted-foreground">{complaint.profiles?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                  <StatusBadge status={complaint.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Priority Level</p>
                  <PriorityBadge priority={complaint.priority as any} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Updates</p>
                  <p className="text-lg font-bold">{history.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SimpleStudentLayout>
  );
}
