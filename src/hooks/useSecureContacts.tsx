
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureDataAccess } from '@/hooks/useSecureDataAccess';
import { useToast } from '@/hooks/use-toast';
import { useCRUDAudit } from '@/hooks/useCRUDAudit';

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  created_by?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
}

interface CreateContactData {
  contact_name: string; // Make this required for creation
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  region?: string; // Changed from country to region
  description?: string;
  contact_owner?: string;
}

export const useSecureContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { secureQuery, secureExport } = useSecureDataAccess();
  const { logDelete } = useCRUDAudit();
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      const result = await secureQuery('contacts', query, 'SELECT');
      setContacts(result.data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Access Denied",
        description: "You don't have permission to view these contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: CreateContactData) => {
    try {
      const query = supabase
        .from('contacts')
        .insert([{
          ...contactData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      const result = await secureQuery('contacts', query, 'INSERT');
      
      if (result.data) {
        setContacts(prev => [result.data, ...prev]);
        toast({
          title: "Success",
          description: "Contact created successfully",
        });
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const query = supabase
        .from('contacts')
        .update({
          ...updates,
          modified_time: new Date().toISOString(),
          modified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      const result = await secureQuery('contacts', query, 'UPDATE');
      
      if (result.data) {
        setContacts(prev => prev.map(contact => 
          contact.id === id ? result.data : contact
        ));
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      // First get the contact to check ownership and get data for logging
      const contactToDelete = contacts.find(c => c.id === id);
      if (!contactToDelete) {
        throw new Error('Contact not found');
      }

      console.log('Attempting to delete contact:', { id, contactToDelete });

      const query = supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .select()
        .single();

      const result = await secureQuery('contacts', query, 'DELETE');
      
      console.log('Delete query result:', result);

      // Check if the deletion was actually successful
      if (result.data) {
        // If we get here, the deletion was successful
        setContacts(prev => prev.filter(contact => contact.id !== id));
        
        // Log successful deletion
        await logDelete('contacts', id, contactToDelete, undefined, 'Success');
        
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
      } else {
        // If no data returned, the deletion may have been blocked
        console.log('No data returned from delete operation - may have been blocked by RLS');
        throw new Error('Delete operation was blocked by security policy');
      }
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      
      // Check if this is a permission error (RLS policy violation)
      const isPermissionError = error.message?.includes('row-level security') || 
                               error.message?.includes('permission') ||
                               error.message?.includes('security policy') ||
                               error.code === 'PGRST301' || 
                               error.code === '42501' ||
                               error.code === 'P0001';
      
      if (isPermissionError) {
        console.log('Permission error detected, logging unauthorized attempt');
        
        // Log unauthorized attempt with "Blocked" status
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('security_audit_log').insert({
            user_id: user?.id,
            action: 'Unauthorized Delete Attempt',
            resource_type: 'contacts',
            resource_id: id,
            details: {
              operation: 'DELETE',
              status: 'Blocked',
              timestamp: new Date().toISOString(),
              module: 'Contacts',
              reason: 'Insufficient permissions - not record owner or admin'
            }
          });
        } catch (logError) {
          console.error('Failed to log unauthorized attempt:', logError);
        }

        toast({
          title: "Permission Denied",
          description: "You don't have permission to delete this record.",
          variant: "destructive",
        });
      } else {
        // For other types of errors, show generic error message
        toast({
          title: "Error",
          description: "Failed to delete contact",
          variant: "destructive",
        });
      }
      
      throw error;
    }
  };

  const exportContacts = async (contactsToExport: Contact[]) => {
    try {
      return await secureExport('contacts', contactsToExport, 'CSV');
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    exportContacts
  };
};
