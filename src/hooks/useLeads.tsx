
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LeadColumn } from '@/components/LeadColumnCustomizer';

interface Lead {
  id: string;
  lead_name: string;
  company_name: string;
  position: string;
  email: string;
  phone_no: string;
  mobile_no: string;
  linkedin: string;
  website: string;
  contact_source: string;
  lead_status: string;
  industry: string;
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
  city: string;
  country: string;
  description: string;
  contact_owner: string;
  lead_owner_name?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [columns, setColumns] = useState<LeadColumn[]>([
    { key: 'lead_name', label: 'Lead Name', required: true, visible: true },
    { key: 'company_name', label: 'Company Name', required: true, visible: true },
    { key: 'position', label: 'Position', required: true, visible: true },
    { key: 'email', label: 'Email', required: true, visible: true },
    { key: 'phone_no', label: 'Phone', required: true, visible: true },
    { key: 'lead_status', label: 'Lead Status', required: true, visible: true },
    { key: 'lead_owner_name', label: 'Lead Owner', required: false, visible: true },
    { key: 'mobile_no', label: 'Mobile', required: false, visible: false },
    { key: 'linkedin', label: 'LinkedIn', required: false, visible: false },
    { key: 'website', label: 'Website', required: false, visible: false },
    { key: 'industry', label: 'Industry', required: false, visible: false },
    { key: 'city', label: 'City', required: false, visible: false },
    { key: 'country', label: 'Country', required: false, visible: false },
    { key: 'contact_source', label: 'Source', required: false, visible: false },
  ]);

  const fetchLeads = async () => {
    try {
      // First, fetch all leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (leadsError) throw leadsError;
      
      if (leadsData && leadsData.length > 0) {
        // Get unique contact_owner IDs
        const ownerIds = [...new Set(leadsData.map(lead => lead.contact_owner).filter(Boolean))];
        
        // Fetch owner profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ownerIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        }

        // Create a map of owner ID to full name
        const ownerMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            ownerMap.set(profile.id, profile.full_name);
          });
        }

        // Transform leads to include lead_owner_name
        const transformedLeads = leadsData.map(lead => ({
          ...lead,
          lead_owner_name: lead.contact_owner ? ownerMap.get(lead.contact_owner) || 'Unknown User' : 'No Owner'
        }));
        
        setLeads(transformedLeads);
      } else {
        setLeads([]);
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        variant: "destructive",
        title: "Error fetching leads",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Set up real-time subscription for leads
    const leadsSubscription = supabase
      .channel('leads-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
        console.log('Real-time lead change:', payload);
        
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [payload.new as Lead, ...prev]);
          toast({
            title: "New lead added",
            description: `${(payload.new as Lead).lead_name} has been added`,
          });
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(lead => 
            lead.id === payload.new.id 
              ? { ...lead, ...(payload.new as Lead) }
              : lead
          ));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
          toast({
            title: "Lead deleted",
            description: "A lead has been removed",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsSubscription);
    };
  }, []);

  return {
    leads,
    loading,
    columns,
    setColumns,
    fetchLeads,
  };
};
