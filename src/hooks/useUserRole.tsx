
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole('user');
        setLoading(false);
        return;
      }

      try {
        // First check if user has a role in user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

        if (data?.role) {
          setUserRole(data.role);
        } else if (!error || error.code === 'PGRST116') {
          // If no role found (0 rows), create default 'user' role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert([{ user_id: user.id, role: 'user' }])
            .select('role')
            .single();
          
          if (!insertError) {
            setUserRole('user');
          } else if (insertError.code === '23505') {
            // Handle duplicate key constraint - role already exists, fetch it again
            const { data: existingRole } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .single();
            setUserRole(existingRole?.role || 'user');
          } else {
            console.error('Error creating default user role:', insertError);
            setUserRole('user');
          }
        } else {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole === 'admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canManageUsers = isAdmin;
  const canAccessSettings = isAdmin;

  return {
    userRole,
    isAdmin,
    canEdit,
    canDelete,
    canManageUsers,
    canAccessSettings,
    loading
  };
};
