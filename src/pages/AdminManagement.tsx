import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, UserPlus, Trash2, Eye, EyeOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAdmins(), fetchCategories()]);
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

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewAdminPassword(password);
    setShowPassword(true);
  };

  const handleCreateCategoryAdmin = async () => {
    if (!newAdminName || !newAdminEmail || !newAdminPassword || selectedCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields and select at least one category",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-category-admin', {
        body: {
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
          categoryIds: selectedCategories
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Store credentials to show in success message
      setCreatedCredentials({
        email: newAdminEmail,
        password: newAdminPassword
      });

      toast({
        title: "Success",
        description: `Category admin created successfully`,
      });

      // Reset form
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setSelectedCategories([]);
      setShowPassword(false);

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error("Error creating category admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create category admin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreatedCredentials(null);
    setNewAdminName("");
    setNewAdminEmail("");
    setNewAdminPassword("");
    setSelectedCategories([]);
    setShowPassword(false);
  };

  const handleRevokeAdmin = async (adminId: string) => {
    if (!confirm("Are you sure you want to revoke this admin's access?")) return;

    try {
      // Delete category assignments
      await supabase
        .from("admin_category_assignments")
        .delete()
        .eq("admin_id", adminId);

      // Update role back to student
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "student" })
        .eq("user_id", adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin access revoked successfully",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error revoking admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to revoke admin access",
        variant: "destructive",
      });
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
          
          <Button 
            className="gap-2 bg-gradient-to-r from-primary to-neon-blue hover:opacity-90 transition-opacity"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Category Admin
          </Button>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {categories.length}
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

      </div>

      {/* Create Category Admin Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createdCredentials ? "Category Admin Created" : "Add New Category Admin"}
            </DialogTitle>
            <DialogDescription>
              {createdCredentials 
                ? "Share these credentials with the new category admin"
                : "Create a new category admin account by providing their details and assigning categories"
              }
            </DialogDescription>
          </DialogHeader>

          {createdCredentials ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="mt-1 p-2 bg-background rounded border font-mono text-sm">
                    {createdCredentials.email}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="mt-1 p-2 bg-background rounded border font-mono text-sm">
                    {createdCredentials.password}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Make sure to save these credentials. The password cannot be retrieved later.
              </p>
              <DialogFooter>
                <Button onClick={closeCreateModal}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    placeholder="Enter full name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter email address"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password (min 6 characters)"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Assign Categories</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the categories this admin will manage
                </p>
                <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-3 border rounded-lg">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length === 0 && (
                  <p className="text-sm text-destructive mt-2">
                    Please select at least one category
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeCreateModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategoryAdmin} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Category Admin"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}