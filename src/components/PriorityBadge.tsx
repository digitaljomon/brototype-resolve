import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
}

export const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const variants = {
    low: "bg-green-500 text-white",
    medium: "bg-orange-500 text-white",
    high: "bg-pink-500 text-white",
  };

  return (
    <Badge className={`${variants[priority]} font-medium px-3 py-1 border-0 rounded-full shadow-sm`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};
