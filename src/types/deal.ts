export type DealStage = 'Lead' | 'Discussions' | 'Qualified' | 'RFQ' | 'Offered' | 'Won' | 'Lost' | 'Dropped';

export interface Deal {
  id: string;
  created_at: string;
  modified_at: string;
  created_by: string | null;
  modified_by: string | null;
  
  // Legacy field mapping
  deal_name?: string;
  
  // Stage
  stage: DealStage;
  
  // Lead stage fields
  project_name?: string;
  customer_name?: string;
  lead_name?: string;
  lead_owner?: string;
  region?: string;
  priority?: number;
  probability?: number;
  internal_comment?: string; // Use internal_comment instead of comment
  
  // Discussions stage fields
  expected_closing_date?: string;
  customer_need?: string;
  customer_challenges?: string;
  relationship_strength?: 'Low' | 'Medium' | 'High';
  
  // Qualified stage fields
  budget?: string;
  business_value?: 'Low' | 'Medium' | 'High';
  decision_maker_level?: 'Not Identified' | 'Identified' | 'Done';
  
  // RFQ stage fields
  is_recurring?: boolean;
  project_type?: string;
  duration?: number;
  revenue?: number;
  start_date?: string;
  end_date?: string;
  
  // Offered stage fields
  total_contract_value?: number;
  currency_type?: 'EUR' | 'USD' | 'INR';
  action_items?: string;
  current_status?: string;
  
  // Won stage fields
  won_reason?: string;
  
  // Lost stage fields
  lost_reason?: string;
  need_improvement?: string;
  
  // Dropped stage fields
  drop_reason?: string;
}

export const DEAL_STAGES: DealStage[] = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];

export const STAGE_COLORS = {
  Lead: 'bg-stage-lead text-stage-lead-foreground border-stage-lead-foreground/20',
  Discussions: 'bg-stage-discussions text-stage-discussions-foreground border-stage-discussions-foreground/20',
  Qualified: 'bg-stage-qualified text-stage-qualified-foreground border-stage-qualified-foreground/20',
  RFQ: 'bg-stage-rfq text-stage-rfq-foreground border-stage-rfq-foreground/20',
  Offered: 'bg-stage-offered text-stage-offered-foreground border-stage-offered-foreground/20',
  Won: 'bg-stage-won text-stage-won-foreground border-stage-won-foreground/20',
  Lost: 'bg-stage-lost text-stage-lost-foreground border-stage-lost-foreground/20',
  Dropped: 'bg-stage-dropped text-stage-dropped-foreground border-stage-dropped-foreground/20',
};

export const getStageIndex = (stage: DealStage): number => {
  return DEAL_STAGES.indexOf(stage);
};

export const getFieldsForStage = (stage: DealStage): string[] => {
  const stageIndex = getStageIndex(stage);
  const allStages = [
    // Lead fields
    ['project_name', 'customer_name', 'lead_name', 'lead_owner', 'region', 'priority', 'probability', 'internal_comment'],
    // Discussions fields  
    ['expected_closing_date', 'customer_need', 'customer_challenges', 'relationship_strength'],
    // Qualified fields
    ['budget', 'business_value', 'decision_maker_level'],
    // RFQ fields
    ['is_recurring', 'project_type', 'duration', 'revenue', 'start_date', 'end_date'],
    // Offered fields
    ['total_contract_value', 'currency_type', 'action_items', 'current_status'],
  ];
  
  let availableFields: string[] = [];
  for (let i = 0; i <= stageIndex && i < allStages.length; i++) {
    availableFields = [...availableFields, ...allStages[i]];
  }
  
  // Add final stage-specific reason fields based on the current stage
  if (stage === 'Won') {
    availableFields.push('won_reason');
  } else if (stage === 'Lost') {
    availableFields.push('lost_reason', 'need_improvement');
  } else if (stage === 'Dropped') {
    availableFields.push('drop_reason');
  }
  
  // Always include comment field
  if (!availableFields.includes('internal_comment')) {
    availableFields.push('internal_comment');
  }
  
  return availableFields;
};

export const getEditableFieldsForStage = (stage: DealStage): string[] => {
  // All fields are always editable according to requirements
  return getFieldsForStage(stage);
};

export const getRequiredFieldsForStage = (stage: DealStage): string[] => {
  const requiredFields = {
    Lead: ['project_name', 'customer_name', 'lead_name', 'lead_owner', 'probability'],
    Discussions: ['expected_closing_date', 'customer_need', 'customer_challenges', 'relationship_strength'],
    Qualified: ['budget', 'business_value', 'decision_maker_level'],
    RFQ: ['is_recurring', 'project_type', 'duration', 'revenue', 'start_date', 'end_date'],
    Offered: ['total_contract_value', 'currency_type', 'action_items', 'current_status'],
    Won: ['won_reason', 'start_date'],
    Lost: ['lost_reason', 'need_improvement'],
    Dropped: ['drop_reason'],
  };
  return requiredFields[stage] || [];
};

export const getNextStage = (currentStage: DealStage): DealStage | null => {
  const stageFlow = {
    Lead: 'Discussions',
    Discussions: 'Qualified', 
    Qualified: 'RFQ',
    RFQ: 'Offered',
    Offered: null, // After Offered, user can choose Won/Lost/Dropped
  };
  return stageFlow[currentStage] || null;
};

export const getFinalStageOptions = (): DealStage[] => {
  return ['Won', 'Lost', 'Dropped'];
};