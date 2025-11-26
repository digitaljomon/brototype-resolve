import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, Calendar, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ComplaintDetailsModalProps {
  complaint: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ComplaintDetailsModal({ complaint, open, onOpenChange, onUpdate }: ComplaintDetailsModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [status, setStatus] = useState(complaint.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && complaint) {
      fetchNotes();
      setStatus(complaint.status);
    }
  }, [open, complaint]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("complaint_notes")
      .select("*, profiles(name, email)")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setNotes(data);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from("complaint_notes")
      .insert({
        complaint_id: complaint.id,
        admin_id: user.id,
        note: newNote,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Note Added",
        description: "Internal note added successfully",
      });
      setNewNote("");
      fetchNotes();
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", complaint.id);

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
      setStatus(newStatus);
      onUpdate();
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from("complaint_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Note deleted successfully",
      });
      fetchNotes();
    }
  };

  if (!complaint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-multi gradient-text">
            Complaint Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">{complaint.title}</h3>
              <div className="flex items-center gap-4">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={status} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(complaint.created_at), "PPP")}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="glass-card p-4 rounded-lg border-2">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Information
            </h4>
            <div className="space-y-1 text-sm">
              <p className="text-foreground"><span className="font-medium">Name:</span> {complaint.profiles?.name}</p>
              <p className="text-foreground"><span className="font-medium">Email:</span> {complaint.profiles?.email}</p>
              <p className="text-foreground"><span className="font-medium">Category:</span> {complaint.categories?.name || "N/A"}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border">
              {complaint.description}
            </p>
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Attachments</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.attachments.map((attachment: string, index: number) => (
                  <img
                    key={index}
                    src={attachment}
                    alt={`Attachment ${index + 1}`}
                    className="rounded-lg border-2 w-full h-32 object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          <div className="space-y-2">
            <Label htmlFor="status">Update Status</Label>
            <Select value={status} onValueChange={updateStatus}>
              <SelectTrigger id="status" className="glass-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internal Notes */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Internal Admin Notes
            </h4>

            {/* Notes List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="glass-card p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm text-foreground">{note.profiles?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "PPp")}
                      </p>
                    </div>
                    {note.admin_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNote(note.id)}
                        className="h-8 w-8 hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.note}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No internal notes yet
                </p>
              )}
            </div>

            {/* Add Note */}
            <div className="space-y-2">
              <Label htmlFor="newNote">Add Internal Note</Label>
              <Textarea
                id="newNote"
                placeholder="Add a note visible only to admins..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="glass-card min-h-[100px]"
              />
              <Button
                onClick={addNote}
                disabled={loading || !newNote.trim()}
                className="w-full bg-gradient-pink-purple text-white"
              >
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
