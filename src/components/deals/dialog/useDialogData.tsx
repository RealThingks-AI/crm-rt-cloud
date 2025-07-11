import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseDialogDataProps {
  open: boolean;
  meetingId: string;
  meetingTitle: string;
}

export const useDialogData = ({ open, meetingId, meetingTitle }: UseDialogDataProps) => {
  const [defaultLead, setDefaultLead] = useState<any>(null);
  const [leadOwner, setLeadOwner] = useState<any>(null);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Consolidated data fetching function
  const fetchAllData = async () => {
    const currentMeetingId = meetingId;
    const currentMeetingTitle = meetingTitle;
    
    if (!open || !currentMeetingId) {
      console.log('Skipping fetchAllData - open:', open, 'meetingId:', currentMeetingId);
      setDebugInfo(`Skipped: open=${open}, meetingId=${currentMeetingId}`);
      return;
    }

    setIsLoading(true);
    setDebugInfo(`Loading data for meeting: ${currentMeetingId} (${currentMeetingTitle})`);
    
    try {
      console.log('=== FETCH START ===');
      console.log('Fetching data for meeting ID:', currentMeetingId);
      console.log('Meeting title:', currentMeetingTitle);
      console.log('=================');
      
      // Fetch meeting data first with the current meetingId
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', currentMeetingId)
        .maybeSingle();

      console.log('Meeting query result:', { meeting, meetingError });
      setDebugInfo(prev => prev + ` | Meeting found: ${meeting ? meeting.meeting_title : 'None'}`);

      let selectedLead = null;
      let owner = null;
      
      if (!meetingError && meeting) {
        console.log('Setting meeting data:', meeting);
        setMeetingData(meeting);
        
        // Try to find related lead by participant email
        if (meeting.participants && meeting.participants.length > 0) {
          console.log('Searching for lead with participant emails:', meeting.participants);
          for (const participant of meeting.participants) {
            const { data: lead } = await supabase
              .from('leads')
              .select('*')
              .eq('email', participant)
              .maybeSingle();

            if (lead) {
              selectedLead = lead;
              console.log('Found related lead by email:', lead);
              setDebugInfo(prev => prev + ` | Lead found: ${lead.lead_name}`);
              break;
            }
          }
        }
      } else {
        console.error('Meeting fetch error or no meeting found:', meetingError);
        setDebugInfo(prev => prev + ` | Meeting Error: ${meetingError?.message || 'Not found'}`);
      }

      // If no related lead found, don't fetch a default lead
      // We'll create the deal with meeting information instead
      if (!selectedLead) {
        console.log('No related lead found, will use meeting information for deal');
      }

      // Fetch lead owner if lead exists and has contact_owner
      if (selectedLead?.contact_owner) {
        try {
          const { data, error } = await supabase.functions.invoke('get-user-display-names', {
            body: { userIds: [selectedLead.contact_owner] }
          });

          if (!error && data?.userDisplayNames?.[selectedLead.contact_owner]) {
            owner = {
              id: selectedLead.contact_owner,
              full_name: data.userDisplayNames[selectedLead.contact_owner]
            };
          }
        } catch (error) {
          console.error('Error fetching lead owner:', error);
        }
      }

      // Set all data at once to prevent multiple re-renders
      const newDealTitle = selectedLead 
        ? `Deal with ${selectedLead.lead_name || selectedLead.company_name || 'Lead'}`
        : `Deal from ${currentMeetingTitle}`;
        
      console.log('Setting final state - Deal title:', newDealTitle);
      console.log('Selected lead:', selectedLead);
      console.log('Lead owner:', owner);
      
      setDefaultLead(selectedLead);
      setLeadOwner(owner);
      setDebugInfo(prev => prev + ` | Final: ${newDealTitle}`);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setDebugInfo(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset and fetch data when dialog opens
  useEffect(() => {
    console.log('LinkToDealDialog useEffect triggered');
    console.log('Props - open:', open, 'meetingId:', meetingId, 'meetingTitle:', meetingTitle);
    
    if (open && meetingId) {
      console.log('=== RESETTING STATE ===');
      console.log('Resetting for meeting:', meetingId, meetingTitle);
      
      // AGGRESSIVE state reset
      setDefaultLead(null);
      setLeadOwner(null);
      setMeetingData(null);
      setDebugInfo(`Reset for: ${meetingId}`);
      
      // Small delay to ensure state is cleared
      setTimeout(() => {
        fetchAllData();
      }, 50);
    }
  }, [open, meetingId, meetingTitle]);

  return {
    defaultLead,
    leadOwner,
    meetingData,
    isLoading,
    debugInfo
  };
};