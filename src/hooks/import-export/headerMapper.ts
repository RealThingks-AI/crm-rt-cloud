
import { getColumnConfig } from './columnConfig';

export const createHeaderMapper = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (header: string): string | null => {
    const trimmedHeader = header.trim();
    
    console.log(`Mapping header: "${trimmedHeader}"`);
    
    // For deals, create comprehensive field mappings
    if (tableName === 'deals') {
      // Direct field matches first
      if (config.allowedColumns.includes(trimmedHeader)) {
        console.log(`Direct field match found: ${trimmedHeader}`);
        return trimmedHeader;
      }
      
      // Comprehensive field mappings for deals
      const dealMappings: Record<string, string> = {
        // System fields
        'id': 'id',
        'created_at': 'created_at',
        'modified_at': 'modified_at',
        'created_by': 'created_by',
        'modified_by': 'modified_by',
        
        // Core deal fields
        'deal_name': 'deal_name',
        'project_name': 'project_name',
        'stage': 'stage',
        'customer_name': 'customer_name',
        'lead_name': 'lead_name',
        'lead_owner': 'lead_owner',
        'region': 'region',
        'priority': 'priority',
        'internal_comment': 'internal_comment',
        
        // Discussions stage
        'customer_need': 'customer_need',
        'customer_challenges': 'customer_challenges',
        'relationship_strength': 'relationship_strength',
        
        // Qualified stage
        'budget': 'budget',
        'probability': 'probability',
        'expected_closing_date': 'expected_closing_date',
        'business_value': 'business_value',
        'decision_maker_level': 'decision_maker_level',
        
        // RFQ stage
        'is_recurring': 'is_recurring',
        'total_contract_value': 'total_contract_value',
        'currency_type': 'currency_type',
        'start_date': 'start_date',
        'end_date': 'end_date',
        'project_duration': 'project_duration',
        'action_items': 'action_items',
        'rfq_received_date': 'rfq_received_date',
        'proposal_due_date': 'proposal_due_date',
        'rfq_status': 'rfq_status',
        
        // Offered stage
        'current_status': 'current_status',
        'closing': 'closing',
        
        // Won stage
        'won_reason': 'won_reason',
        'quarterly_revenue_q1': 'quarterly_revenue_q1',
        'quarterly_revenue_q2': 'quarterly_revenue_q2',
        'quarterly_revenue_q3': 'quarterly_revenue_q3',
        'quarterly_revenue_q4': 'quarterly_revenue_q4',
        'total_revenue': 'total_revenue',
        'signed_contract_date': 'signed_contract_date',
        'implementation_start_date': 'implementation_start_date',
        'handoff_status': 'handoff_status',
        
        // Lost/Dropped stages
        'lost_reason': 'lost_reason',
        'need_improvement': 'need_improvement',
        'drop_reason': 'drop_reason',
        
        // Alternative field names that might be used
        'project': 'project_name',
        'customer': 'customer_name',
        'lead': 'lead_name',
        'owner': 'lead_owner',
        'value': 'total_contract_value',
        'contract_value': 'total_contract_value',
        'close_date': 'expected_closing_date',
        'expected_close': 'expected_closing_date',
        'closing_date': 'expected_closing_date',
        'duration': 'project_duration',
        'revenue': 'total_revenue',
        'q1_revenue': 'quarterly_revenue_q1',
        'q2_revenue': 'quarterly_revenue_q2',
        'q3_revenue': 'quarterly_revenue_q3',
        'q4_revenue': 'quarterly_revenue_q4'
      };
      
      // Check for mapping (case-insensitive)
      const lowerHeader = trimmedHeader.toLowerCase();
      for (const [key, value] of Object.entries(dealMappings)) {
        if (key.toLowerCase() === lowerHeader) {
          console.log(`Deal mapping found: ${trimmedHeader} -> ${value}`);
          return value;
        }
      }
      
      console.log(`No mapping found for deals field: ${trimmedHeader}`);
      return null;
    }
    
    // For other tables, use normalized matching
    const normalized = trimmedHeader.toLowerCase().replace(/[\s_-]+/g, '_');
    
    // Direct match first
    if (config.allowedColumns.includes(normalized)) {
      console.log(`Direct match found: ${normalized}`);
      return normalized;
    }
    
    // Generic mappings for other tables
    const mappings: Record<string, string> = {
      'name': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'full_name': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'contact': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'company': 'company_name',
      'organization': 'company_name',
      'job_title': 'position',
      'title': tableName === 'meetings' ? 'title' : 'position',
      'phone': 'phone_no',
      'telephone': 'phone_no',
      'mobile': 'mobile_no',
      'cell': 'mobile_no',
      'employees': 'no_of_employees',
      'revenue': 'annual_revenue',
      'source': 'contact_source',
      'status': tableName === 'meetings' ? 'status' : 'lead_status',
      'lead': 'lead_status'
    };
    
    const mapped = mappings[normalized] || null;
    if (mapped) {
      console.log(`Generic mapping found: ${normalized} -> ${mapped}`);
    } else {
      console.log(`No mapping found for: ${normalized}`);
    }
    
    return mapped;
  };
};
