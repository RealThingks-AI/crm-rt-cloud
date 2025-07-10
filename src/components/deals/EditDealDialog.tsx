
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Deal, DEAL_STAGES } from '@/hooks/useDeals';

interface EditDealDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditDealDialog = ({ deal, open, onOpenChange, onSuccess }: EditDealDialogProps) => {
  const [formData, setFormData] = useState({
    deal_name: '',
    stage: '',
    amount: '',
    currency: 'USD',
    probability: '',
    closing_date: '',
    description: '',
    
    // Discussions stage
    customer_need_identified: false,
    need_summary: '',
    decision_maker_present: false,
    customer_agreed_on_need: '',
    discussion_notes: '',
    
    // Qualified stage
    nda_signed: false,
    budget_confirmed: '',
    supplier_portal_access: '',
    expected_deal_timeline_start: '',
    expected_deal_timeline_end: '',
    budget_holder: '',
    decision_makers: '',
    timeline: '',
    supplier_portal_required: false,
    
    // RFQ stage
    rfq_value: '',
    rfq_document_url: '',
    rfq_document_link: '',
    product_service_scope: '',
    rfq_confirmation_note: '',
    
    // Offered stage
    proposal_sent_date: '',
    negotiation_status: '',
    decision_expected_date: '',
    offer_sent_date: '',
    revised_offer_notes: '',
    negotiation_notes: '',
    
    // Final stages
    win_reason: '',
    loss_reason: '',
    lost_to: '',
    drop_reason: '',
    drop_summary: '',
    learning_summary: '',
    
    // Execution
    execution_started: false,
    begin_execution_date: '',
    confirmation_note: '',
    
    // General
    internal_notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || '',
        stage: deal.stage || 'Discussions',
        amount: deal.amount?.toString() || '',
        currency: deal.currency || 'USD',
        probability: deal.probability?.toString() || '',
        closing_date: deal.closing_date || '',
        description: deal.description || '',
        
        // Discussions stage
        customer_need_identified: deal.customer_need_identified || false,
        need_summary: deal.need_summary || '',
        decision_maker_present: deal.decision_maker_present || false,
        customer_agreed_on_need: deal.customer_agreed_on_need || '',
        discussion_notes: deal.discussion_notes || '',
        
        // Qualified stage
        nda_signed: deal.nda_signed || false,
        budget_confirmed: deal.budget_confirmed || '',
        supplier_portal_access: deal.supplier_portal_access || '',
        expected_deal_timeline_start: deal.expected_deal_timeline_start || '',
        expected_deal_timeline_end: deal.expected_deal_timeline_end || '',
        budget_holder: deal.budget_holder || '',
        decision_makers: deal.decision_makers || '',
        timeline: deal.timeline || '',
        supplier_portal_required: deal.supplier_portal_required || false,
        
        // RFQ stage
        rfq_value: deal.rfq_value?.toString() || '',
        rfq_document_url: deal.rfq_document_url || '',
        rfq_document_link: deal.rfq_document_link || '',
        product_service_scope: deal.product_service_scope || '',
        rfq_confirmation_note: deal.rfq_confirmation_note || '',
        
        // Offered stage
        proposal_sent_date: deal.proposal_sent_date || '',
        negotiation_status: deal.negotiation_status || '',
        decision_expected_date: deal.decision_expected_date || '',
        offer_sent_date: deal.offer_sent_date || '',
        revised_offer_notes: deal.revised_offer_notes || '',
        negotiation_notes: deal.negotiation_notes || '',
        
        // Final stages
        win_reason: deal.win_reason || '',
        loss_reason: deal.loss_reason || '',
        lost_to: deal.lost_to || '',
        drop_reason: deal.drop_reason || '',
        drop_summary: deal.drop_summary || '',
        learning_summary: deal.learning_summary || '',
        
        // Execution
        execution_started: deal.execution_started || false,
        begin_execution_date: deal.begin_execution_date || '',
        confirmation_note: deal.confirmation_note || '',
        
        // General
        internal_notes: deal.internal_notes || '',
      });
    }
  }, [deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        deal_name: formData.deal_name,
        stage: formData.stage,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        probability: formData.probability ? parseInt(formData.probability) : null,
        closing_date: formData.closing_date || null,
        description: formData.description || null,
        
        // Discussions stage
        customer_need_identified: formData.customer_need_identified,
        need_summary: formData.need_summary || null,
        decision_maker_present: formData.decision_maker_present,
        customer_agreed_on_need: formData.customer_agreed_on_need || null,
        discussion_notes: formData.discussion_notes || null,
        
        // Qualified stage
        nda_signed: formData.nda_signed,
        budget_confirmed: formData.budget_confirmed || null,
        supplier_portal_access: formData.supplier_portal_access || null,
        expected_deal_timeline_start: formData.expected_deal_timeline_start || null,
        expected_deal_timeline_end: formData.expected_deal_timeline_end || null,
        budget_holder: formData.budget_holder || null,
        decision_makers: formData.decision_makers || null,
        timeline: formData.timeline || null,
        supplier_portal_required: formData.supplier_portal_required,
        
        // RFQ stage
        rfq_value: formData.rfq_value ? parseFloat(formData.rfq_value) : null,
        rfq_document_url: formData.rfq_document_url || null,
        rfq_document_link: formData.rfq_document_link || null,
        product_service_scope: formData.product_service_scope || null,
        rfq_confirmation_note: formData.rfq_confirmation_note || null,
        
        // Offered stage
        proposal_sent_date: formData.proposal_sent_date || null,
        negotiation_status: formData.negotiation_status || null,
        decision_expected_date: formData.decision_expected_date || null,
        offer_sent_date: formData.offer_sent_date || null,
        revised_offer_notes: formData.revised_offer_notes || null,
        negotiation_notes: formData.negotiation_notes || null,
        
        // Final stages
        win_reason: formData.win_reason || null,
        loss_reason: formData.loss_reason || null,
        lost_to: formData.lost_to || null,
        drop_reason: formData.drop_reason || null,
        drop_summary: formData.drop_summary || null,
        learning_summary: formData.learning_summary || null,
        
        // Execution
        execution_started: formData.execution_started,
        begin_execution_date: formData.begin_execution_date || null,
        confirmation_note: formData.confirmation_note || null,
        
        // General
        internal_notes: formData.internal_notes || null,
        last_activity_time: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('deals')
        .update(dealData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated",
        description: "Deal has been successfully updated.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        variant: "destructive",
        title: "Error updating deal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal_name">Deal Name *</Label>
            <Input
              id="deal_name"
              value={formData.deal_name}
              onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closing_date">Closing Date</Label>
              <Input
                id="closing_date"
                type="date"
                value={formData.closing_date}
                onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_holder">Budget Holder</Label>
            <Input
              id="budget_holder"
              value={formData.budget_holder}
              onChange={(e) => setFormData({ ...formData, budget_holder: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="decision_makers">Decision Makers</Label>
            <Input
              id="decision_makers"
              value={formData.decision_makers}
              onChange={(e) => setFormData({ ...formData, decision_makers: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discussion_notes">Discussion Notes</Label>
            <Textarea
              id="discussion_notes"
              value={formData.discussion_notes}
              onChange={(e) => setFormData({ ...formData, discussion_notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Discussions Stage Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700">Discussions Stage</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customer_need_identified"
                checked={formData.customer_need_identified}
                onCheckedChange={(checked) => setFormData({ ...formData, customer_need_identified: checked as boolean })}
              />
              <Label htmlFor="customer_need_identified">Customer Need Identified</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="need_summary">Need Summary</Label>
              <Textarea
                id="need_summary"
                value={formData.need_summary}
                onChange={(e) => setFormData({ ...formData, need_summary: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="decision_maker_present"
                checked={formData.decision_maker_present}
                onCheckedChange={(checked) => setFormData({ ...formData, decision_maker_present: checked as boolean })}
              />
              <Label htmlFor="decision_maker_present">Decision Maker Present</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_agreed_on_need">Customer Agreed on Need</Label>
              <Select value={formData.customer_agreed_on_need} onValueChange={(value) => setFormData({ ...formData, customer_agreed_on_need: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agreement status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Qualified Stage Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700">Qualified Stage</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nda_signed"
                checked={formData.nda_signed}
                onCheckedChange={(checked) => setFormData({ ...formData, nda_signed: checked as boolean })}
              />
              <Label htmlFor="nda_signed">NDA Signed</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_confirmed">Budget Confirmed</Label>
              <Select value={formData.budget_confirmed} onValueChange={(value) => setFormData({ ...formData, budget_confirmed: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Estimate Only">Estimate Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_portal_access">Supplier Portal Access</Label>
              <Select value={formData.supplier_portal_access} onValueChange={(value) => setFormData({ ...formData, supplier_portal_access: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select portal status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invited">Invited</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Not Invited">Not Invited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected_deal_timeline_start">Timeline Start</Label>
                <Input
                  id="expected_deal_timeline_start"
                  type="date"
                  value={formData.expected_deal_timeline_start}
                  onChange={(e) => setFormData({ ...formData, expected_deal_timeline_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_deal_timeline_end">Timeline End</Label>
                <Input
                  id="expected_deal_timeline_end"
                  type="date"
                  value={formData.expected_deal_timeline_end}
                  onChange={(e) => setFormData({ ...formData, expected_deal_timeline_end: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="supplier_portal_required"
                checked={formData.supplier_portal_required}
                onCheckedChange={(checked) => setFormData({ ...formData, supplier_portal_required: checked as boolean })}
              />
              <Label htmlFor="supplier_portal_required">Supplier Portal Required</Label>
            </div>
          </div>

          {/* RFQ Stage Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700">RFQ Stage</h3>
            
            <div className="space-y-2">
              <Label htmlFor="rfq_value">RFQ Value</Label>
              <Input
                id="rfq_value"
                type="number"
                step="0.01"
                value={formData.rfq_value}
                onChange={(e) => setFormData({ ...formData, rfq_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfq_document_url">RFQ Document URL</Label>
              <Input
                id="rfq_document_url"
                type="url"
                value={formData.rfq_document_url}
                onChange={(e) => setFormData({ ...formData, rfq_document_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_service_scope">Product/Service Scope</Label>
              <Textarea
                id="product_service_scope"
                value={formData.product_service_scope}
                onChange={(e) => setFormData({ ...formData, product_service_scope: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfq_confirmation_note">RFQ Confirmation Note</Label>
              <Textarea
                id="rfq_confirmation_note"
                value={formData.rfq_confirmation_note}
                onChange={(e) => setFormData({ ...formData, rfq_confirmation_note: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Offered Stage Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700">Offered Stage</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposal_sent_date">Proposal Sent Date</Label>
                <Input
                  id="proposal_sent_date"
                  type="date"
                  value={formData.proposal_sent_date}
                  onChange={(e) => setFormData({ ...formData, proposal_sent_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decision_expected_date">Decision Expected Date</Label>
                <Input
                  id="decision_expected_date"
                  type="date"
                  value={formData.decision_expected_date}
                  onChange={(e) => setFormData({ ...formData, decision_expected_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="negotiation_status">Negotiation Status</Label>
              <Select value={formData.negotiation_status} onValueChange={(value) => setFormData({ ...formData, negotiation_status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select negotiation status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Finalized">Finalized</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="negotiation_notes">Negotiation Notes</Label>
              <Textarea
                id="negotiation_notes"
                value={formData.negotiation_notes}
                onChange={(e) => setFormData({ ...formData, negotiation_notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Final Stage Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700">Final Stage Fields</h3>
            
            <div className="space-y-2">
              <Label htmlFor="win_reason">Win Reason</Label>
              <Textarea
                id="win_reason"
                value={formData.win_reason}
                onChange={(e) => setFormData({ ...formData, win_reason: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loss_reason">Loss Reason</Label>
              <Select value={formData.loss_reason} onValueChange={(value) => setFormData({ ...formData, loss_reason: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select loss reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Budget">Budget</SelectItem>
                  <SelectItem value="Competitor">Competitor</SelectItem>
                  <SelectItem value="Timeline">Timeline</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drop_reason">Drop Reason</Label>
              <Textarea
                id="drop_reason"
                value={formData.drop_reason}
                onChange={(e) => setFormData({ ...formData, drop_reason: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Execution Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm text-gray-700">Execution</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="execution_started"
                checked={formData.execution_started}
                onCheckedChange={(checked) => setFormData({ ...formData, execution_started: checked as boolean })}
              />
              <Label htmlFor="execution_started">Execution Started</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="begin_execution_date">Begin Execution Date</Label>
              <Input
                id="begin_execution_date"
                type="date"
                value={formData.begin_execution_date}
                onChange={(e) => setFormData({ ...formData, begin_execution_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDealDialog;
