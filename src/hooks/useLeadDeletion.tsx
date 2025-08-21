
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCRUDAudit } from '@/hooks/useCRUDAudit';

export const useLeadDeletion = () => {
  const { toast } = useToast();
  const { logBulkDelete } = useCRUDAudit();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteSingleLead = async (leadId: string, deleteLinkedRecords: boolean = true) => {
    return deleteLeads([leadId], deleteLinkedRecords);
  };

  const deleteLeads = async (leadIds: string[], deleteLinkedRecords: boolean = true) => {
    if (leadIds.length === 0) return { success: false, message: 'No leads selected' };

    setIsDeleting(true);
    
    try {
      console.log('Starting delete process for leads:', leadIds);
      
      if (deleteLinkedRecords) {
        // Step 1: Get all action item IDs for the selected leads
        console.log('Getting action items for selected leads...');
        const { data: actionItems, error: actionItemsSelectError } = await supabase
          .from('lead_action_items')
          .select('id')
          .in('lead_id', leadIds);
        
        if (actionItemsSelectError) {
          console.error('Error selecting action items:', actionItemsSelectError);
          throw actionItemsSelectError;
        }

        const actionItemIds = actionItems?.map(item => item.id) || [];
        console.log('Found action items to process:', actionItemIds);

        // Step 2: Delete notifications that reference these action items
        if (actionItemIds.length > 0) {
          console.log('Deleting notifications that reference action items...');
          const { error: notificationActionError } = await supabase
            .from('notifications')
            .delete()
            .in('action_item_id', actionItemIds);
            
          if (notificationActionError) {
            console.error('Error deleting notifications for action items:', notificationActionError);
            throw notificationActionError;
          }
        }

        // Step 3: Delete notifications that directly reference the leads
        console.log('Deleting notifications that reference leads...');
        const { error: notificationLeadError } = await supabase
          .from('notifications')
          .delete()
          .in('lead_id', leadIds);
          
        if (notificationLeadError) {
          console.error('Error deleting notifications for leads:', notificationLeadError);
          throw notificationLeadError;
        }

        // Step 4: Delete lead action items
        console.log('Deleting lead action items...');
        const { error: actionItemsDeleteError } = await supabase
          .from('lead_action_items')
          .delete()
          .in('lead_id', leadIds);

        if (actionItemsDeleteError) {
          console.error('Error deleting lead action items:', actionItemsDeleteError);
          throw actionItemsDeleteError;
        }
      }

      // Step 5: Finally delete the leads
      console.log('Deleting leads...');
      const { error: leadsDeleteError } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (leadsDeleteError) {
        console.error('Error deleting leads:', leadsDeleteError);
        throw leadsDeleteError;
      }

      // Log the deletion
      await logBulkDelete('leads', leadIds.length, leadIds);

      console.log('Delete operation completed successfully');
      
      const successMessage = leadIds.length === 1 
        ? 'Lead deleted successfully'
        : `${leadIds.length} leads deleted successfully`;
      
      toast({
        title: "Success",
        description: successMessage,
      });
      
      return { success: true, message: successMessage };
    } catch (error: any) {
      console.error('Delete operation failed:', error);
      
      let errorMessage = "Failed to delete leads";
      if (error.message) {
        if (error.message.includes('foreign key')) {
          errorMessage = "Cannot delete leads: They have related records that must be removed first";
        } else if (error.message.includes('violates')) {
          errorMessage = "Cannot delete leads: Database constraint violation";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, message: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteLeads,
    deleteSingleLead,
    isDeleting
  };
};
