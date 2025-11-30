import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-gradient-pending text-foreground", label: "Submitted" },
    verified: { color: "bg-blue-500 text-white", label: "Verified" },
    assigned: { color: "bg-purple-500 text-white", label: "Assigned" },
    in_progress: { color: "bg-gradient-ongoing text-white", label: "In Progress" },
    resolved: { color: "bg-green-500 text-white", label: "Resolved" },
    closed: { color: "bg-gradient-completed text-white", label: "Closed" },
    // Legacy statuses
    ongoing: { color: "bg-gradient-ongoing text-white", label: "In Progress" },
    completed: { color: "bg-gradient-completed text-white", label: "Closed" },
  };

  const config = statusConfig[status] || { color: "bg-muted text-foreground", label: status };

  return (
    <Badge className={`${config.color} font-medium px-3 py-1 border-0`}>
      {config.label}
    </Badge>
  );
};
