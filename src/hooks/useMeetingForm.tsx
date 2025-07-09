
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTeamsMeeting } from '@/hooks/useTeamsMeeting';

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link?: string;
  description?: string;
}

interface Deal {
  id: string;
  deal_name: string;
  description?: string;
  related_lead_id?: string;
}

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  contact_owner?: string;
}

interface LeadOwner {
  id: string;
  full_name: string;
}

export const useMeetingForm = (
  meeting: Meeting | null | undefined,
  dealId?: string,
  initialLeadData?: any
) => {
  const isEditing = !!meeting;
  const { createOrUpdateTeamsLink } = useTeamsMeeting();
  
  const [formData, setFormData] = useState({
    meeting_title: '',
    date: '',
    start_time: '',
    duration: '1 hour' as '30 min' | '1 hour',
    location: 'Online' as 'Online' | 'In-Person',
    timezone: 'Asia/Kolkata',
    participants: [] as string[],
    teams_link: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealInfo, setDealInfo] = useState<Deal | null>(null);
  const [linkedLead, setLinkedLead] = useState<Lead | null>(null);
  const [leadOwner, setLeadOwner] = useState<LeadOwner | null>(null);
  const [dealDescription, setDealDescription] = useState('');
  const [editableDealTitle, setEditableDealTitle] = useState('');
  const [editableLeadOwner, setEditableLeadOwner] = useState('');

  // Fetch deal and lead information when dealId is provided
  useEffect(() => {
    const fetchDealContext = async () => {
      if (dealId && meeting) {
        try {
          console.log('Fetching deal context for dealId:', dealId);
          
          // Fetch deal information
          const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

          if (dealError) {
            console.error('Error fetching deal:', dealError);
            return;
          }

          console.log('Fetched deal:', deal);
          setDealInfo(deal);
          setDealDescription(deal.description || '');
          setEditableDealTitle(deal.deal_name || '');

          // Fetch linked lead if exists
          if (deal.related_lead_id) {
            const { data: lead, error: leadError } = await supabase
              .from('leads')
              .select('*')
              .eq('id', deal.related_lead_id)
              .single();

            if (leadError) {
              console.error('Error fetching lead:', leadError);
              return;
            }

            console.log('Fetched linked lead:', lead);
            setLinkedLead(lead);

            // Fetch lead owner if exists
            if (lead.contact_owner) {
              const { data: owner, error: ownerError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', lead.contact_owner)
                .single();

              if (!ownerError && owner) {
                setLeadOwner(owner);
                setEditableLeadOwner(owner.full_name);
              }
            }
          }
        } catch (error) {
          console.error('Error in fetchDealContext:', error);
        }
      }
    };

    fetchDealContext();
  }, [dealId, meeting]);

  useEffect(() => {
    if (meeting) {
      setFormData({
        meeting_title: meeting.meeting_title || '',
        date: meeting.date || '',
        start_time: meeting.start_time || '',
        duration: (meeting.duration === '15 min' || meeting.duration === '2 hours') ? '1 hour' : meeting.duration as '30 min' | '1 hour',
        location: meeting.location || 'Online',
        timezone: meeting.timezone || 'Asia/Kolkata',
        participants: meeting.participants || [],
        teams_link: meeting.teams_link || '',
        description: meeting.description || ''
      });
    } else if (initialLeadData) {
      setFormData(prev => ({
        ...prev,
        meeting_title: `Meeting with ${initialLeadData.lead_name}`,
        participants: initialLeadData.email ? [initialLeadData.email] : []
      }));
    }
  }, [meeting, initialLeadData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);
    return { date, time };
  };

  const isDateTimeInPast = (selectedDate: string, selectedTime: string) => {
    if (!selectedDate || !selectedTime) return false;
    
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const now = new Date();
    
    return selectedDateTime < now;
  };

  const handleSubmit = async (
    e: React.FormEvent,
    isLinkedToDeal: boolean,
    onSuccess: () => void
  ) => {
    e.preventDefault();
    
    if (isDateTimeInPast(formData.date, formData.start_time)) {
      toast({
        variant: "destructive",
        title: "Invalid Date/Time",
        description: "Meeting date and time cannot be in the past.",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to manage meetings.",
        });
        return;
      }

      // If we're in deal editing mode, update both meeting and deal
      if (dealId && dealInfo && isLinkedToDeal) {
        // Update deal information
        const { error: dealError } = await supabase
          .from('deals')
          .update({
            deal_name: editableDealTitle,
            description: dealDescription,
            modified_at: new Date().toISOString(),
            modified_by: user.id
          })
          .eq('id', dealId);

        if (dealError) {
          console.error('Error updating deal:', dealError);
          throw dealError;
        }

        // Update lead owner if changed and lead exists
        if (linkedLead && editableLeadOwner !== leadOwner?.full_name) {
          // Find the user ID for the new owner name
          const { data: newOwner, error: ownerError } = await supabase
            .from('profiles')
            .select('id')
            .eq('full_name', editableLeadOwner)
            .single();

          if (!ownerError && newOwner) {
            const { error: leadError } = await supabase
              .from('leads')
              .update({
                contact_owner: newOwner.id,
                modified_time: new Date().toISOString(),
                modified_by: user.id
              })
              .eq('id', linkedLead.id);

            if (leadError) {
              console.error('Error updating lead owner:', leadError);
            }
          }
        }

        toast({
          title: "Deal updated successfully",
          description: "Deal information has been updated.",
        });

        onSuccess();
        return;
      }

      let teamsLink = formData.teams_link;
      
      if (formData.location === 'Online') {
        const updatedTeamsLink = await createOrUpdateTeamsLink({
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          participants: formData.participants,
          location: formData.location,
          timezone: formData.timezone,
          isEditing,
          existingTeamsLink: meeting?.teams_link
        });
        if (updatedTeamsLink) {
          teamsLink = updatedTeamsLink;
        }
      }

      console.log(`${isEditing ? 'Updating' : 'Creating'} meeting data:`, formData);

      if (isEditing) {
        const updateData = {
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          location: formData.location,
          timezone: formData.timezone,
          participants: formData.participants,
          teams_link: teamsLink,
          description: formData.description,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('meetings')
          .update(updateData)
          .eq('id', meeting!.id);

        if (error) {
          console.error('Error updating meeting:', error);
          throw error;
        }

        // If we're in deal context, also update the deal description
        if (dealId && dealInfo && !isLinkedToDeal) {
          const { error: dealError } = await supabase
            .from('deals')
            .update({
              description: dealDescription,
              modified_at: new Date().toISOString(),
              modified_by: user.id
            })
            .eq('id', dealId);

          if (dealError) {
            console.error('Error updating deal:', dealError);
            toast({
              variant: "destructive",
              title: "Warning",
              description: "Meeting updated but failed to update deal description.",
            });
          }
        }
      } else {
        const insertData = {
          meeting_title: formData.meeting_title,
          date: formData.date,
          start_time: formData.start_time,
          duration: formData.duration,
          location: formData.location,
          timezone: formData.timezone,
          participants: formData.participants,
          teams_link: teamsLink,
          description: formData.description,
          created_by: user.id
        };

        const { error } = await supabase
          .from('meetings')
          .insert(insertData);

        if (error) {
          console.error('Error creating meeting:', error);
          throw error;
        }
      }

      toast({
        title: `${isLinkedToDeal ? 'Deal' : 'Meeting'} ${isEditing ? 'updated' : 'created'} successfully`,
        description: teamsLink && teamsLink !== (meeting?.teams_link || '') && !isLinkedToDeal
          ? `Meeting has been ${isEditing ? 'updated' : 'created'} and Teams link has been ${isEditing ? 'refreshed' : 'generated'}!` 
          : `${isLinkedToDeal ? 'Deal' : 'Meeting'} has been ${isEditing ? 'updated' : 'created'} successfully!`,
      });

      onSuccess();
    } catch (error: any) {
      console.error(`Error in handle${isEditing ? 'Update' : 'Create'}:`, error);
      toast({
        variant: "destructive",
        title: `Error ${isEditing ? 'updating' : 'creating'} ${isLinkedToDeal ? 'deal' : 'meeting'}`,
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    dealInfo,
    linkedLead,
    leadOwner,
    dealDescription,
    editableDealTitle,
    editableLeadOwner,
    handleInputChange,
    getCurrentDateTime,
    isDateTimeInPast,
    handleSubmit,
    setDealDescription,
    setEditableDealTitle,
    setEditableLeadOwner
  };
};
