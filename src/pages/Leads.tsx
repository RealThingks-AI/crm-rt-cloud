import LeadTable from "@/components/LeadTable";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2, ChevronDown, Upload, Download } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleLeadsImportExport } from "@/hooks/useSimpleLeadsImportExport";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { LeadDeleteConfirmDialog } from "@/components/LeadDeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Leads = () => {
  const { toast } = useToast();
  const { logBulkDelete } = useCRUDAudit();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleImport, handleExport, isImporting } = useSimpleLeadsImportExport(() => {
    setRefreshTrigger(prev => prev + 1);
  });

  const handleBulkDelete = async (deleteLinkedRecords: boolean = true) => {
    if (selectedLeads.length === 0) return;

    try {
      console.log('Starting bulk delete process for leads:', selectedLeads);
      
      if (deleteLinkedRecords) {
        // Delete in the correct order to avoid foreign key constraint violations
        
        // 1. Get all action item IDs for the selected leads
        console.log('Getting action items for selected leads...');
        const { data: actionItems } = await supabase
          .from('lead_action_items')
          .select('id')
          .in('lead_id', selectedLeads);
        
        const actionItemIds = actionItems?.map(item => item.id) || [];
        console.log('Found action items to delete:', actionItemIds);
        
        // 2. Delete notifications that reference action items
        if (actionItemIds.length > 0) {
          console.log('Deleting notifications that reference action items...');
          const { error: notificationActionError } = await supabase
            .from('notifications')
            .delete()
            .in('action_item_id', actionItemIds);
            
          if (notificationActionError) {
            console.error('Error deleting notifications for action items:', notificationActionError);
          }
        }

        // 3. Delete notifications that directly reference the leads
        console.log('Deleting notifications that reference leads...');
        const { error: notificationLeadError } = await supabase
          .from('notifications')
          .delete()
          .in('lead_id', selectedLeads);
          
        if (notificationLeadError) {
          console.error('Error deleting notifications for leads:', notificationLeadError);
        }

        // 4. Delete lead action items
        console.log('Deleting lead action items...');
        const { error: actionItemsError } = await supabase
          .from('lead_action_items')
          .delete()
          .in('lead_id', selectedLeads);

        if (actionItemsError) {
          console.error('Error deleting lead action items:', actionItemsError);
          throw actionItemsError;
        }
      }

      // 5. Finally delete the leads
      console.log('Deleting leads...');
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      // Log bulk delete operation
      await logBulkDelete('leads', selectedLeads.length, selectedLeads);

      console.log('Bulk delete completed successfully');
      toast({
        title: "Success",
        description: `${selectedLeads.length} leads deleted successfully`,
      });
      
      setSelectedLeads([]);
      setRefreshTrigger(prev => prev + 1);
      setShowBulkDeleteDialog(false);
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete leads",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedLeads.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      handleImport(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Leads</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => setShowColumnCustomizer(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
          </Button>
          
          {selectedLeads.length > 0 && (
            <Button 
              variant="destructive"
              onClick={handleBulkDeleteClick}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedLeads.length})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBulkDeleteClick}
                disabled={selectedLeads.length === 0}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedLeads.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Lead Table */}
      <LeadTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        selectedLeads={selectedLeads}
        setSelectedLeads={setSelectedLeads}
        key={refreshTrigger}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <LeadDeleteConfirmDialog
        open={showBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
        isMultiple={true}
        count={selectedLeads.length}
      />
    </div>
  );
};

export default Leads;
