import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/supabase/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/common/ui/dialog";
import { Button } from "@/components/common/ui/button";
import { Label } from "@/components/common/ui/label";
import { Textarea } from "@/components/common/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/ui/select";
import { Checkbox } from "@/components/common/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface MeetingOutcome {
  id: string;
  meeting_id: string;
  outcome_type: string;
  summary: string;
  interested_in_deal: boolean;
  next_steps: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MeetingOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string | null;
  outcome?: MeetingOutcome | null;
  onSuccess: () => void;
}

const outcomeTypes = [
  "Positive",
  "Neutral", 
  "Negative",
  "Follow-up Required",
  "Deal Opportunity",
  "No Show",
  "Cancelled",
  "Rescheduled"
];

export const MeetingOutcomeModal = ({ isOpen, onClose, meetingId, outcome, onSuccess }: MeetingOutcomeModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    outcome_type: "",
    summary: "",
    interested_in_deal: false,
    next_steps: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (outcome) {
      setFormData({
        outcome_type: outcome.outcome_type,
        summary: outcome.summary || "",
        interested_in_deal: outcome.interested_in_deal,
        next_steps: outcome.next_steps || "",
      });
    } else {
      setFormData({
        outcome_type: "",
        summary: "",
        interested_in_deal: false,
        next_steps: "",
      });
    }
    setErrors({});
  }, [outcome, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.outcome_type) {
      newErrors.outcome_type = "Outcome type is required";
    }
    if (!formData.summary.trim()) {
      newErrors.summary = "Summary is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user || !meetingId) return;

    setLoading(true);

    try {
      const outcomeData = {
        meeting_id: meetingId,
        outcome_type: formData.outcome_type,
        summary: formData.summary,
        interested_in_deal: formData.interested_in_deal,
        next_steps: formData.next_steps,
        ...(outcome ? {} : { created_by: user.id }),
      };

      if (outcome) {
        const { error } = await supabase
          .from("meeting_outcomes")
          .update(outcomeData)
          .eq("id", outcome.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting outcome updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("meeting_outcomes")
          .insert([outcomeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting outcome recorded successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving meeting outcome:", error);
      toast({
        title: "Error",
        description: "Failed to save meeting outcome",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!meetingId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {outcome ? "Edit Meeting Outcome" : "Record Meeting Outcome"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Outcome Type */}
          <div className="space-y-2">
            <Label>Outcome Type *</Label>
            <Select 
              value={formData.outcome_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, outcome_type: value }))}
            >
              <SelectTrigger className={errors.outcome_type ? "border-destructive" : ""}>
                <SelectValue placeholder="Select outcome type" />
              </SelectTrigger>
              <SelectContent>
                {outcomeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.outcome_type && (
              <p className="text-sm text-destructive">{errors.outcome_type}</p>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Summarize the key points and outcomes from the meeting"
              rows={4}
              className={errors.summary ? "border-destructive" : ""}
            />
            {errors.summary && (
              <p className="text-sm text-destructive">{errors.summary}</p>
            )}
          </div>

          {/* Interested in Deal */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="interested_in_deal"
              checked={formData.interested_in_deal}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, interested_in_deal: checked as boolean }))
              }
            />
            <Label htmlFor="interested_in_deal" className="cursor-pointer">
              Interested in pursuing a deal opportunity
            </Label>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              value={formData.next_steps}
              onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
              placeholder="What are the next steps to follow up on this meeting?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : outcome ? "Update Outcome" : "Record Outcome"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};