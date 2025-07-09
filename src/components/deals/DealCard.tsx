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
          .maybeSingle();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          return;
        }

        if (lead) {
          setLinkedLead(lead);

          // Fetch lead owner profile if contact_owner exists
          if (lead.contact_owner) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', lead.contact_owner)
              .maybeSingle();

            if (!profileError && profile) {
              setLinkedLeadOwner(profile);
            }
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

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`w-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-lg ${
          isDragging ? 'opacity-50 rotate-1' : ''
        } ${isDraggingDisabled ? 'cursor-not-allowed opacity-70' : 'hover:border-primary/30 hover:-translate-y-0.5'}`}
        onClick={() => setIsStagePanelOpen(true)}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="p-4 pb-3">
          <div className="space-y-3">
            {/* Deal Title */}
            <CardTitle className="text-sm font-semibold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
              {deal.deal_name}
            </CardTitle>
            
            {/* Essential Information */}
            <div className="space-y-2">
              {linkedLead?.lead_name && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate font-medium">{linkedLead.lead_name}</span>
                </div>
              )}
              
              {linkedLead?.company_name && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-3.5 w-3.5 mr-2 text-emerald-500 flex-shrink-0" />
                  <span className="truncate font-medium">{linkedLead.company_name}</span>
                </div>
              )}
              
              {linkedLeadOwner && (
                <div className="text-sm text-muted-foreground">
                  <span className="text-xs opacity-75">Owner:</span> 
                  <span className="font-medium ml-1">{linkedLeadOwner.full_name}</span>
                </div>
              )}
            </div>

            {/* Stage Badge and Status */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Badge variant="secondary" className={`${getStageColor(deal.stage)} text-xs font-medium px-2 py-1 border-0`}>
                {deal.stage}
              </Badge>
              <div className="flex items-center">
                {getCompletionIcon()}
              </div>
            </div>
          </div>
        </CardHeader>

        {isDraggingDisabled && (
          <div className="px-4 pb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
              <div className="text-xs text-amber-700 font-medium text-center">
                Complete requirements to advance
              </div>
            </div>
          </div>
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