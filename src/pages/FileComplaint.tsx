import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplaintForm } from "@/components/ComplaintForm";
import { useToast } from "@/hooks/use-toast";

export default function FileComplaint() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your complaint has been submitted successfully",
    });
    navigate("/dashboard/complaints");
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-3xl">File a Complaint</CardTitle>
          <CardDescription>
            Submit your complaint and we'll get back to you as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplaintForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
