-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_name TEXT NOT NULL,
  stage TEXT DEFAULT 'Discussions',
  related_lead_id UUID REFERENCES public.leads(id),
  related_meeting_id UUID,
  amount DECIMAL,
  currency TEXT DEFAULT 'USD',
  probability INTEGER,
  closing_date DATE,
  description TEXT,
  discussion_notes TEXT,
  budget_holder TEXT,
  decision_makers TEXT,
  timeline TEXT,
  nda_signed BOOLEAN,
  supplier_portal_required BOOLEAN,
  rfq_document_link TEXT,
  rfq_confirmation_note TEXT,
  offer_sent_date DATE,
  revised_offer_notes TEXT,
  negotiation_notes TEXT,
  execution_started BOOLEAN,
  lost_to TEXT,
  lost_reason TEXT,
  learning_summary TEXT,
  drop_summary TEXT,
  internal_notes TEXT,
  confirmation_note TEXT,
  begin_execution_date DATE,
  
  -- New stage-specific fields
  customer_need_identified BOOLEAN,
  need_summary TEXT,
  decision_maker_present BOOLEAN,
  customer_agreed_on_need TEXT CHECK (customer_agreed_on_need IN ('Yes', 'No', 'Partial')),
  budget_confirmed TEXT CHECK (budget_confirmed IN ('Yes', 'No', 'Estimate Only')),
  supplier_portal_access TEXT CHECK (supplier_portal_access IN ('Invited', 'Approved', 'Not Invited')),
  expected_deal_timeline_start DATE,
  expected_deal_timeline_end DATE,
  rfq_value DECIMAL,
  rfq_document_url TEXT,
  product_service_scope TEXT,
  proposal_sent_date DATE,
  negotiation_status TEXT CHECK (negotiation_status IN ('Ongoing', 'Finalized', 'Rejected')),
  decision_expected_date DATE,
  win_reason TEXT,
  drop_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  modified_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policies for deals
CREATE POLICY "Users can view their own deals" 
ON public.deals 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own deals" 
ON public.deals 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own deals" 
ON public.deals 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for deals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;