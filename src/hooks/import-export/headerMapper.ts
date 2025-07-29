
import { getColumnConfig } from './columnConfig';

export const createHeaderMapper = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (header: string): string | null => {
    const trimmedHeader = header.trim();
    
    console.log(`Mapping header: "${trimmedHeader}"`);
    
    // For deals, use EXACT field name matching only
    if (tableName === 'deals') {
      if (config.allowedColumns.includes(trimmedHeader)) {
        console.log(`Exact field match found: ${trimmedHeader}`);
        return trimmedHeader;
      }
      
      console.log(`No exact mapping found for deals field: ${trimmedHeader}`);
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
