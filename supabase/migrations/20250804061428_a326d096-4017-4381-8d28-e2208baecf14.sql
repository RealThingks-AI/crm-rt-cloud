
-- Drop the meeting_outcomes table first (it might reference meetings)
DROP TABLE IF EXISTS public.meeting_outcomes CASCADE;

-- Drop the meetings table
DROP TABLE IF EXISTS public.meetings CASCADE;
