
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
        className={`w-72 bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer rounded-lg ${
          isDragging ? 'opacity-50 rotate-2' : ''
        } ${isDraggingDisabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/20'}`}
        onClick={() => setIsStagePanelOpen(true)}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="pb-4 px-4 pt-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-foreground mb-3 line-clamp-2 leading-tight">
                {deal.deal_name}
              </CardTitle>
              
              {/* Essential Fields Only */}
              <div className="space-y-2">
                {linkedLead?.lead_name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5 mr-2 text-primary/60" />
                    <span className="font-medium truncate">{linkedLead.lead_name}</span>
                  </div>
                )}
                {linkedLead?.company_name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="h-3.5 w-3.5 mr-2 text-primary/60" />
                    <span className="font-medium truncate">{linkedLead.company_name}</span>
                  </div>
                )}
                {linkedLeadOwner && (
                  <div className="text-sm text-muted-foreground">
                    <span className="text-xs">Owner:</span> <span className="font-medium">{linkedLeadOwner.full_name}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Completion Status */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className={`${getStageColor(deal.stage)} text-xs font-medium px-2 py-1`}>
                {deal.stage}
              </Badge>
              {getCompletionIcon()}
            </div>
          </div>
        </CardHeader>

        {isDraggingDisabled && (
          <CardContent className="px-4 pb-4 pt-0">
            <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
              <div className="text-xs text-orange-700 font-medium text-center">
                Complete requirements to move
              </div>
            </div>
          </CardContent>
        )}
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
