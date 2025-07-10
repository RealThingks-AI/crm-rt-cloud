
import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Building, CheckCircle, AlertCircle, XCircle, DollarSign, Percent } from 'lucide-react';
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
        className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group ${
          isDragging ? 'opacity-50 rotate-2' : ''
        } ${isDraggingDisabled ? 'cursor-not-allowed opacity-70' : 'hover:border-gray-300'}`}
        onClick={() => setIsStagePanelOpen(true)}
        {...attributes}
        {...listeners}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold text-gray-900 mb-3 leading-tight line-clamp-2">
                {deal.deal_name}
              </CardTitle>
              
              {/* Company and Owner Info */}
              <div className="space-y-2">
                <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                  <Building className="h-3 w-3 mr-1.5 text-gray-500 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {linkedLead?.company_name || 'No Company'}
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-md">
                  <User className="h-3 w-3 mr-1.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">
                    {linkedLeadOwner?.full_name || 'No Owner'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Completion Status */}
            <div className="flex-shrink-0">
              {getCompletionIcon()}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Stage Badge */}
          <div className="flex justify-center">
            <Badge className={`${getStageColor(deal.stage)} text-xs font-medium px-3 py-1 rounded-full`}>
              {deal.stage}
            </Badge>
          </div>
          
          {/* Deal Metrics */}
          <div className="space-y-2.5">
            {deal.amount && (
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center text-xs text-green-700">
                  <DollarSign className="h-3 w-3 mr-1.5" />
                  <span>Value</span>
                </div>
                <span className="text-xs font-semibold text-green-800">
                  {formatCurrency(deal.amount)}
                </span>
              </div>
            )}
            
            {deal.probability !== null && deal.probability !== undefined && (
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center text-xs text-purple-700">
                  <Percent className="h-3 w-3 mr-1.5" />
                  <span>Probability</span>
                </div>
                <span className="text-xs font-semibold text-purple-800">
                  {deal.probability}%
                </span>
              </div>
            )}
            
            {deal.closing_date && (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center text-xs text-orange-700">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  <span>Close Date</span>
                </div>
                <span className="text-xs font-semibold text-orange-800">
                  {new Date(deal.closing_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {isDraggingDisabled && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-700 font-medium text-center">
                Complete requirements to move
              </div>
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
