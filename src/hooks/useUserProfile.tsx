import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getUserDisplayName } from '@/utils/userDisplayName';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setDisplayName('');
        setLoading(false);
        return;
      }

      try {
        setDisplayName(getUserDisplayName(user));
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setDisplayName(getUserDisplayName(user));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return { displayName, loading };
};