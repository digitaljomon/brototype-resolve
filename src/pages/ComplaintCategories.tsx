import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Tags } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ComplaintCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const { error } = await supabase
      .from("categories")
      .insert({ name: newCategory });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category added successfully",
      });
      setNewCategory("");
      setIsDialogOpen(false);
      fetchCategories();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Category deleted successfully",
      });
      fetchCategories();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-neon-purple to-electric-pink flex items-center justify-center shadow-lg">
            <Tags className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Complaint Categories</h2>
            <p className="text-muted-foreground">Manage and organize complaint categories</p>
          </div>
        </div>

        {/* Categories Management */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Categories</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Create and manage complaint categories</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-neon-blue hover:opacity-90 transition-opacity">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>
                    <Button
                      onClick={addCategory}
                      className="w-full bg-gradient-to-r from-primary to-neon-blue hover:opacity-90"
                    >
                      Add Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No categories yet. Create your first category to get started.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon-purple to-electric-pink text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <Tags className="h-4 w-4" />
                    <span>{category.name}</span>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="ml-1 hover:bg-white/20 rounded-full p-1 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
