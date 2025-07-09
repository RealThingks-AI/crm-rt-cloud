import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
        // Try to get display name from user metadata first
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (metadataName) {
          setDisplayName(metadataName);
          setLoading(false);
          return;
        }

        // If not in metadata, get from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (!error && profile) {
          setDisplayName(profile.full_name);
        } else {
          // Fallback to email if no display name found
          setDisplayName(user.email || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setDisplayName(user.email || '');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  return { displayName, loading };
};