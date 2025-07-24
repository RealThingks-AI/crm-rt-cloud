import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/ui/dialog";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { Textarea } from "@/components/common/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/common/ui/select";
import { Switch } from "@/components/common/ui/switch";
import { Badge } from "@/components/common/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/card";
import { Deal, DealStage, getFieldsForStage, getRequiredFieldsForStage, getNextStage, getFinalStageOptions, getStageIndex } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

interface DealFormProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dealData: Partial<Deal>) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isCreating?: boolean;
  initialStage?: DealStage;
}

export const DealForm = ({ deal, isOpen, onClose, onSave, isCreating = false, initialStage, onRefresh }: DealFormProps) => {
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [loading, setLoading] = useState(false);
  const [showPreviousStages, setShowPreviousStages] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (deal) {
      console.log("Setting form data from deal:", deal);
      setFormData(deal);
    } else if (isCreating && initialStage) {
      setFormData({ stage: initialStage });
    }
    // Reset the toggle state when the dialog opens/closes
    setShowPreviousStages(false);
  }, [deal, isCreating, initialStage, isOpen]);

  const currentStage = formData.stage || 'Lead';
  
  // Calculate available fields based on toggle state
  const getAvailableFields = () => {
    if (showPreviousStages) {
      // Show all fields from all stages up to current stage (use existing function)
      return getFieldsForStage(currentStage);
    } else {
      // Show only fields specific to the current stage
      const stageSpecificFields = {
        'Lead': ['project_name', 'customer_name', 'lead_name', 'lead_owner', 'region', 'priority', 'probability', 'internal_comment'],
        'Discussions': ['expected_closing_date', 'customer_need', 'customer_challenges', 'relationship_strength'],
        'Qualified': ['budget', 'business_value', 'decision_maker_level'],
        'RFQ': ['is_recurring', 'project_type', 'duration', 'revenue', 'start_date', 'end_date'],
        'Offered': ['total_contract_value', 'currency_type', 'action_items', 'current_status'],
        'Won': ['won_reason'],
        'Lost': ['lost_reason', 'need_improvement'],
        'Dropped': ['drop_reason']
      };
      
      return stageSpecificFields[currentStage] || [];
    }
  };
  
  const availableFields = getAvailableFields();

  // Update available fields when stage or toggle changes
  useEffect(() => {
    console.log(`Stage: ${currentStage}, Show all stages: ${showPreviousStages}, Available fields:`, availableFields);
    console.log("Field count comparison - Current stage only:", getFieldsForStage(currentStage).length, "All stages:", getAvailableFields().length);
  }, [currentStage, showPreviousStages, availableFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Saving deal data:", formData);
      
      // Prepare the data for saving
      const saveData = {
        ...formData,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      console.log("Prepared save data:", saveData);
      
      await onSave(saveData);
      
      toast({
        title: "Success",
        description: isCreating ? "Deal created successfully" : "Deal updated successfully",
      });
      
      onClose();
      
      // Refresh the data
      if (onRefresh) {
        setTimeout(onRefresh, 100); // Small delay to ensure database update completes
      }
    } catch (error) {
      console.error("Error saving deal:", error);
      toast({
        title: "Error",
        description: `Failed to save deal: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToNextStage = async () => {
    if (!canMoveToNextStage) return;
    
    setLoading(true);
    
    try {
      const nextStage = getNextStage(currentStage);
      if (nextStage) {
        console.log(`Moving deal from ${currentStage} to ${nextStage}`);
        
        // Save all form data with the new stage in one operation
        const updatedData = {
          ...formData,
          stage: nextStage,
          deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
          modified_at: new Date().toISOString(),
          modified_by: deal?.created_by || formData.created_by
        };
        
        console.log("Saving data with new stage:", updatedData);
        
        await onSave(updatedData);
        
        toast({
          title: "Success",
          description: `Deal moved to ${nextStage} stage`,
        });
        
        // Close modal and refresh
        onClose();
        if (onRefresh) {
          setTimeout(() => onRefresh(), 200);
        }
      }
    } catch (error) {
      console.error("Error moving deal to next stage:", error);
      toast({
        title: "Error",
        description: "Failed to move deal to next stage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToFinalStage = async (finalStage: DealStage) => {
    setLoading(true);
    
    try {
      console.log(`Moving deal to final stage: ${finalStage}`);
      
      // Update form data immediately to show the appropriate reason fields
      const updatedData = {
        ...formData,
        stage: finalStage,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      // Update the form state first to show relevant fields
      setFormData(updatedData);
      
      await onSave(updatedData);
      
      toast({
        title: "Success",
        description: `Deal moved to ${finalStage} stage`,
      });
      
      // Close modal and refresh
      onClose();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 200);
      }
    } catch (error) {
      console.error("Error moving deal to final stage:", error);
      toast({
        title: "Error",
        description: `Failed to move deal to ${finalStage} stage`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSpecificStage = async (targetStage: DealStage) => {
    if (!canMoveToStage(targetStage)) return;
    
    setLoading(true);
    
    try {
      console.log(`Moving deal from ${currentStage} to ${targetStage}`);
      
      const updatedData = {
        ...formData,
        stage: targetStage,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      setFormData(updatedData);
      await onSave(updatedData);
      
      toast({
        title: "Success",
        description: `Deal moved to ${targetStage} stage`,
      });
      
      onClose();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 200);
      }
    } catch (error) {
      console.error("Error moving deal to stage:", error);
      toast({
        title: "Error",
        description: `Failed to move deal to ${targetStage} stage`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    console.log(`Updating field ${field} with value:`, value, "Type:", typeof value);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log("Updated form data:", updated);
      return updated;
    });
  };

  const validateRequiredFields = (): boolean => {
    const requiredFields = getRequiredFieldsForStage(currentStage);
    
    const isValid = requiredFields.every(field => {
      const value = formData[field as keyof Deal];
      
      // Handle boolean fields specifically
      if (field === 'is_recurring') {
        return value !== undefined && value !== null;
      }
      
      // For other fields, check for non-empty values
      const isFieldValid = value !== undefined && 
                          value !== null && 
                          value !== '' &&
                          String(value).trim() !== '';
      
      console.log(`Validating field ${field}: value = "${value}", isValid = ${isFieldValid}`);
      return isFieldValid;
    });
    
    console.log(`Overall validation for stage ${currentStage}: ${isValid}. Required fields:`, requiredFields);
    return isValid;
  };

  // Get available stages for the "Move to" dropdown (with backward movement allowed)
  const getAvailableStagesForMoveTo = (): DealStage[] => {
    const currentIndex = getStageIndex(currentStage);
    const allStages: DealStage[] = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
    
    const availableStages: DealStage[] = [];
    
    // Add all previous stages (backward movement)
    for (let i = 0; i < currentIndex; i++) {
      availableStages.push(allStages[i]);
    }
    
    // Add next stage if it exists and requirements are met
    const nextStage = getNextStage(currentStage);
    if (nextStage && validateRequiredFields()) {
      availableStages.push(nextStage);
    }
    
    // Add final stages if in Offered stage and requirements are met
    if (currentStage === 'Offered' && validateRequiredFields()) {
      availableStages.push('Won', 'Lost', 'Dropped');
    }
    
    return availableStages;
  };

  const canMoveToStage = (targetStage: DealStage): boolean => {
    const availableStages = getAvailableStagesForMoveTo();
    return availableStages.includes(targetStage);
  };

  const canMoveToNextStage = !isCreating && 
    getNextStage(currentStage) !== null && 
    validateRequiredFields();

  const canMoveToFinalStage = !isCreating && 
    currentStage === 'Offered' && 
    validateRequiredFields();

  // Add a state to track if save was successful for enabling "Move to Next Stage"
  const [lastSaveSuccessful, setLastSaveSuccessful] = useState(true);

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      project_name: 'Project Name',
      customer_name: 'Customer Name',
      lead_name: 'Lead Name',
      lead_owner: 'Lead Owner',
      region: 'Region',
      priority: 'Priority',
      probability: 'Probability (%)',
      internal_comment: 'Comment',
      expected_closing_date: 'Expected Closing Date',
      customer_need: 'Customer Need',
      customer_challenges: 'Customer Challenges',
      relationship_strength: 'Relationship Strength',
      budget: 'Budget',
      business_value: 'Business Value',
      decision_maker_level: 'Decision Maker Level',
      is_recurring: 'Is Recurring?',
      project_type: 'Project Type',
      duration: 'Duration (months)',
      revenue: 'Revenue',
      start_date: 'Start Date',
      end_date: 'End Date',
      total_contract_value: 'Total Contract Value',
      currency_type: 'Currency',
      action_items: 'Action Items',
      current_status: 'Current Status',
      
      won_reason: 'Won Reason',
      lost_reason: 'Lost Reason',
      need_improvement: 'Need Improvement',
      drop_reason: 'Drop Reason',
    };
    return labels[field] || field;
  };

  const renderField = (field: string) => {
    const value = formData[field as keyof Deal];
    console.log(`Rendering field ${field} with value:`, value, "Type:", typeof value);

    // Helper function to safely convert values to strings for text inputs
    const getStringValue = (val: any): string => {
      if (val === null || val === undefined) return '';
      return String(val);
    };

    switch (field) {
      case 'priority':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Select
              value={value?.toString() || ''}
              onValueChange={(val) => updateField(field, parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    Priority {num} {num === 1 ? '(Highest)' : num === 2 ? '(High)' : num === 3 ? '(Medium)' : num === 4 ? '(Low)' : '(Lowest)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'probability':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={value?.toString() || ''}
              onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
              placeholder="0-100"
            />
          </div>
        );

      case 'region':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Select
              value={value?.toString() || ''}
              onValueChange={(val) => updateField(field, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {['EU', 'US', 'APAC', 'MEA', 'LATAM'].map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'relationship_strength':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Select
              value={value?.toString() || ''}
              onValueChange={(val) => updateField(field, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select strength" />
              </SelectTrigger>
              <SelectContent>
                {['Low', 'Medium', 'High'].map(strength => (
                  <SelectItem key={strength} value={strength}>
                    {strength}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'business_value':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Select
              value={value?.toString() || ''}
              onValueChange={(val) => updateField(field, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business value" />
              </SelectTrigger>
              <SelectContent>
                {['Low', 'Medium', 'High'].map(val => (
                  <SelectItem key={val} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'decision_maker_level':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Select
              value={value?.toString() || ''}
              onValueChange={(val) => updateField(field, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision maker level" />
              </SelectTrigger>
              <SelectContent>
                {['Not Identified', 'Identified', 'Done'].map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'currency_type':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Select
              value={value?.toString() || 'EUR'}
              onValueChange={(val) => updateField(field, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: 'EUR', label: '€ EUR' },
                  { value: 'USD', label: '$ USD' },
                  { value: 'INR', label: '₹ INR' },
                ].map(currency => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'is_recurring':
        return (
          <div key={field} className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateField(field, checked)}
            />
            <Label>{getFieldLabel(field)}</Label>
          </div>
        );

      case 'expected_closing_date':
      case 'start_date':
      case 'end_date':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Input
              type="date"
              value={getStringValue(value)}
              onChange={(e) => updateField(field, e.target.value)}
            />
          </div>
        );

      case 'duration':
      case 'revenue':
      case 'total_contract_value':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Input
              type="number"
              value={getStringValue(value)}
              onChange={(e) => updateField(field, parseFloat(e.target.value) || 0)}
            />
          </div>
        );

      case 'internal_comment':
      case 'customer_need':
      case 'customer_challenges':
      case 'budget':
      case 'action_items':
      case 'won_reason':
      case 'lost_reason':
      case 'need_improvement':
      case 'drop_reason':
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Textarea
              value={getStringValue(value)}
              onChange={(e) => updateField(field, e.target.value)}
              rows={3}
              placeholder={`Enter ${getFieldLabel(field).toLowerCase()}...`}
            />
          </div>
        );

      default:
        return (
          <div key={field} className="space-y-2">
            <Label>{getFieldLabel(field)}</Label>
            <Input
              value={getStringValue(value)}
              onChange={(e) => updateField(field, e.target.value)}
              placeholder={`Enter ${getFieldLabel(field).toLowerCase()}...`}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isCreating ? 'Create New Deal' : formData.project_name || 'Edit Deal'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {currentStage}
                </Badge>
                {!isCreating && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      console.log("Toggle button clicked! Current state:", showPreviousStages);
                      setShowPreviousStages(!showPreviousStages);
                      console.log("New state will be:", !showPreviousStages);
                    }}
                  >
                    {showPreviousStages ? 'Hide Previous Stages' : 'Show All Stages'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Stage Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Stage: {currentStage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFields.map(field => renderField(field))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>

            <div className="flex gap-2">
              {/* Move to Stage Dropdown */}
              {!isCreating && getAvailableStagesForMoveTo().length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Move to:</span>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value === 'Won' || value === 'Lost' || value === 'Dropped') {
                        handleMoveToFinalStage(value as DealStage);
                      } else {
                        handleMoveToSpecificStage(value as DealStage);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStagesForMoveTo().map(stage => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Validation Message */}
              {!isCreating && !validateRequiredFields() && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  Complete all required fields to enable stage progression
                </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
