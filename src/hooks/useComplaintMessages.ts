import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MessageCount {
  complaint_id: string;
  count: number;
}

export function useComplaintMessages(complaintId?: string) {
  const [messageCount, setMessageCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!complaintId) return;

    fetchMessageCount();
    
    const channel = supabase
      .channel(`message-count-${complaintId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaint_messages",
          filter: `complaint_id=eq.${complaintId}`,
        },
        () => {
          fetchMessageCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [complaintId]);

  const fetchMessageCount = async () => {
    if (!complaintId) return;

    const { count } = await supabase
      .from("complaint_messages")
      .select("*", { count: "exact", head: true })
      .eq("complaint_id", complaintId);

    setMessageCount(count || 0);
  };

  return { messageCount, unreadCount };
}
