import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const variants = {
    low: "bg-gradient-low text-white",
    medium: "bg-gradient-medium text-foreground",
    high: "bg-gradient-high text-white",
  };

  return (
    <Badge className={`${variants[priority]} font-medium px-3 py-1 border-0`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};
