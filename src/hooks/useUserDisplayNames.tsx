import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserDisplayName {
  id: string;
  display_name: string;
}

export const useUserDisplayNames = (userIds: string[]) => {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userIds.length === 0) return;

    const fetchDisplayNames = async () => {
      setLoading(true);
      try {
        // Use the admin function to get user data
        const { data, error } = await supabase.functions.invoke('admin-list-users');
        
        if (error) throw error;

        const userDisplayNames: Record<string, string> = {};
        
        data.users?.forEach((user: any) => {
          if (userIds.includes(user.id)) {
            userDisplayNames[user.id] = user.user_metadata?.display_name || "Unknown";
          }
        });

        setDisplayNames(userDisplayNames);
      } catch (error) {
        console.error('Error fetching user display names:', error);
        // Fallback to "Unknown" for all user IDs
        const fallbackNames: Record<string, string> = {};
        userIds.forEach(id => {
          fallbackNames[id] = "Unknown";
        });
        setDisplayNames(fallbackNames);
      } finally {
        setLoading(false);
      }
    };

    fetchDisplayNames();
  }, [userIds]);

  return { displayNames, loading };
};