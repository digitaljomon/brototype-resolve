import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  categories: { id: string; name: string }[];
}

export default function AdminManagement() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [promotionRole, setPromotionRole] = useState<"category_admin" | "super_admin">("category_admin");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAdmins(), fetchStudents(), fetchCategories()]);
    setLoading(false);
  };

  const fetchAdmins = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["super_admin", "category_admin", "admin"]);

    if (!roles) return;

    const adminIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", adminIds);

    if (!profiles) return;

    // Fetch category assignments for each admin
    const adminsWithCategories = await Promise.all(
      profiles.map(async (profile) => {
        const role = roles.find(r => r.user_id === profile.id)?.role || "";
        
        if (role === "category_admin") {
          const { data: assignments } = await supabase
            .from("admin_category_assignments")
            .select("category_id, categories(id, name)")
            .eq("admin_id", profile.id);

          return {
            ...profile,
            role,
            categories: assignments?.map(a => a.categories).filter(Boolean) || []
          };
        }

        return {
          ...profile,
          role,
          categories: []
        };
      })
    );

    setAdmins(adminsWithCategories as Admin[]);
  };

  const fetchStudents = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "student");

    if (!roles) return;

    const studentIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds);

    setStudents(profiles || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const handlePromoteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);

    // Update user role
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role: promotionRole })
      .eq("user_id", selectedUser.id);

    if (roleError) {
      toast({
        title: "Error",
        description: roleError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // If category admin, assign categories
    if (promotionRole === "category_admin" && selectedCategories.length > 0) {
      const currentUser = await supabase.auth.getUser();
      
      const assignments = selectedCategories.map(catId => ({
        admin_id: selectedUser.id,
        category_id: catId,
        assigned_by: currentUser.data.user?.id
      }));

      const { error: assignError } = await supabase
        .from("admin_category_assignments")
        .insert(assignments);

      if (assignError) {
        toast({
          title: "Warning",
          description: "Role updated but category assignment failed",
          variant: "destructive",
        });
      }
    }

    toast({
      title: "Success",
      description: `User promoted to ${promotionRole === "super_admin" ? "Super Admin" : "Category Admin"}`,
    });

    setIsPromoteModalOpen(false);
    setSelectedUser(null);
    setSelectedCategories([]);
    fetchData();
  };

  const handleRevokeAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to revoke admin access?")) return;

    // Delete category assignments
    await supabase
      .from("admin_category_assignments")
      .delete()
      .eq("admin_id", adminId);

    // Update role to student
    const { error } = await supabase
      .from("user_roles")
      .update({ role: "student" })
      .eq("user_id", adminId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Admin access revoked",
      });
      fetchData();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0";
      case "admin":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
      case "category_admin":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
      default:
        return "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Admin Management</h2>
              <p className="text-muted-foreground">Manage administrator roles and permissions</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                {admins.filter(a => a.role === "super_admin" || a.role === "admin").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Category Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {admins.filter(a => a.role === "category_admin").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {students.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Categories</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(admin.role)}>
                          {admin.role === "super_admin" ? "Super Admin" : admin.role === "admin" ? "Admin" : "Category Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.role === "category_admin" && admin.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {admin.categories.map((cat: any) => (
                              <Badge key={cat.id} variant="outline" className="text-xs">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {admin.role === "super_admin" || admin.role === "admin" ? "All Categories" : "None"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.role !== "super_admin" && admin.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeAdmin(admin.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Promote Students to Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.slice(0, 10).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(student);
                          setIsPromoteModalOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Promote
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Promote User Modal */}
      <Dialog open={isPromoteModalOpen} onOpenChange={setIsPromoteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Promote User to Admin</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Admin Role</Label>
              <Select value={promotionRole} onValueChange={(val: any) => setPromotionRole(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                  <SelectItem value="category_admin">Category Admin (Limited Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {promotionRole === "category_admin" && (
              <div className="space-y-2">
                <Label>Assign Categories</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={category.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePromoteUser}
              disabled={promotionRole === "category_admin" && selectedCategories.length === 0}
            >
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}