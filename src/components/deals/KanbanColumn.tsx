
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
    <div className="flex flex-col h-full min-w-[300px]">
      <Card className={`flex flex-col h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${isOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-gray-300'}`}>
        <CardHeader className="flex-shrink-0 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-semibold text-foreground">{stage}</CardTitle>
            <Badge variant="outline" className={`${getStageColor(stage)} text-xs font-medium px-2 py-1 border-0`}>
              {deals.length}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">{getStageDescription(stage)}</p>
          
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
            <div className="space-y-1 mt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ready to advance</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5 bg-gray-200" />
            </div>
          )}
        </CardHeader>
        
        <CardContent
          ref={setNodeRef}
          className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[400px] bg-gray-50/20"
        >
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onRefresh={onRefresh} />
          ))}
          
          {deals.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <div className="text-2xl text-gray-400">📋</div>
              </div>
              <p className="text-sm text-muted-foreground">No deals in this stage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanColumn;
