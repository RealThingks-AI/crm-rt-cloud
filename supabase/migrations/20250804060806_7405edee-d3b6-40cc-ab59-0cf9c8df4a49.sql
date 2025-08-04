
-- Create yearly_revenue_targets table
CREATE TABLE IF NOT EXISTS public.yearly_revenue_targets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    total_target NUMERIC NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_audit_log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    user_id UUID REFERENCES auth.users,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS closing_date DATE,
ADD COLUMN IF NOT EXISTS signed_contract_date DATE,
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add missing columns to meetings table
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Rename inconsistent column names to match code expectations
-- deals table uses both created_time/modified_time and created_at/modified_at in different parts
-- Let's ensure both exist for compatibility
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing created_time and modified_time to sync with created_at/modified_at
UPDATE public.deals 
SET created_at = COALESCE(created_at, created_time, now()),
    modified_at = COALESCE(modified_at, modified_time, now());

-- Add missing title column to meetings table (some code expects both title and meeting_title)
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing meetings to sync title with meeting_title
UPDATE public.meetings 
SET title = COALESCE(title, meeting_title, 'Untitled Meeting')
WHERE title IS NULL;

-- Make title required going forward
ALTER TABLE public.meetings 
ALTER COLUMN title SET NOT NULL;

-- Fix meetings start_time column type (code expects timestamp, DB has time)
-- First add new properly typed column
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS start_time_new TIMESTAMP WITH TIME ZONE;

-- Migrate data from old start_time (if it exists as time) to new timestamp format
UPDATE public.meetings 
SET start_time_new = CASE 
    WHEN start_time IS NOT NULL AND date IS NOT NULL 
    THEN (date::TEXT || ' ' || start_time::TEXT)::TIMESTAMP WITH TIME ZONE
    ELSE now()
END
WHERE start_time_new IS NULL;

-- Drop old start_time column and rename new one
ALTER TABLE public.meetings DROP COLUMN IF EXISTS start_time CASCADE;
ALTER TABLE public.meetings RENAME COLUMN start_time_new TO start_time;
ALTER TABLE public.meetings ALTER COLUMN start_time SET NOT NULL;

-- Add RLS policies for new tables
ALTER TABLE public.yearly_revenue_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for yearly_revenue_targets
CREATE POLICY "Users can view yearly revenue targets" 
    ON public.yearly_revenue_targets 
    FOR SELECT 
    USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can create yearly revenue targets" 
    ON public.yearly_revenue_targets 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can update yearly revenue targets" 
    ON public.yearly_revenue_targets 
    FOR UPDATE 
    USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can delete yearly revenue targets" 
    ON public.yearly_revenue_targets 
    FOR DELETE 
    USING (auth.role() = 'authenticated'::text);

-- Policies for security_audit_log (read-only for most users)
CREATE POLICY "Users can view audit logs" 
    ON public.security_audit_log 
    FOR SELECT 
    USING (auth.role() = 'authenticated'::text);

CREATE POLICY "System can insert audit logs" 
    ON public.security_audit_log 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated'::text);

-- Add constraints
ALTER TABLE public.deals 
ADD CONSTRAINT IF NOT EXISTS deals_priority_check CHECK (priority >= 1 AND priority <= 5);

ALTER TABLE public.deals 
ADD CONSTRAINT IF NOT EXISTS deals_probability_check CHECK (probability >= 0 AND probability <= 100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_yearly_revenue_targets_year ON public.yearly_revenue_targets(year);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_closing_date ON public.deals(closing_date);
CREATE INDEX IF NOT EXISTS idx_deals_expected_closing_date ON public.deals(expected_closing_date);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
