
import { supabase } from '@/integrations/supabase/client';

export const createDuplicateChecker = (tableName: string) => {
  return async (record: any): Promise<boolean> => {
    try {
      if (tableName === 'deals') {
        console.log('Checking for duplicate deal:', {
          deal_name: record.deal_name,
          stage: record.stage,
          customer_name: record.customer_name
        });

        // First check if deal_name exists at all
        const { data: existingDeals, error } = await supabase
          .from('deals')
          .select('id, deal_name, stage, customer_name, project_name, lead_name')
          .ilike('deal_name', record.deal_name); // Use case-insensitive match

        if (error) {
          console.error('Error checking deal duplicates:', error);
          return false;
        }

        if (!existingDeals || existingDeals.length === 0) {
          console.log('No existing deals found with similar name');
          return false;
        }

        console.log(`Found ${existingDeals.length} existing deals with similar names:`, existingDeals);

        // Check for exact matches based on multiple criteria
        const exactMatch = existingDeals.find(existing => {
          // Normalize strings for comparison
          const normalizeName = (name: string) => name?.toLowerCase().trim() || '';
          
          const existingDealName = normalizeName(existing.deal_name);
          const recordDealName = normalizeName(record.deal_name);
          
          // Must have same deal name (case insensitive)
          if (existingDealName !== recordDealName) {
            return false;
          }
          
          // Additional match criteria
          const sameStage = existing.stage === record.stage;
          const sameCustomer = existing.customer_name && record.customer_name && 
                             normalizeName(existing.customer_name) === normalizeName(record.customer_name);
          const sameProject = existing.project_name && record.project_name && 
                            normalizeName(existing.project_name) === normalizeName(record.project_name);
          const sameLead = existing.lead_name && record.lead_name && 
                         normalizeName(existing.lead_name) === normalizeName(record.lead_name);
          
          // Consider it a duplicate if same name AND any other matching criteria
          return sameStage || sameCustomer || sameProject || sameLead;
        });

        if (exactMatch) {
          console.log(`Duplicate found - existing record:`, exactMatch);
          return true;
        }

        console.log('No exact duplicates found after detailed comparison');
        return false;
      }
      
      // For other tables, use original logic
      const keyFields = tableName === 'contacts_module' || tableName === 'contacts' 
        ? ['email', 'contact_name'] 
        : tableName === 'leads'
        ? ['email', 'lead_name']
        : tableName === 'meetings'
        ? ['title', 'start_time']
        : ['deal_name'];

      // Use any type to avoid complex Supabase type inference
      let query = supabase.from(tableName as any).select('id');
      
      keyFields.forEach(field => {
        if (record[field]) {
          query = query.eq(field, record[field]);
        }
      });

      const { data, error } = await query;
      const isDuplicate = !error && data && data.length > 0;
      
      if (isDuplicate) {
        console.log(`Duplicate found for record with ${keyFields.join(', ')}:`, keyFields.map(f => record[f]).join(', '));
      }
      
      return isDuplicate;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };
};
