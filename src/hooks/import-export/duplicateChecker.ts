
import { supabase } from '@/integrations/supabase/client';

export const createDuplicateChecker = (tableName: string) => {
  return async (record: any): Promise<boolean> => {
    try {
      if (tableName === 'deals') {
        console.log('Checking for duplicate deal:', {
          id: record.id,
          deal_name: record.deal_name,
          stage: record.stage,
          customer_name: record.customer_name,
          project_name: record.project_name
        });

        // If the record has an ID, check if it exists in the database
        if (record.id) {
          const { data: existingById, error: idError } = await supabase
            .from('deals')
            .select('id')
            .eq('id', record.id)
            .single();

          if (!idError && existingById) {
            console.log('Duplicate found by ID:', record.id);
            return true;
          }
        }

        // Check for duplicates based on deal_name (exact match)
        if (record.deal_name) {
          const { data: existingDeals, error } = await supabase
            .from('deals')
            .select('id, deal_name, stage, customer_name, project_name, lead_name')
            .eq('deal_name', record.deal_name);

          if (error) {
            console.error('Error checking deal duplicates:', error);
            return false;
          }

          if (existingDeals && existingDeals.length > 0) {
            console.log(`Found ${existingDeals.length} existing deals with same deal_name`);
            
            // For exact deal_name matches, consider it a duplicate
            const exactMatch = existingDeals.find(existing => {
              return existing.deal_name === record.deal_name;
            });

            if (exactMatch) {
              console.log('Duplicate found - exact deal_name match:', exactMatch.deal_name);
              return true;
            }
          }
        }

        // Fallback: check by project_name + customer_name combination
        if (record.project_name && record.customer_name) {
          const { data: projectCustomerMatch, error: projectError } = await supabase
            .from('deals')
            .select('id, project_name, customer_name')
            .eq('project_name', record.project_name)
            .eq('customer_name', record.customer_name);

          if (!projectError && projectCustomerMatch && projectCustomerMatch.length > 0) {
            console.log('Duplicate found by project_name + customer_name combination');
            return true;
          }
        }

        console.log('No duplicates found for deal');
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
