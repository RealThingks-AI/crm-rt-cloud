
import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import KanbanBoard from '@/components/deals/KanbanBoard';
import DealsListView from '@/components/deals/DealsListView';
import DealsStats from '@/components/deals/DealsStats';
import AddDealDialog from '@/components/deals/AddDealDialog';
import DealsImportExport from '@/components/deals/DealsImportExport';
import { useDeals } from '@/hooks/useDeals';

const Deals = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { deals, loading, refetchDeals } = useDeals();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
          <p className="text-gray-600 mt-2">Manage your sales pipeline with Kanban and List views</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Toggle
              pressed={viewMode === 'kanban'}
              onPressedChange={() => setViewMode('kanban')}
              className="data-[state=on]:bg-white data-[state=on]:text-primary"
              size="sm"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </Toggle>
            <Toggle
              pressed={viewMode === 'list'}
              onPressedChange={() => setViewMode('list')}
              className="data-[state=on]:bg-white data-[state=on]:text-primary"
              size="sm"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Toggle>
          </div>
          
          <DealsImportExport 
            deals={deals}
            onImportSuccess={refetchDeals}
          />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <DealsStats deals={deals} />

      {/* View Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard deals={deals} onRefresh={refetchDeals} />
      ) : (
        <DealsListView deals={deals} onRefresh={refetchDeals} />
      )}

      {/* Add Deal Dialog */}
      <AddDealDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          refetchDeals();
          setIsAddDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Deals;
