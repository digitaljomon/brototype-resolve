import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, CheckCircle2, Circle, User } from "lucide-react";
import { format } from "date-fns";

interface StageData {
  status: string;
  timestamp?: string;
  userName?: string;
  notes: Array<{
    id: string;
    note: string;
    adminName: string;
    timestamp: string;
  }>;
}

const STATUS_STAGES = [
  { key: 'pending', label: 'Submitted' },
  { key: 'verified', label: 'Verified' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

interface ComplaintTimelineProps {
  complaintId: string;
}

export function ComplaintTimeline({ complaintId }: ComplaintTimelineProps) {
  const [stages, setStages] = useState<StageData[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [complaintId]);

  const fetchTimeline = async () => {
    try {
      // Fetch complaint to get current status
      const { data: complaintData } = await supabase
        .from("complaints")
        .select("status")
        .eq("id", complaintId)
        .single();

      if (complaintData) {
        setCurrentStatus(complaintData.status);
      }

      // Fetch complaint history
      const { data: historyData, error: historyError } = await supabase
        .from("complaint_history")
        .select(`
          *,
          profiles:changed_by (name)
        `)
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });

      if (historyError) throw historyError;

      // Fetch complaint notes
      const { data: notesData, error: notesError } = await supabase
        .from("complaint_notes")
        .select(`
          *,
          profiles:admin_id (name)
        `)
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });

      if (notesError) throw notesError;

      // Build stages with data
      const stageMap = new Map<string, StageData>();
      
      // Initialize all stages
      STATUS_STAGES.forEach(stage => {
        stageMap.set(stage.key, {
          status: stage.key,
          notes: []
        });
      });

      // Process history data
      historyData?.forEach((item) => {
        if (item.change_type === 'status_change' || item.change_type === 'created') {
          const status = item.new_value || 'pending';
          const stage = stageMap.get(status);
          if (stage && !stage.timestamp) {
            stage.timestamp = item.created_at;
            stage.userName = item.profiles?.name || "Unknown";
          }
        }
      });

      // Process notes data - attach to current stage at time of note
      notesData?.forEach((noteItem) => {
        // Find the status at the time of this note
        const statusAtTime = historyData
          ?.filter(h => new Date(h.created_at) <= new Date(noteItem.created_at) && 
                       (h.change_type === 'status_change' || h.change_type === 'created'))
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const status = statusAtTime?.new_value || 'pending';
        const stage = stageMap.get(status);
        if (stage) {
          stage.notes.push({
            id: noteItem.id,
            note: noteItem.note,
            adminName: noteItem.profiles?.name || "Unknown Admin",
            timestamp: noteItem.created_at
          });
        }
      });

      setStages(Array.from(stageMap.values()));
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = (stageKey: string): 'completed' | 'active' | 'pending' => {
    const currentIndex = STATUS_STAGES.findIndex(s => s.key === currentStatus);
    const stageIndex = STATUS_STAGES.findIndex(s => s.key === stageKey);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (stages.length === 0 && !loading) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No history available yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      {STATUS_STAGES.map((stage, index) => {
        const stageData = stages.find(s => s.status === stage.key);
        const status = getStageStatus(stage.key);
        const isLast = index === STATUS_STAGES.length - 1;

        return (
          <div key={stage.key} className="relative">
            {/* Connecting line */}
            {!isLast && (
              <div 
                className={`absolute left-4 top-10 w-0.5 h-full ${
                  status === 'completed' ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}

            {/* Stage content */}
            <div className="flex gap-4 pb-6">
              {/* Status indicator */}
              <div className="relative z-10 flex-shrink-0">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    status === 'completed' 
                      ? 'bg-primary border-primary' 
                      : status === 'active'
                      ? 'bg-primary/20 border-primary'
                      : 'bg-background border-border'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                  ) : status === 'active' ? (
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Stage details */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className={`font-semibold ${
                    status === 'active' ? 'text-primary' : 
                    status === 'completed' ? 'text-foreground' : 
                    'text-muted-foreground'
                  }`}>
                    {stage.label}
                  </h4>
                  {status === 'active' && (
                    <Badge variant="default" className="text-xs">Current</Badge>
                  )}
                </div>

                {stageData?.timestamp && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(stageData.timestamp), "PPp")}
                    </div>
                    
                    {stageData.userName && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>By {stageData.userName}</span>
                      </div>
                    )}

                    {/* Admin notes for this stage */}
                    {stageData.notes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {stageData.notes.map((note) => (
                          <Card key={note.id} className="p-3 bg-muted/30">
                            <div className="flex items-start gap-2 mb-1">
                              <FileText className="h-3 w-3 text-primary mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-foreground">
                                    {note.adminName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(note.timestamp), "PPp")}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground whitespace-pre-wrap">
                                  {note.note}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
