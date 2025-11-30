import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignComplaintModalProps {
  complaint: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function AssignComplaintModal({ complaint, open, onOpenChange, onAssigned }: AssignComplaintModalProps) {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAdmins();
      setSelectedAdmin(complaint.assigned_to || "");
    }
  }, [open, complaint]);

  const fetchAdmins = async () => {
    // Fetch all admins (super_admin and category_admin)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["super_admin", "category_admin", "admin"]);

    if (!roles) return;

    // For category admins, check if they have access to this category
    const adminIds = [];
    for (const role of roles) {
      if (role.role === "super_admin" || role.role === "admin") {
        adminIds.push(role.user_id);
      } else if (role.role === "category_admin" && complaint.category_id) {
        const { data: assignment } = await supabase
          .from("admin_category_assignments")
          .select("*")
          .eq("admin_id", role.user_id)
          .eq("category_id", complaint.category_id)
          .single();
        
        if (assignment) {
          adminIds.push(role.user_id);
        }
      }
    }

    // Fetch admin profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", adminIds);

    if (profiles) {
      const adminsWithRoles = profiles.map(p => ({
        ...p,
        role: roles.find(r => r.user_id === p.id)?.role || ""
      }));
      setAdmins(adminsWithRoles);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdmin) {
      toast({
        title: "Error",
        description: "Please select an admin to assign",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Update complaint assignment
    const { error } = await supabase
      .from("complaints")
      .update({ 
        assigned_to: selectedAdmin,
        status: "assigned"
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

    // Add internal note if provided
    if (note.trim()) {
      await supabase
        .from("complaint_notes")
        .insert({
          complaint_id: complaint.id,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          note: `Assigned to admin. Note: ${note}`,
        });
    }

    toast({
      title: "Success",
      description: "Complaint assigned successfully",
    });

    setLoading(false);
    setNote("");
    onAssigned();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Complaint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin">Select Admin</Label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger id="admin">
                <SelectValue placeholder="Choose an admin..." />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name} ({admin.role === "super_admin" ? "Super Admin" : admin.role === "admin" ? "Admin" : "Category Admin"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Assignment Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add any notes about this assignment..."
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
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}