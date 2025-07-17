import { supabase } from '@/integrations/supabase/client';
import type { Deal } from '@/hooks/useDeals';

interface LeadInfo {
  lead_name?: string;
  company_name?: string;
  phone_no?: string;
  contact_owner?: string;
  profiles?: {
    full_name?: string;
    "Email ID"?: string;
  } | null;
}

export const enrichDealsWithLeadInfo = async (deals: Deal[]): Promise<Deal[]> => {
  // Get unique lead IDs from deals that have related_lead_id
  const leadIds = deals
    .map(deal => deal.related_lead_id)
    .filter((id): id is string => !!id);

  if (leadIds.length === 0) {
    return deals;
  }

  try {
    // Fetch leads with profile information
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_name,
        company_name,
        phone_no,
        contact_owner
      `)
      .in('id', leadIds);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return deals;
    }

    // Get unique contact owner IDs to fetch profiles
    const ownerIds = leads
      ?.map(lead => lead.contact_owner)
      .filter((id): id is string => !!id) || [];

    let profiles: any[] = [];
    if (ownerIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, "Email ID"')
        .in('id', ownerIds);

      if (!profilesError) {
        profiles = profilesData || [];
      }
    }

    // Create a map for quick lookup
    const leadsMap = new Map<string, LeadInfo>();
    leads?.forEach(lead => {
      const profile = profiles.find(p => p.id === lead.contact_owner);
      leadsMap.set(lead.id, {
        lead_name: lead.lead_name,
        company_name: lead.company_name,
        phone_no: lead.phone_no,
        contact_owner: lead.contact_owner,
        profiles: profile || null
      });
    });

    // Enrich deals with lead information
    return deals.map(deal => {
      if (!deal.related_lead_id) {
        return deal;
      }

      const leadInfo = leadsMap.get(deal.related_lead_id);
      if (!leadInfo) {
        return deal;
      }

      // Format lead owner name
      let lead_owner = '';
      if (leadInfo.profiles) {
        const profile = leadInfo.profiles;
        if (profile.full_name && profile.full_name !== profile["Email ID"]) {
          lead_owner = profile.full_name;
        } else if (profile["Email ID"]) {
          // Extract name from email (part before @)
          lead_owner = profile["Email ID"].split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      // If no lead owner found, set to empty string instead of undefined
      if (!lead_owner) {
        lead_owner = '';
      }

      return {
        ...deal,
        company_name: leadInfo.company_name,
        lead_name: leadInfo.lead_name,
        lead_owner: lead_owner,
        phone_no: leadInfo.phone_no,
      };
    });

  } catch (error) {
    console.error('Error enriching deals with lead info:', error);
    return deals;
  }
};