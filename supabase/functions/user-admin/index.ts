import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  app_metadata: any;
  user_metadata: any;
  aud: string;
  role?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get current user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: currentUser, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !currentUser.user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Current user:', currentUser.user.email);

    // Parse request body
    const body = await req.json();
    const { action } = body;

    console.log('Action requested:', action);

    switch (action) {
      case 'listUsers': {
        console.log('Listing users...');
        
        // Get users from auth.users
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          throw listError;
        }

        console.log(`Found ${users.users?.length || 0} users`);
        
        // Return users in the expected format
        const formattedUsers: DatabaseUser[] = users.users?.map(user => ({
          id: user.id,
          email: user.email || '',
          email_confirmed_at: user.email_confirmed_at,
          phone: user.phone,
          phone_confirmed_at: user.phone_confirmed_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_sign_in_at: user.last_sign_in_at,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata,
          aud: user.aud
        })) || [];

        return new Response(JSON.stringify(formattedUsers), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'createUser': {
        const { email, password, displayName, role = 'member' } = body;
        
        console.log('Creating user:', email, 'with role:', role);
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            display_name: displayName,
            email_verified: true
          }
        });

        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }

        // Create profile record with the specified role
        if (newUser.user) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: newUser.user.id,
              full_name: displayName || email.split('@')[0],
              'Email ID': email,
              role: role
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't throw here, as the user was created successfully
            // The profile creation might fail due to trigger conflicts
          }
        }

        console.log('User created successfully:', newUser.user?.email);

        return new Response(JSON.stringify({ success: true, user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'updateUser': {
        const { userId, displayName } = body;
        
        console.log('Updating user:', userId);
        
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              display_name: displayName
            }
          }
        );

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }

        console.log('User updated successfully:', updatedUser.user?.email);

        return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'deleteUser': {
        const { userId } = body;
        
        console.log('Deleting user:', userId);
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          throw deleteError;
        }

        console.log('User deleted successfully');

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'changeRole': {
        const { userId, role } = body;
        
        console.log('Changing user role:', userId, 'to', role);
        
        // Update user role in profiles table
        const { error: roleUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ role: role })
          .eq('id', userId);

        if (roleUpdateError) {
          console.error('Error updating user role:', roleUpdateError);
          throw roleUpdateError;
        }

        console.log('Role change completed successfully');

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in user-admin function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});