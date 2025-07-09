
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
    discussion_notes: '',
    budget_holder: '',
    decision_makers: '',
    timeline: '',
    internal_notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || '',
        stage: deal.stage || 'Lead',
        amount: deal.amount?.toString() || '',
        currency: deal.currency || 'USD',
        probability: deal.probability?.toString() || '',
        closing_date: deal.closing_date || '',
        description: deal.description || '',
        discussion_notes: deal.discussion_notes || '',
        budget_holder: deal.budget_holder || '',
        decision_makers: deal.decision_makers || '',
        timeline: deal.timeline || '',
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
        discussion_notes: formData.discussion_notes || null,
        budget_holder: formData.budget_holder || null,
        decision_makers: formData.decision_makers || null,
        timeline: formData.timeline || null,
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
