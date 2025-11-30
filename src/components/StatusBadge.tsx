import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-orange-500 text-white", label: "Pending" },
    verified: { color: "bg-blue-500 text-white", label: "Verified" },
    assigned: { color: "bg-purple-500 text-white", label: "Assigned" },
    in_progress: { color: "bg-cyan-500 text-white", label: "In Progress" },
    resolved: { color: "bg-green-500 text-white", label: "Resolved" },
    closed: { color: "bg-green-600 text-white", label: "Closed" },
    rejected: { color: "bg-red-500 text-white", label: "Rejected" },
    // Legacy statuses
    ongoing: { color: "bg-cyan-500 text-white", label: "In Progress" },
    completed: { color: "bg-green-500 text-white", label: "Completed" },
  };

  const config = statusConfig[status] || { color: "bg-muted text-foreground", label: status };

  return (
    <Badge className={`${config.color} font-medium px-3 py-1 border-0 rounded-full shadow-sm`}>
      {config.label}
    </Badge>
  );
};
