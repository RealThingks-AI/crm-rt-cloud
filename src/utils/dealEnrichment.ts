import { supabase } from '@/integrations/supabase/client';
import type { Deal } from '@/hooks/useDeals';

// Simple pass-through function - no lead enrichment since all data comes from import
export const enrichDealsWithLeadInfo = async (deals: Deal[]): Promise<Deal[]> => {
  // Just return deals as-is since lead information should come directly from imported Excel data
  // The edge function handles all lead information during import process
  return deals;
};