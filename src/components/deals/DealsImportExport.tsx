
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Upload, Download, ChevronDown } from 'lucide-react';
import { Deal } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ImportDialog from '@/components/ImportDialog';

interface DealsImportExportProps {
  deals: Deal[];
  onImportSuccess: () => void;
}

const DealsImportExport = ({ deals, onImportSuccess }: DealsImportExportProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportAll = () => {
    exportDealsToCSV(deals, 'all_deals.csv');
  };

  const exportDealsToCSV = (dealsToExport: Deal[], filename: string) => {
    if (dealsToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There are no deals to export.",
      });
      return;
    }

    // Define the columns to export
    const headers = [
      'Deal Name',
      'Stage',
      'Amount',
      'Currency',
      'Probability',
      'Closing Date',
      'Description',
      'Customer Need Identified',
      'Need Summary',
      'Decision Maker Present',
      'Customer Agreed on Need',
      'NDA Signed',
      'Budget Confirmed',
      'Supplier Portal Access',
      'Expected Timeline Start',
      'Expected Timeline End',
      'RFQ Value',
      'RFQ Document URL',
      'Product Service Scope',
      'Proposal Sent Date',
      'Negotiation Status',
      'Decision Expected Date',
      'Win Reason',
      'Loss Reason',
      'Drop Reason',
      'Created At',
      'Last Activity'
    ];

    // Convert deals to CSV rows
    const csvRows = dealsToExport.map(deal => [
      deal.deal_name || '',
      deal.stage || '',
      deal.amount?.toString() || '',
      deal.currency || '',
      deal.probability?.toString() || '',
      deal.closing_date || '',
      deal.description || '',
      deal.customer_need_identified ? 'Yes' : 'No',
      deal.need_summary || '',
      deal.decision_maker_present ? 'Yes' : 'No',
      deal.customer_agreed_on_need || '',
      deal.nda_signed ? 'Yes' : 'No',
      deal.budget_confirmed || '',
      deal.supplier_portal_access || '',
      deal.expected_deal_timeline_start || '',
      deal.expected_deal_timeline_end || '',
      deal.rfq_value?.toString() || '',
      deal.rfq_document_url || '',
      deal.product_service_scope || '',
      deal.proposal_sent_date || '',
      deal.negotiation_status || '',
      deal.decision_expected_date || '',
      deal.win_reason || '',
      deal.loss_reason || '',
      deal.drop_reason || '',
      deal.created_at || '',
      deal.last_activity_time || ''
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `${dealsToExport.length} deals exported to ${filename}`,
    });
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const rows = lines.slice(1);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const dealsToImport = rows.map(row => {
        const values = row.split(',').map(v => v.replace(/"/g, '').trim());
        const dealData: any = {
          deal_name: values[0] || 'Imported Deal',
          stage: values[1] || 'Discussions',
          amount: values[2] ? parseFloat(values[2]) : null,
          currency: values[3] || 'USD',
          probability: values[4] ? parseInt(values[4]) : null,
          closing_date: values[5] || null,
          description: values[6] || null,
          customer_need_identified: values[7]?.toLowerCase() === 'yes',
          need_summary: values[8] || null,
          decision_maker_present: values[9]?.toLowerCase() === 'yes',
          customer_agreed_on_need: values[10] || null,
          nda_signed: values[11]?.toLowerCase() === 'yes',
          budget_confirmed: values[12] || null,
          supplier_portal_access: values[13] || null,
          expected_deal_timeline_start: values[14] || null,
          expected_deal_timeline_end: values[15] || null,
          rfq_value: values[16] ? parseFloat(values[16]) : null,
          rfq_document_url: values[17] || null,
          product_service_scope: values[18] || null,
          proposal_sent_date: values[19] || null,
          negotiation_status: values[20] || null,
          decision_expected_date: values[21] || null,
          win_reason: values[22] || null,
          loss_reason: values[23] || null,
          drop_reason: values[24] || null,
          created_by: user.id,
          modified_by: user.id
        };

        return dealData;
      });

      const { error } = await supabase
        .from('deals')
        .insert(dealsToImport);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `${dealsToImport.length} deals imported successfully`,
      });

      onImportSuccess();
      setShowImportDialog(false);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportDialog(true)}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isImporting ? 'Importing...' : 'Import'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportAll}>
              Export All Deals
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onFileSelect={handleImport}
        moduleName="Deals"
      />
    </>
  );
};

export default DealsImportExport;
