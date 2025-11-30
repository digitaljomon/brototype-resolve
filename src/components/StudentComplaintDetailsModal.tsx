import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ComplaintTimeline } from "@/components/ComplaintTimeline";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { Calendar, FileText, History, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface StudentComplaintDetailsModalProps {
  complaint: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentComplaintDetailsModal({ 
  complaint, 
  open, 
  onOpenChange 
}: StudentComplaintDetailsModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!complaint) return null;

  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-purple-blue gradient-text">
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
                <StatusBadge status={complaint.status} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(complaint.created_at), "PPP")}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="glass-card p-4 rounded-lg border-2">
            <p className="text-sm text-muted-foreground mb-1">Category</p>
            <span className="bg-gradient-blue-cyan px-3 py-1 rounded-full text-white font-medium text-sm">
              {complaint.categories?.name || "Uncategorized"}
            </span>
          </div>

          {/* Tabs for Description and Timeline */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-4">
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
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Attachments
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {complaint.attachments.map((attachment: string, index: number) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => openImageViewer(attachment)}
                      >
                        <img
                          src={attachment}
                          alt={`Attachment ${index + 1}`}
                          className="rounded-lg border-2 w-full h-32 object-cover hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <ComplaintTimeline complaintId={complaint.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Image Viewer Modal */}
        {selectedImage && (
          <ImageViewerModal
            imageUrl={selectedImage}
            open={isImageModalOpen}
            onOpenChange={setIsImageModalOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
