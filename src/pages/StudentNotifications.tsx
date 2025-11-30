import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle, AlertCircle, MessageSquare, Info } from "lucide-react";
import { format } from "date-fns";

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("complaint_history")
      .select(`
        *,
        complaints!inner(title, user_id)
      `)
      .eq("complaints.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "priority_change":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "note_added":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notif: any) => {
    switch (notif.change_type) {
      case "status_change":
        return `Complaint "${notif.complaints.title}" status changed from ${notif.old_value} to ${notif.new_value}`;
      case "priority_change":
        return `Complaint "${notif.complaints.title}" priority changed from ${notif.old_value} to ${notif.new_value}`;
      case "created":
        return `Your complaint "${notif.complaints.title}" has been submitted`;
      default:
        return `Update on complaint "${notif.complaints.title}"`;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bell className="h-8 w-8" />
          Notifications
        </h1>
        <p className="text-muted-foreground">Stay updated with your complaint status changes</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center glass-card">
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Card key={notif.id} className="p-4 glass-card hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getIcon(notif.change_type)}</div>
                <div className="flex-1">
                  <p className="font-medium">{getNotificationText(notif)}</p>
                  {notif.note && (
                    <p className="text-sm text-muted-foreground mt-1">{notif.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(notif.created_at), "MMM d, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
