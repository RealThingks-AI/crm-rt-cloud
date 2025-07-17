
import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import KanbanBoard from '@/components/deals/KanbanBoard';
import DealsListView from '@/components/deals/DealsListView';
import DealsStats from '@/components/deals/DealsStats';
import AddDealDialog from '@/components/deals/AddDealDialog';
import EditDealDialog from '@/components/deals/EditDealDialog';
import ImportExportActions from '@/components/ImportExportActions';
import { useImportExport } from '@/hooks/useImportExport';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { useDeals, type Deal } from '@/hooks/useDeals';
import BulkActions from '@/components/BulkActions';

const Deals = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const { deals, loading, refetchDeals } = useDeals();
  
  const { 
    handleImport, 
    handleExportAll, 
    handleExportSelected, 
    handleExportFiltered 
  } = useImportExport({
    moduleName: 'Deals',
    onRefresh: refetchDeals,
    tableName: 'deals'
  });

  const { handleBulkDelete, isDeleting: isBulkDeleting } = useBulkDelete({
    tableName: 'deals',
    onRefresh: refetchDeals,
    clearSelection: () => setSelectedDealIds([])
  });

  const handleEditDeal = (deal: Deal) => {
    console.log('Edit deal:', deal);
    setSelectedDeal(deal);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDeal = (dealId: string) => {
    console.log('Delete deal:', dealId);
    setDealToDelete(dealId);
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedDealIds(deals.map(deal => deal.id));
    } else {
      setSelectedDealIds([]);
    }
  };

  const handleDealSelection = (dealId: string, selected: boolean) => {
    if (selected) {
      setSelectedDealIds(prev => [...prev, dealId]);
    } else {
      setSelectedDealIds(prev => prev.filter(id => id !== dealId));
    }
  };

  const handleBulkDeleteDeals = async (ids: string[]) => {
    await handleBulkDelete(ids);
  };

  const confirmDelete = async () => {
    if (!dealToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealToDelete);

      if (error) throw error;

      toast({
        title: "Deal deleted",
        description: "Deal has been successfully deleted.",
      });
      
      refetchDeals();
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast({
        variant: "destructive",
        title: "Error deleting deal",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setDealToDelete(null);
    }
  };

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
          <p className="text-gray-600 mt-2">
            Manage your sales pipeline with {viewMode === 'kanban' ? 'Kanban' : 'List'} view
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Toggle
              pressed={viewMode === 'kanban'}
              onPressedChange={() => setViewMode('kanban')}
              size="sm"
              className="data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </Toggle>
            <Toggle
              pressed={viewMode === 'list'}
              onPressedChange={() => setViewMode('list')}
              size="sm"
              className="data-[state=on]:bg-white data-[state=on]:shadow-sm"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Toggle>
          </div>
          
          <ImportExportActions
            onImport={handleImport}
            onExportAll={() => handleExportAll(deals)}
            onExportSelected={() => handleExportSelected(deals, selectedDealIds)}
            onExportFiltered={() => handleExportFiltered(deals)}
            hasSelected={selectedDealIds.length > 0}
            hasFiltered={false}
            moduleName="Deals"
          />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <DealsStats deals={deals} />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDealIds}
        onSelectAll={handleSelectAll}
        onDelete={handleBulkDeleteDeals}
        isAllSelected={selectedDealIds.length === deals.length && deals.length > 0}
        totalItems={deals.length}
      />

      {/* View Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard 
          deals={deals} 
          onRefresh={refetchDeals} 
          onEditDeal={handleEditDeal} 
          onDeleteDeal={setDealToDelete}
          selectedDealIds={selectedDealIds}
          onDealSelection={handleDealSelection}
        />
      ) : (
        <DealsListView 
          deals={deals} 
          onEdit={handleEditDeal}
          onDelete={handleDeleteDeal}
          selectedDealIds={selectedDealIds}
          onDealSelection={handleDealSelection}
        />
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

      {/* Edit Deal Dialog */}
      {selectedDeal && (
        <EditDealDialog
          deal={selectedDeal}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setSelectedDeal(null);
          }}
          onSuccess={() => {
            refetchDeals();
            setIsEditDialogOpen(false);
            setSelectedDeal(null);
          }}
          onDelete={handleDeleteDeal}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!dealToDelete} onOpenChange={() => setDealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Deals;
