import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "pending" | "ongoing" | "completed";
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const variants = {
    pending: "bg-gradient-pending text-foreground",
    ongoing: "bg-gradient-ongoing text-white",
    completed: "bg-gradient-completed text-white",
  };

  return (
    <Badge className={`${variants[status]} font-medium px-3 py-1 border-0`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
