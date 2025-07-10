
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

  // Fetch the first available lead as default
  useEffect(() => {
    const fetchDefaultLead = async () => {
      try {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching default lead:', error);
          return;
        }

        if (leads) {
          setDefaultLead(leads);
          setDealTitle(`Deal with ${leads.lead_name || leads.company_name}`);
          
          // Fetch lead owner if exists
          if (leads.contact_owner) {
            try {
              const { data, error } = await supabase.functions.invoke('get-user-display-names', {
                body: { userIds: [leads.contact_owner] }
              });

              if (error) {
                console.error('Error fetching user display name:', error);
              } else if (data?.userDisplayNames?.[leads.contact_owner]) {
                setLeadOwner({
                  id: leads.contact_owner,
                  full_name: data.userDisplayNames[leads.contact_owner]
                });
              }
            } catch (functionError) {
              console.error('Error calling get-user-display-names function:', functionError);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchDefaultLead:', error);
      }
    };

    if (open) {
      fetchDefaultLead();
    }
  }, [open]);

  const handleCreateDeal = async () => {
    if (!defaultLead) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No default lead available to create deal.",
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
        description: dealDescription,
        created_by: user.id,
        // Initialize with default values for stage progression
        probability: 10, // Default probability for Discussions stage
        currency: 'USD'
      };

      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (error) throw error;

      toast({
        title: "Deal created successfully",
        description: `Meeting has been linked to a new deal: ${dealTitle}`,
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
          {defaultLead && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Default Lead Information</h3>
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
