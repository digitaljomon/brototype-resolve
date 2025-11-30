import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, AlertCircle, TrendingUp, User } from "lucide-react";
import { format } from "date-fns";

interface TimelineItem {
  id: string;
  type: 'history' | 'note';
  timestamp: string;
  userName: string;
  changeType?: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
}

interface ComplaintTimelineProps {
  complaintId: string;
}

export function ComplaintTimeline({ complaintId }: ComplaintTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [complaintId]);

  const fetchTimeline = async () => {
    try {
      // Fetch complaint history
      const { data: historyData, error: historyError } = await supabase
        .from("complaint_history")
        .select(`
          *,
          profiles:changed_by (name)
        `)
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      // Fetch complaint notes
      const { data: notesData, error: notesError } = await supabase
        .from("complaint_notes")
        .select(`
          *,
          profiles:admin_id (name)
        `)
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;

      // Combine and sort timeline items
      const historyItems: TimelineItem[] = (historyData || []).map((item) => ({
        id: item.id,
        type: 'history',
        timestamp: item.created_at,
        userName: item.profiles?.name || "Unknown",
        changeType: item.change_type,
        oldValue: item.old_value,
        newValue: item.new_value,
      }));

      const noteItems: TimelineItem[] = (notesData || []).map((item) => ({
        id: item.id,
        type: 'note',
        timestamp: item.created_at,
        userName: item.profiles?.name || "Unknown Admin",
        note: item.note,
      }));

      const allItems = [...historyItems, ...noteItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTimeline(allItems);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'status_change':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'priority_change':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getChangeText = (item: TimelineItem) => {
    switch (item.changeType) {
      case 'created':
        return (
          <span>
            <span className="font-medium">{item.userName}</span> created this complaint
          </span>
        );
      case 'status_change':
        return (
          <span>
            <span className="font-medium">{item.userName}</span> changed status from{' '}
            <Badge variant="outline" className="mx-1">{item.oldValue}</Badge> to{' '}
            <Badge variant="outline" className="mx-1">{item.newValue}</Badge>
          </span>
        );
      case 'priority_change':
        return (
          <span>
            <span className="font-medium">{item.userName}</span> changed priority from{' '}
            <Badge variant="outline" className="mx-1">{item.oldValue}</Badge> to{' '}
            <Badge variant="outline" className="mx-1">{item.newValue}</Badge>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No history available yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="rounded-full p-2 bg-muted border-2 border-border">
              {item.type === 'note' ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : (
                getChangeIcon(item.changeType!)
              )}
            </div>
            {index < timeline.length - 1 && (
              <div className="w-0.5 h-full bg-border mt-2 flex-1 min-h-[40px]" />
            )}
          </div>

          {/* Content */}
          <Card className="flex-1 p-4 glass-card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {item.type === 'note' ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.userName}</span>
                      <Badge variant="secondary" className="text-xs">Admin Note</Badge>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{item.note}</p>
                  </>
                ) : (
                  <p className="text-sm text-foreground">{getChangeText(item)}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(item.timestamp), "PPp")}
            </p>
          </Card>
        </div>
      ))}
    </div>
  );
}
