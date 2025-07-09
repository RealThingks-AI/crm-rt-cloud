
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
    <Card className={`h-fit min-h-[500px] ${isOver ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{stage}</CardTitle>
          </div>
          <Badge variant="secondary" className={getStageColor(stage)}>
            {deals.length}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">{getStageDescription(stage)}</p>
        
        {totalValue > 0 && (
          <p className="text-xs font-medium text-gray-700">
            ${totalValue.toLocaleString()}
          </p>
        )}
        
        {/* Progress indicator for non-final stages */}
        {!['Won', 'Lost', 'Dropped'].includes(stage) && deals.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Ready to advance</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1" />
          </div>
        )}
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="space-y-3 min-h-[400px] p-3"
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onRefresh={onRefresh} />
        ))}
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;
