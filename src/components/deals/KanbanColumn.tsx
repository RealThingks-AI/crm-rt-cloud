
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DealCard from './DealCard';
import { Deal, canMoveToStage } from '@/hooks/useDeals';

interface KanbanColumnProps {
  stage: string;
  deals: Deal[];
  onRefresh: () => void;
}

const getStageColor = (stage: string) => {
  const colors: Record<string, string> = {
    'Discussions': 'bg-blue-100 text-blue-800',
    'Qualified': 'bg-yellow-100 text-yellow-800',
    'RFQ': 'bg-orange-100 text-orange-800',
    'Offered': 'bg-purple-100 text-purple-800',
    'Won': 'bg-green-100 text-green-800',
    'Lost': 'bg-red-100 text-red-800',
    'Dropped': 'bg-gray-100 text-gray-600',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800';
};

const getStageDescription = (stage: string) => {
  const descriptions: Record<string, string> = {
    'Discussions': 'Initial discussions and exploration',
    'Qualified': 'Opportunity confirmed and qualified',
    'RFQ': 'Request for Quotation stage',
    'Offered': 'Proposal submitted to client',
    'Won': 'Deal successfully closed',
    'Lost': 'Deal lost to competition or other factors',
    'Dropped': 'Deal dropped due to various reasons',
  };
  return descriptions[stage] || '';
};

const getStageProgress = (deals: Deal[]) => {
  if (deals.length === 0) return 0;
  
  const completedDeals = deals.filter(deal => {
    const nextStages: Record<string, string> = {
      'Discussions': 'Qualified',
      'Qualified': 'RFQ',
      'RFQ': 'Offered',
      'Offered': 'Won'
    };
    
    const nextStage = nextStages[deal.stage];
    return nextStage ? canMoveToStage(deal, nextStage) : true;
  });
  
  return Math.round((completedDeals.length / deals.length) * 100);
};

const KanbanColumn = ({ stage, deals, onRefresh }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const progressPercentage = getStageProgress(deals);

  return (
    <Card className={`h-fit min-h-[500px] bg-white border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200 ${isOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-gray-200'}`}>
      <CardHeader className="pb-4 px-4 pt-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold text-foreground">{stage}</CardTitle>
            <Badge variant="outline" className={`${getStageColor(stage)} text-xs font-medium px-2 py-1 border-0`}>
              {deals.length}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{getStageDescription(stage)}</p>
        
        {totalValue > 0 && (
          <p className="text-sm font-semibold text-foreground">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact'
            }).format(totalValue)}
          </p>
        )}
        
        {/* Progress indicator for non-final stages */}
        {!['Won', 'Lost', 'Dropped'].includes(stage) && deals.length > 0 && (
          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ready to advance</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-gray-100" />
          </div>
        )}
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="space-y-4 min-h-[400px] p-4 bg-gray-50/30"
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onRefresh={onRefresh} />
        ))}
        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No deals in this stage</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;
