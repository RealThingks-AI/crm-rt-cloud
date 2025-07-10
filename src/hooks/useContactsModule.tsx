
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContactColumn } from '@/components/ContactColumnCustomizer';
import { Contact } from '@/types/contact';

export const useContactsModule = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<ContactColumn[]>([
    { key: 'contact_name', label: 'Contact Name', required: true, visible: true },
    { key: 'company_name', label: 'Company Name', required: true, visible: true },
    { key: 'position', label: 'Position', required: true, visible: true },
    { key: 'email', label: 'Email', required: true, visible: true },
    { key: 'phone_no', label: 'Phone', required: true, visible: true },
    { key: 'lead_status', label: 'Lead Status', required: true, visible: true },
    { key: 'contact_owner', label: 'Contact Owner', required: false, visible: true },
    { key: 'mobile_no', label: 'Mobile', required: false, visible: false },
    { key: 'linkedin', label: 'LinkedIn', required: false, visible: false },
    { key: 'website', label: 'Website', required: false, visible: false },
    { key: 'industry', label: 'Industry', required: false, visible: false },
    { key: 'city', label: 'City', required: false, visible: false },
    { key: 'state', label: 'State', required: false, visible: false },
    { key: 'country', label: 'Country', required: false, visible: false },
    { key: 'contact_source', label: 'Source', required: false, visible: false },
    { key: 'annual_revenue', label: 'Annual Revenue', required: false, visible: false },
    { key: 'no_of_employees', label: 'Employees', required: false, visible: false },
  ]);

  const fetchContacts = async () => {
    try {
      // First, fetch all contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (contactsError) throw contactsError;
      
      console.log(`Fetched ${contactsData?.length || 0} contacts from contacts table`);
      
      if (!contactsData || contactsData.length === 0) {
        setContacts([]);
        return;
      }

      // Get unique user IDs from contacts
      const userIds = new Set<string>();
      contactsData.forEach(contact => {
        if (contact.contact_owner) userIds.add(contact.contact_owner);
        if (contact.created_by) userIds.add(contact.created_by);
        if (contact.modified_by) userIds.add(contact.modified_by);
      });

      // Fetch user data from Supabase Auth admin API
      const userMap = new Map<string, string>();
      
      try {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error fetching auth users:', usersError);
        } else if (users) {
          users.forEach((user: any) => {
            if (userIds.has(user.id)) {
              // Get display name from user metadata or format from email
              let displayName = user.user_metadata?.full_name || user.user_metadata?.name;
              
              if (!displayName && user.email) {
                // Convert email to display name (e.g., peter.jakobsson@company.com -> Peter Jakobsson)
                const emailName = user.email.split('@')[0];
                displayName = emailName
                  .split('.')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(' ');
              }
              
              userMap.set(user.id, displayName || 'Unknown User');
            }
          });
        }
      } catch (authError) {
        console.error('Error accessing auth admin API:', authError);
        // Fallback: create display names from email addresses stored in the contact data
        contactsData.forEach(contact => {
          if (contact.contact_owner && !userMap.has(contact.contact_owner)) {
            userMap.set(contact.contact_owner, 'Unknown User');
          }
          if (contact.created_by && !userMap.has(contact.created_by)) {
            userMap.set(contact.created_by, 'Unknown User');
          }
          if (contact.modified_by && !userMap.has(contact.modified_by)) {
            userMap.set(contact.modified_by, 'Unknown User');
          }
        });
      }
      
      // Transform the contacts data to include display names
      const transformedContacts = contactsData.map(contact => ({
        ...contact,
        contact_owner_name: contact.contact_owner ? 
                           (userMap.get(contact.contact_owner) || 'Unknown User') : 
                           'Unknown User',
        created_by_name: contact.created_by ? 
                        (userMap.get(contact.created_by) || 'Unknown User') : 
                        'Unknown User',
        modified_by_name: contact.modified_by ? 
                         (userMap.get(contact.modified_by) || 'Unknown User') : 
                         'Unknown User'
      })) as Contact[];
      
      setContacts(transformedContacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        variant: "destructive",
        title: "Error fetching contacts",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    // Set up real-time subscription for the contacts table
    const contactsSubscription = supabase
      .channel('contacts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts'
      }, (payload) => {
        console.log('Real-time contact change:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'INSERT') {
          const newContact = payload.new as Contact;
          // For real-time updates, we'll refetch to get the proper profile data
          fetchContacts();
          toast({
            title: "New contact added",
            description: `${newContact.contact_name} has been added`,
          });
        } else if (payload.eventType === 'UPDATE') {
          // For real-time updates, we'll refetch to get the proper profile data
          fetchContacts();
        } else if (payload.eventType === 'DELETE') {
          setContacts(prev => prev.filter(contact => contact.id !== payload.old.id));
          toast({
            title: "Contact deleted",
            description: "A contact has been removed",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contactsSubscription);
    };
  }, []);

  return {
    contacts,
    loading,
    columns,
    setColumns,
    fetchContacts,
  };
};
