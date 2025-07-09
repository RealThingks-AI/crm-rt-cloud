import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StagePanelDialog from './StagePanelDialog';

interface DealsListViewProps {
  deals: Deal[];
  onRefresh: () => void;
}

type SortField = 'deal_name' | 'stage' | 'probability' | 'closing_date' | 'amount' | 'modified_at';
type SortOrder = 'asc' | 'desc';

const DealsListView = ({ deals, onRefresh }: DealsListViewProps) => {
  const [sortField, setSortField] = useState<SortField>('modified_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [leadData, setLeadData] = useState<Record<string, any>>({});

  // Fetch lead data for all deals
  React.useEffect(() => {
    const fetchLeadData = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const leadIds = deals.filter(deal => deal.related_lead_id).map(deal => deal.related_lead_id!);
      
      if (leadIds.length === 0) return;

      try {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('id, lead_name, company_name, contact_owner')
          .in('id', leadIds);

        if (error) {
          console.error('Error fetching leads:', error);
          return;
        }

        // Fetch profiles for lead owners
        const ownerIds = leads?.filter(lead => lead.contact_owner).map(lead => lead.contact_owner) || [];
        let profiles: any[] = [];
        
        if (ownerIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', ownerIds);

          if (!profileError) {
            profiles = profileData || [];
          }
        }

        // Create lookup object
        const leadLookup: Record<string, any> = {};
        leads?.forEach(lead => {
          const owner = profiles.find(profile => profile.id === lead.contact_owner);
          leadLookup[lead.id] = {
            ...lead,
            owner_name: owner?.full_name || ''
          };
        });

        setLeadData(leadLookup);
      } catch (error) {
        console.error('Error in fetchLeadData:', error);
      }
    };

    fetchLeadData();
  }, [deals]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle special cases
      if (sortField === 'deal_name') {
        aValue = a.deal_name?.toLowerCase() || '';
        bValue = b.deal_name?.toLowerCase() || '';
      } else if (sortField === 'closing_date' || sortField === 'modified_at') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (sortField === 'amount' || sortField === 'probability') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [deals, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

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

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('deal_name')}
                >
                  Deal Title
                  <SortIcon field="deal_name" />
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">Lead Name</TableHead>
              <TableHead className="w-[150px]">Company</TableHead>
              <TableHead className="w-[120px]">Lead Owner</TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('stage')}
                >
                  Stage
                  <SortIcon field="stage" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('probability')}
                >
                  Probability
                  <SortIcon field="probability" />
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('closing_date')}
                >
                  Close Date
                  <SortIcon field="closing_date" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('amount')}
                >
                  Value
                  <SortIcon field="amount" />
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('modified_at')}
                >
                  Last Updated
                  <SortIcon field="modified_at" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeals.map((deal) => {
              const leadInfo = leadData[deal.related_lead_id || ''];
              return (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedDeal(deal)}
                >
                  <TableCell className="font-medium">
                    <div className="font-semibold text-foreground truncate">
                      {deal.deal_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {leadInfo?.lead_name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {leadInfo?.company_name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {leadInfo?.owner_name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStageColor(deal.stage)} text-xs`}>
                      {deal.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {deal.probability !== null && deal.probability !== undefined ? `${deal.probability}%` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formatDate(deal.closing_date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {formatCurrency(deal.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {formatDate(deal.modified_at)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedDeal && (
        <StagePanelDialog
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
          deal={selectedDeal}
          onSuccess={() => {
            setSelectedDeal(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default DealsListView;