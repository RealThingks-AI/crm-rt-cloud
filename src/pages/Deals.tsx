
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KanbanBoard from '@/components/deals/KanbanBoard';
import DealsStats from '@/components/deals/DealsStats';
import AddDealDialog from '@/components/deals/AddDealDialog';
import DealsImportExport from '@/components/deals/DealsImportExport';
import { useDeals } from '@/hooks/useDeals';

const Deals = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
          <p className="text-gray-600 mt-2">Manage your sales pipeline with our Kanban view</p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* Kanban Board */}
      <KanbanBoard deals={deals} onRefresh={refetchDeals} />

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
