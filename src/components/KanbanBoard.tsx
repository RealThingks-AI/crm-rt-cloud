import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Deal, DealStage, DEAL_STAGES, STAGE_COLORS, getRequiredFieldsForStage, getStageIndex, getNextStage } from "@/types/deal";
import { DealCard } from "./DealCard";
import { Button } from "@/components/common/ui/button";
import { Checkbox } from "@/components/common/ui/checkbox";
import { Input } from "@/components/common/ui/input";
import { Plus, Trash2, Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BulkActionsBar } from "./BulkActionsBar";
import { ImportExportBar } from "./ImportExportBar";

interface KanbanBoardProps {
  deals: Deal[];
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: DealStage) => void;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: Partial<Deal>[]) => void;
}

export const KanbanBoard = ({ 
  deals, 
  onUpdateDeal, 
  onDealClick, 
  onCreateDeal, 
  onDeleteDeals, 
  onImportDeals 
}: KanbanBoardProps) => {
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filterDeals = (deals: Deal[]) => {
    if (!searchTerm) return deals;
    
    const searchValue = searchTerm.toLowerCase();
    return deals.filter(deal => 
      deal.project_name?.toLowerCase().includes(searchValue) ||
      deal.customer_name?.toLowerCase().includes(searchValue) ||
      deal.lead_name?.toLowerCase().includes(searchValue) ||
      deal.lead_owner?.toLowerCase().includes(searchValue) ||
      deal.region?.toLowerCase().includes(searchValue) ||
      deal.internal_comment?.toLowerCase().includes(searchValue) ||
      deal.customer_need?.toLowerCase().includes(searchValue) ||
      deal.customer_challenges?.toLowerCase().includes(searchValue) ||
      deal.relationship_strength?.toLowerCase().includes(searchValue) ||
      deal.budget?.toLowerCase().includes(searchValue) ||
      deal.business_value?.toLowerCase().includes(searchValue) ||
      deal.decision_maker_level?.toLowerCase().includes(searchValue) ||
      deal.project_type?.toLowerCase().includes(searchValue) ||
      deal.currency_type?.toLowerCase().includes(searchValue) ||
      deal.action_items?.toLowerCase().includes(searchValue) ||
      deal.current_status?.toLowerCase().includes(searchValue) ||
      deal.won_reason?.toLowerCase().includes(searchValue) ||
      deal.lost_reason?.toLowerCase().includes(searchValue) ||
      deal.need_improvement?.toLowerCase().includes(searchValue) ||
      deal.drop_reason?.toLowerCase().includes(searchValue) ||
      deal.stage?.toLowerCase().includes(searchValue) ||
      String(deal.priority || '').includes(searchValue) ||
      String(deal.probability || '').includes(searchValue) ||
      String(deal.duration || '').includes(searchValue) ||
      String(deal.revenue || '').includes(searchValue) ||
      String(deal.total_contract_value || '').includes(searchValue)
    );
  };

  const getDealsByStage = (stage: DealStage) => {
    const filteredDeals = filterDeals(deals);
    return filteredDeals.filter(deal => deal.stage === stage);
  };

  const onDragStart = (start: any) => {
    setDraggedDeal(start.draggableId);
  };

  const validateRequiredFields = (deal: Deal): boolean => {
    const requiredFields = getRequiredFieldsForStage(deal.stage);
    
    return requiredFields.every(field => {
      const value = deal[field as keyof Deal];
      
      // Handle boolean fields specifically
      if (field === 'is_recurring') {
        return value !== undefined && value !== null;
      }
      
      // For other fields, check for non-empty values
      return value !== undefined && 
             value !== null && 
             value !== '' &&
             String(value).trim() !== '';
    });
  };

  const canMoveToStage = (deal: Deal, targetStage: DealStage): boolean => {
    const currentStageIndex = getStageIndex(deal.stage);
    const targetStageIndex = getStageIndex(targetStage);
    
    // Allow backward movement
    if (targetStageIndex < currentStageIndex) {
      return true; // Allow moving backward to any previous stage
    }
    
    // Can only move to next stage or final stages from Offered
    const nextStage = getNextStage(deal.stage);
    const finalStages: DealStage[] = ['Won', 'Lost', 'Dropped'];
    
    if (deal.stage === 'Offered' && finalStages.includes(targetStage)) {
      return validateRequiredFields(deal);
    }
    
    if (targetStage === nextStage) {
      return validateRequiredFields(deal);
    }
    
    return false;
  };

  const onDragEnd = async (result: DropResult) => {
    setDraggedDeal(null);
    
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStage = destination.droppableId as DealStage;
    const deal = deals.find(d => d.id === draggableId);
    
    if (!deal || deal.stage === newStage) return;

    // Validate stage progression rules
    if (!canMoveToStage(deal, newStage)) {
      const requiredFields = getRequiredFieldsForStage(deal.stage);
      const missingFields = requiredFields.filter(field => {
        const value = deal[field as keyof Deal];
        if (field === 'is_recurring') {
          return value === undefined || value === null;
        }
        return value === undefined || value === null || value === '' || String(value).trim() === '';
      });
      
      if (missingFields.length > 0) {
        toast({
          title: "Cannot Move Deal",
          description: `Complete required fields first: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invalid Move",
          description: "Deals can only move forward one stage at a time.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      await onUpdateDeal(draggableId, { stage: newStage });
      toast({
        title: "Deal Updated",
        description: `Deal moved to ${newStage} stage`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal stage",
        variant: "destructive",
      });
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    const newSelected = new Set(selectedDeals);
    if (checked) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleSelectAllInStage = (stage: DealStage, checked: boolean) => {
    const stageDeals = getDealsByStage(stage);
    const newSelected = new Set(selectedDeals);
    
    stageDeals.forEach(deal => {
      if (checked) {
        newSelected.add(deal.id);
      } else {
        newSelected.delete(deal.id);
      }
    });
    
    setSelectedDeals(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedDeals.size === 0) return;
    
    onDeleteDeals(Array.from(selectedDeals));
    setSelectedDeals(new Set());
    setSelectionMode(false);
    
    toast({
      title: "Deals deleted",
      description: `Successfully deleted ${selectedDeals.size} deals`,
    });
  };

  const handleBulkExport = () => {
    // Export logic handled by ImportExportBar
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedDeals(new Set());
    }
  };

  return (
    <div className="relative">
      {/* Header with actions */}
      <div className="px-6 pb-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search all deal details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all hover:border-primary/50 focus:border-primary"
            />
          </div>
          
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className="hover-scale transition-all"
          >
            {selectionMode ? "Exit Selection" : "Select Deals"}
          </Button>
          
          {selectionMode && selectedDeals.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{selectedDeals.size} selected</span>
            </div>
          )}
        </div>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex w-full overflow-x-auto gap-6 px-6 pb-6 pt-4">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = getDealsByStage(stage);
            const selectedInStage = stageDeals.filter(deal => selectedDeals.has(deal.id)).length;
            const allSelected = selectedInStage === stageDeals.length && stageDeals.length > 0;
            
            return (
              <div key={stage} className="min-w-[280px] flex-grow animate-fade-in">
                <div className={`p-4 rounded-lg border-2 ${STAGE_COLORS[stage]} mb-4 transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) => handleSelectAllInStage(stage, Boolean(checked))}
                          className="transition-colors"
                        />
                      )}
                      <h3 className="font-semibold text-lg">{stage}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {stageDeals.length}
                        {selectionMode && selectedInStage > 0 && (
                          <span className="text-primary ml-1">({selectedInStage})</span>
                        )}
                      </span>
                      {stage === 'Lead' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCreateDeal(stage)}
                          className="hover-scale"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-3 p-2 rounded-lg transition-all ${
                        snapshot.isDraggingOver ? 'bg-muted/50 shadow-inner' : ''
                      }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable 
                          key={deal.id} 
                          draggableId={deal.id} 
                          index={index}
                          isDragDisabled={selectionMode}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...(!selectionMode ? provided.dragHandleProps : {})}
                              className="relative group"
                            >
                              {selectionMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <Checkbox
                                    checked={selectedDeals.has(deal.id)}
                                    onCheckedChange={(checked) => handleSelectDeal(deal.id, Boolean(checked))}
                                    className="bg-background border-2 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                              <DealCard
                                deal={deal}
                                onClick={(e) => {
                                  if (selectionMode) {
                                    handleSelectDeal(deal.id, !selectedDeals.has(deal.id), e);
                                  } else {
                                    onDealClick(deal);
                                  }
                                }}
                                isDragging={snapshot.isDragging}
                                isSelected={selectedDeals.has(deal.id)}
                                selectionMode={selectionMode}
                                onDelete={(dealId) => {
                                  onDeleteDeals([dealId]);
                                  toast({
                                    title: "Deal deleted",
                                    description: `Successfully deleted ${deal.project_name || 'deal'}`,
                                  });
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <BulkActionsBar
        selectedCount={selectedDeals.size}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedDeals(new Set())}
      />
    </div>
  );
};