import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { differenceInHours, differenceInMinutes, format } from "date-fns";

interface DeadlineTimerProps {
  deadline: string;
  className?: string;
}

export function DeadlineTimer({ deadline, className }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [urgencyLevel, setUrgencyLevel] = useState<"safe" | "warning" | "danger" | "overdue">("safe");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const hoursRemaining = differenceInHours(deadlineDate, now);
      const minutesRemaining = differenceInMinutes(deadlineDate, now);

      if (hoursRemaining < 0) {
        setUrgencyLevel("overdue");
        setTimeRemaining("Overdue");
      } else if (hoursRemaining < 6) {
        setUrgencyLevel("danger");
        const hours = Math.floor(minutesRemaining / 60);
        const minutes = minutesRemaining % 60;
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (hoursRemaining < 12) {
        setUrgencyLevel("warning");
        setTimeRemaining(`${hoursRemaining}h`);
      } else if (hoursRemaining < 24) {
        setUrgencyLevel("warning");
        setTimeRemaining(`${hoursRemaining}h`);
      } else {
        setUrgencyLevel("safe");
        const days = Math.floor(hoursRemaining / 24);
        setTimeRemaining(`${days}d ${hoursRemaining % 24}h`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case "overdue":
        return "bg-destructive text-destructive-foreground border-destructive";
      case "danger":
        return "bg-red-500/20 text-red-500 border-red-500/50 animate-pulse";
      case "warning":
        return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case "safe":
        return "bg-green-500/20 text-green-500 border-green-500/50";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className={cn("gap-1.5 px-3 py-1", getUrgencyColor())}>
        {urgencyLevel === "overdue" ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Clock className="h-3.5 w-3.5" />
        )}
        <span className="font-semibold">{timeRemaining}</span>
      </Badge>
      <span className="text-xs text-muted-foreground">
        Due: {format(new Date(deadline), "MMM d, HH:mm")}
      </span>
    </div>
  );
}