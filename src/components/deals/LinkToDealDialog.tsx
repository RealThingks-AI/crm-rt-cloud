
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LinkToDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  onSuccess: () => void;
}

const LinkToDealDialog = ({ open, onOpenChange, meetingId, meetingTitle, onSuccess }: LinkToDealDialogProps) => {
  const [defaultLead, setDefaultLead] = useState<any>(null);
  const [leadOwner, setLeadOwner] = useState<any>(null);
  const [dealTitle, setDealTitle] = useState(`Deal from ${meetingTitle}`);
  const [dealDescription, setDealDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [meetingData, setMeetingData] = useState<any>(null);

  // Fetch meeting and related lead information
  useEffect(() => {
    const fetchMeetingAndLead = async () => {
      if (!open || !meetingId) return;

      try {
        console.log('Fetching meeting data for ID:', meetingId);
        
        // First fetch the meeting data
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single();

        if (meetingError) {
          console.error('Error fetching meeting:', meetingError);
          // If we can't fetch the meeting, try to get a default lead
          await fetchDefaultLead();
          return;
        }

        console.log('Fetched meeting:', meeting);
        setMeetingData(meeting);

        // Try to find a lead related to this meeting by checking participants email
        let relatedLead = null;
        if (meeting.participants && meeting.participants.length > 0) {
          for (const participant of meeting.participants) {
            const { data: lead, error } = await supabase
              .from('leads')
              .select('*')
              .eq('email', participant)
              .maybeSingle();

            if (!error && lead) {
              relatedLead = lead;
              console.log('Found related lead by email:', lead);
              break;
            }
          }
        }

        // If no related lead found, get the first available lead as fallback
        if (!relatedLead) {
          console.log('No related lead found, fetching default lead');
          await fetchDefaultLead();
        } else {
          setDefaultLead(relatedLead);
          setDealTitle(`Deal with ${relatedLead.lead_name || relatedLead.company_name || 'Lead'}`);
          
          // Fetch lead owner if exists
          if (relatedLead.contact_owner) {
            await fetchLeadOwner(relatedLead.contact_owner);
          }
        }
      } catch (error) {
        console.error('Error in fetchMeetingAndLead:', error);
        await fetchDefaultLead();
      }
    };

    const fetchDefaultLead = async () => {
      try {
        console.log('Fetching default lead as fallback');
        const { data: leads, error } = await supabase
          .from('leads')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching default lead:', error);
          return;
        }

        if (leads) {
          setDefaultLead(leads);
          setDealTitle(`Deal with ${leads.lead_name || leads.company_name || 'Lead'}`);
          
          // Fetch lead owner if exists
          if (leads.contact_owner) {
            await fetchLeadOwner(leads.contact_owner);
          }
        }
      } catch (error) {
        console.error('Error in fetchDefaultLead:', error);
      }
    };

    const fetchLeadOwner = async (contactOwnerId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('get-user-display-names', {
          body: { userIds: [contactOwnerId] }
        });

        if (error) {
          console.error('Error fetching user display name:', error);
        } else if (data?.userDisplayNames?.[contactOwnerId]) {
          setLeadOwner({
            id: contactOwnerId,
            full_name: data.userDisplayNames[contactOwnerId]
          });
        }
      } catch (functionError) {
        console.error('Error calling get-user-display-names function:', functionError);
      }
    };

    if (open) {
      // Reset state when dialog opens
      setDefaultLead(null);
      setLeadOwner(null);
      setDealTitle(`Deal from ${meetingTitle}`);
      setDealDescription('');
      
      fetchMeetingAndLead();
    }
  }, [open, meetingId, meetingTitle]);

  const handleCreateDeal = async () => {
    if (!defaultLead) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No lead available to create deal. Please create a lead first.",
      });
      return;
    }

    if (!meetingId) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Meeting ID is required to create deal.",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to create deals.",
        });
        return;
      }

      const dealData = {
        deal_name: dealTitle,
        stage: 'Discussions',
        related_meeting_id: meetingId,
        related_lead_id: defaultLead.id,
        description: dealDescription || `Deal created from meeting: ${meetingTitle}`,
        created_by: user.id,
        // Initialize with default values for stage progression
        probability: 10, // Default probability for Discussions stage
        currency: 'USD'
      };

      console.log('Creating deal with data:', dealData);

      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }

      toast({
        title: "Deal created successfully",
        description: `Meeting "${meetingTitle}" has been linked to deal: ${dealTitle}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        variant: "destructive",
        title: "Error creating deal",
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Meeting to Deals Pipeline</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* Title Field */}
          <div>
            <Label htmlFor="deal-title">Deal Title</Label>
            <Input
              id="deal-title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              placeholder="Enter deal title"
            />
          </div>

          {/* Default Lead Information - Only Essential Fields */}
          {defaultLead ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                {meetingData ? 'Related Lead Information' : 'Default Lead Information'}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Lead Name</Label>
                  <Input
                    value={defaultLead.lead_name || ''}
                    readOnly
                    className="bg-white"
                  />
                </div>
                
                {defaultLead.company_name && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                    <Input
                      value={defaultLead.company_name}
                      readOnly
                      className="bg-white"
                    />
                  </div>
                )}
                
                {leadOwner && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Lead Owner</Label>
                    <Input
                      value={leadOwner.full_name}
                      readOnly
                      className="bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-700">
                No leads available. Please create a lead first before linking to deals pipeline.
              </p>
            </div>
          )}

          {/* Description Field */}
          <div>
            <Label htmlFor="deal-description">Deal Description</Label>
            <Textarea
              id="deal-description"
              value={dealDescription}
              onChange={(e) => setDealDescription(e.target.value)}
              placeholder="Enter initial deal description or meeting notes..."
              rows={4}
            />
          </div>


          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDeal}
              disabled={isCreating || !defaultLead}
            >
              {isCreating ? 'Creating Deal...' : 'Create Deal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkToDealDialog;
