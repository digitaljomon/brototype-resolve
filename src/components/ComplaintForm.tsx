import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ComplaintFormProps {
  onSuccess: () => void;
}

export const ComplaintForm = ({ onSuccess }: ComplaintFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    categoryId: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter only PNG and JPG files
    const validFiles = files.filter(file => {
      const fileType = file.type;
      return fileType === 'image/png' || fileType === 'image/jpeg' || fileType === 'image/jpg';
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only PNG and JPG images are accepted",
        variant: "destructive",
      });
    }

    // Limit to 5 images
    const newFiles = [...imageFiles, ...validFiles].slice(0, 5);
    setImageFiles(newFiles);

    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0 || !user) return [];

    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('complaint-attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('complaint-attachments')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      const { error } = await supabase.from("complaints").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category_id: formData.categoryId || null,
        status: "pending",
        attachments: imageUrls,
      });

      if (error) throw error;

      // Clear form and previews
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        categoryId: "",
      });
      setImageFiles([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div>
        <h2 className="text-2xl font-bold mb-2 gradient-purple-blue gradient-text">
          Submit New Complaint
        </h2>
        <p className="text-muted-foreground">Fill in the details below</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Brief summary of your complaint"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="glass-card"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Detailed description of the issue..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={5}
          className="glass-card"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger className="glass-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger className="glass-card">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">
          Attachments (Optional)
          <span className="text-xs text-muted-foreground ml-2">PNG or JPG only, max 5 images</span>
        </Label>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer glass-card hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG or JPG (max 5 images)</p>
              </div>
              <input
                id="images"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={imageFiles.length >= 5}
              />
            </label>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-1 right-1 bg-background/80 px-2 py-0.5 rounded text-xs">
                    <ImageIcon className="h-3 w-3 inline mr-1" />
                    {imageFiles[index].name.slice(0, 10)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-purple-blue hover:opacity-90 text-white font-semibold py-6 text-lg"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Complaint"}
      </Button>
    </form>
  );
};
