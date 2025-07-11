import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDialogData } from './useDialogData';
import { useDealCreation } from './useDealCreation';
import { DebugInfoPanel } from './DebugInfoPanel';
import { DealTitleField } from './DealTitleField';
import { LeadInformationSection } from './LeadInformationSection';
import { DealDescriptionField } from './DealDescriptionField';
import { DialogActions } from './DialogActions';

interface LinkToDealDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  onSuccess: () => void;
}

export const LinkToDealDialogContent = ({ 
  open, 
  onOpenChange, 
  meetingId, 
  meetingTitle, 
  onSuccess 
}: LinkToDealDialogContentProps) => {
  const [dealTitle, setDealTitle] = useState('');
  const [dealDescription, setDealDescription] = useState('');

  const {
    defaultLead,
    leadOwner,
    meetingData,
    isLoading,
    debugInfo
  } = useDialogData({ open, meetingId, meetingTitle });

  const { isCreating, handleCreateDeal } = useDealCreation({
    meetingId,
    meetingTitle,
    onSuccess,
    onOpenChange
  });

  // Update deal title when data is loaded
  useEffect(() => {
    if (defaultLead) {
      setDealTitle(`Deal with ${defaultLead.lead_name || defaultLead.company_name || 'Lead'}`);
    } else if (meetingTitle) {
      setDealTitle(`Deal from ${meetingTitle}`);
    }
    setDealDescription('');
  }, [defaultLead, meetingTitle]);

  const onCreateDealClick = () => {
    handleCreateDeal(dealTitle, dealDescription, defaultLead, meetingData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Link Meeting to Deals Pipeline</DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading meeting data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <DealTitleField value={dealTitle} onChange={setDealTitle} />

          <LeadInformationSection 
            defaultLead={defaultLead}
            leadOwner={leadOwner}
            meetingData={meetingData}
          />

          <DealDescriptionField value={dealDescription} onChange={setDealDescription} />

          <DialogActions
            isCreating={isCreating}
            isLoading={isLoading}
            defaultLead={defaultLead}
            meetingData={meetingData}
            onCancel={() => onOpenChange(false)}
            onCreateDeal={onCreateDealClick}
          />
        </div>
      )}
    </DialogContent>
  );
};