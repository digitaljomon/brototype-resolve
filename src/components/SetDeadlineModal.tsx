import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SetDeadlineModalProps {
  complaint: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeadlineSet: () => void;
}

export function SetDeadlineModal({ complaint, open, onOpenChange, onDeadlineSet }: SetDeadlineModalProps) {
  const { toast } = useToast();
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && complaint) {
      if (complaint.deadline) {
        setDeadline(format(new Date(complaint.deadline), "yyyy-MM-dd'T'HH:mm"));
      } else {
        // Set default to 24 hours from now
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        setDeadline(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      }
      setNote(complaint.deadline_note || "");
    }
  }, [open, complaint]);

  const handleSetDeadline = async () => {
    if (!deadline) {
      toast({
        title: "Error",
        description: "Please select a deadline date and time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("complaints")
      .update({ 
        deadline: new Date(deadline).toISOString(),
        deadline_note: note
      })
      .eq("id", complaint.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Add history entry
    await supabase
      .from("complaint_notes")
      .insert({
        complaint_id: complaint.id,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        note: `Deadline set to ${format(new Date(deadline), "PPp")}${note ? `: ${note}` : ""}`,
      });

    toast({
      title: "Success",
      description: "Deadline set successfully",
    });

    setLoading(false);
    onDeadlineSet();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Deadline</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline Date & Time</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Deadline Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add any notes about this deadline..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSetDeadline} disabled={loading}>
            {loading ? "Setting..." : "Set Deadline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}