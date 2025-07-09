
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
            const { data: owner, error: ownerError } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', leads.contact_owner)
              .single();

            if (!ownerError && owner) {
              setLeadOwner(owner);
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">New Deal Creation</h3>
            <p className="text-sm text-blue-700">
              This will create a new deal in the "Discussions" stage and link it to your meeting. 
              You can then progress through the pipeline stages as requirements are met.
            </p>
          </div>

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

          {/* Pipeline Stage Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Pipeline Process</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span><strong>Discussions:</strong> Initial exploration and need identification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span><strong>Qualified:</strong> Requirements confirmed, NDA signed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span><strong>RFQ:</strong> Request for quotation submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span><strong>Offered:</strong> Proposal sent and under negotiation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong>Won/Lost/Dropped:</strong> Final outcomes</span>
              </div>
            </div>
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
