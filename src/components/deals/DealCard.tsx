
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Building, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Deal, getStageCompletionStatus } from '@/hooks/useDeals';
import StagePanelDialog from './StagePanelDialog';

interface DealCardProps {
  deal: Deal;
  onRefresh: () => void;
}

const DealCard = ({ deal, onRefresh }: DealCardProps) => {
  const [isStagePanelOpen, setIsStagePanelOpen] = useState(false);
  const [linkedLead, setLinkedLead] = useState<any>(null);
  const [linkedLeadOwner, setLinkedLeadOwner] = useState<any>(null);

  const completionStatus = getStageCompletionStatus(deal);
  const isDraggingDisabled = completionStatus !== 'complete' && !['Won', 'Lost', 'Dropped'].includes(deal.stage);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: deal.id,
    disabled: isDraggingDisabled,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Fetch linked lead data when component mounts
  React.useEffect(() => {
    const fetchLeadData = async () => {
      if (!deal.related_lead_id) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('lead_name, company_name, contact_owner')
          .eq('id', deal.related_lead_id)
          .single();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          return;
        }

        setLinkedLead(lead);

        // Fetch lead owner profile if contact_owner exists
        if (lead.contact_owner) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', lead.contact_owner)
            .single();

          if (!profileError && profile) {
            setLinkedLeadOwner(profile);
          }
        }
      } catch (error) {
        console.error('Error in fetchLeadData:', error);
      }
    };

    fetchLeadData();
  }, [deal.related_lead_id]);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Discussions': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-yellow-100 text-yellow-800',
      'RFQ': 'bg-orange-100 text-orange-800',
      'Offered': 'bg-purple-100 text-purple-800',
      'Won': 'bg-green-100 text-green-800',
      'Lost': 'bg-red-100 text-red-800',
      'Dropped': 'bg-gray-100 text-gray-600'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionIcon = () => {
    switch (completionStatus) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'incomplete':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: deal.currency || 'USD'
    }).format(amount);
  };

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
          isDragging ? 'opacity-50' : ''
        } ${isDraggingDisabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={() => setIsStagePanelOpen(true)}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium text-gray-900 mb-2">
                {deal.deal_name}
              </CardTitle>
              
              {/* Company and Lead Info - Read-only data synced from Meetings */}
              <div className="space-y-1">
                {linkedLead?.company_name && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Building className="h-3 w-3 mr-1" />
                    <span className="font-medium">{linkedLead.company_name}</span>
                  </div>
                )}
                {linkedLead?.lead_name && (
                  <div className="flex items-center text-xs text-gray-600">
                    <User className="h-3 w-3 mr-1" />
                    <span>{linkedLead.lead_name}</span>
                  </div>
                )}
                {linkedLeadOwner && (
                  <div className="text-xs text-gray-500">
                    Owner: {linkedLeadOwner.full_name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Stage completion indicator - no action buttons for Discussions */}
            <div className="flex items-center gap-1">
              {getCompletionIcon()}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-3">
            <Badge className={getStageColor(deal.stage)}>
              {deal.stage}
            </Badge>
          </div>
          
          <div className="space-y-2 text-xs text-gray-600">
            {deal.amount && (
              <div className="flex justify-between">
                <span>Value:</span>
                <span className="font-medium">{formatCurrency(deal.amount)}</span>
              </div>
            )}
            
            {deal.probability !== null && deal.probability !== undefined && (
              <div className="flex justify-between">
                <span>Probability:</span>
                <span className="font-medium">{deal.probability}%</span>
              </div>
            )}
            
            {deal.closing_date && (
              <div className="flex justify-between">
                <span>Close Date:</span>
                <span className="font-medium">
                  {new Date(deal.closing_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {isDraggingDisabled && (
            <div className="mt-2 text-xs text-orange-600 font-medium">
              Complete requirements to move
            </div>
          )}
        </CardContent>
      </Card>

      <StagePanelDialog
        open={isStagePanelOpen}
        onOpenChange={setIsStagePanelOpen}
        deal={deal}
        onSuccess={() => {
          setIsStagePanelOpen(false);
          onRefresh();
        }}
      />
    </>
  );
};

export default DealCard;
