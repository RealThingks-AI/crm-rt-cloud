
-- Add all missing stage-specific fields to the deals table

-- Lead stage fields (some already exist)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lead_name TEXT;

-- Discussions stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS customer_need TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS customer_challenges TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS relationship_strength TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS internal_comment TEXT;

-- Qualified stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS budget TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS business_value TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS decision_maker_level TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_recurring TEXT;

-- RFQ stage fields (currency_type is the missing one causing the error)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS currency_type TEXT DEFAULT 'EUR';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS action_items TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS rfq_received_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS proposal_due_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS rfq_status TEXT;

-- Offered stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS current_status TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS closing TEXT;

-- Won stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS won_reason TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS signed_contract_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS implementation_start_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS handoff_status TEXT;

-- Lost stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS need_improvement TEXT;

-- Dropped stage fields
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS drop_reason TEXT;

-- Add constraints for enum-like fields
ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_stage_check 
  CHECK (stage IN ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_currency_type_check 
  CHECK (currency_type IN ('EUR', 'USD', 'INR'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_priority_check 
  CHECK (priority >= 1 AND priority <= 5);

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_probability_check 
  CHECK (probability >= 0 AND probability <= 100);

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_customer_challenges_check 
  CHECK (customer_challenges IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_relationship_strength_check 
  CHECK (relationship_strength IN ('Low', 'Medium', 'High'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_business_value_check 
  CHECK (business_value IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_decision_maker_level_check 
  CHECK (decision_maker_level IN ('Open', 'Ongoing', 'Done'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_is_recurring_check 
  CHECK (is_recurring IN ('Yes', 'No', 'Unclear'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_rfq_status_check 
  CHECK (rfq_status IN ('Drafted', 'Submitted', 'Rejected', 'Accepted'));

ALTER TABLE public.deals ADD CONSTRAINT IF NOT EXISTS deals_handoff_status_check 
  CHECK (handoff_status IN ('Not Started', 'In Progress', 'Complete'));
