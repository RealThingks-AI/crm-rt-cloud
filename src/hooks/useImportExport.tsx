import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CSVParser } from '@/utils/csvParser';
import { getExportFilename } from '@/utils/exportUtils';
import { Deal, DealStage } from '@/types/deal';

interface ImportExportOptions {
  moduleName: string;
  onRefresh: () => void;
  tableName?: string;
}

// Simplified interface for column configuration
interface ColumnConfig {
  allowedColumns: string[];
  required: string[];
  enums: Record<string, string[]>;
}

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts_module' }: ImportExportOptions) => {
  const { user } = useAuth();

  // Define column mappings for different modules
  const getColumnConfig = (table: string): ColumnConfig => {
    const configs: Record<string, ColumnConfig> = {
      contacts_module: {
        allowedColumns: [
          'contact_name',
          'company_name',
          'position',
          'email',
          'phone_no',
          'mobile_no',
          'linkedin',
          'website',
          'contact_source',
          'lead_status',
          'industry',
          'no_of_employees',
          'annual_revenue',
          'city',
          'state',
          'country',
          'description'
        ],
        required: ['contact_name'],
        enums: {
          contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
          lead_status: ['New', 'Contacted', 'Qualified', 'Lost'],
          industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
        }
      },
      contacts: {
        allowedColumns: [
          'contact_name',
          'company_name',
          'position',
          'email',
          'phone_no',
          'mobile_no',
          'linkedin',
          'website',
          'contact_source',
          'lead_status',
          'industry',
          'no_of_employees',
          'annual_revenue',
          'city',
          'state',
          'country',
          'description'
        ],
        required: ['contact_name'],
        enums: {
          contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
          lead_status: ['New', 'Contacted', 'Qualified', 'Lost'],
          industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
        }
      },
      leads: {
        allowedColumns: [
          'lead_name',
          'contact_name',
          'company_name',
          'position',
          'email',
          'phone_no',
          'mobile_no',
          'linkedin',
          'website',
          'contact_source',
          'lead_status',
          'industry',
          'no_of_employees',
          'annual_revenue',
          'city',
          'state',
          'country',
          'description',
          'contact_owner',
          'lead_owner'
        ],
        required: ['lead_name', 'contact_owner'],
        enums: {
          contact_source: ['Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other'],
          lead_status: ['New', 'Contacted', 'Qualified', 'Lost'],
          industry: ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']
        }
      },
      meetings: {
        allowedColumns: [
          'title',
          'start_time',
          'end_time',
          'location',
          'agenda',
          'outcome',
          'next_action',
          'status',
          'priority',
          'participants',
          'teams_link',
          'lead_id',
          'contact_id',
          'deal_id',
          'tags',
          'follow_up_required',
          'host'
        ],
        required: ['title', 'start_time', 'end_time'],
        enums: {
          status: ['scheduled', 'in_progress', 'completed', 'cancelled'],
          priority: ['Low', 'Medium', 'High', 'Critical']
        }
      },
      deals: {
        // REMOVED system metadata fields - NO MORE created_at, modified_at, created_by, modified_by
        allowedColumns: [
          'deal_name',
          'stage',
          'internal_comment',
          'project_name',
          'lead_name',
          'customer_name',
          'region',
          'lead_owner',
          'priority',
          'customer_need',
          'relationship_strength',
          'budget',
          'probability',
          'expected_closing_date',
          'is_recurring',
          'customer_challenges',
          'business_value',
          'decision_maker_level',
          'total_contract_value',
          'currency_type',
          'start_date',
          'end_date',
          'project_duration',
          'action_items',
          'rfq_received_date',
          'proposal_due_date',
          'rfq_status',
          'current_status',
          'closing',
          'won_reason',
          'quarterly_revenue_q1',
          'quarterly_revenue_q2',
          'quarterly_revenue_q3',
          'quarterly_revenue_q4',
          'total_revenue',
          'signed_contract_date',
          'implementation_start_date',
          'handoff_status',
          'lost_reason',
          'need_improvement',
          'drop_reason'
        ],
        required: ['deal_name', 'stage'],
        enums: {
          stage: ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'],
          currency_type: ['EUR', 'USD', 'INR'],
          customer_challenges: ['Open', 'Ongoing', 'Done'],
          relationship_strength: ['Low', 'Medium', 'High'],
          business_value: ['Open', 'Ongoing', 'Done'],
          decision_maker_level: ['Open', 'Ongoing', 'Done'],
          is_recurring: ['Yes', 'No', 'Unclear'],
          rfq_status: ['Drafted', 'Submitted', 'Rejected', 'Accepted'],
          handoff_status: ['Not Started', 'In Progress', 'Complete']
        }
      }
    };
    return configs[table] || configs.contacts_module;
  };

  const config = getColumnConfig(tableName);

  // Enhanced header mapping - EXACT field matching for deals (NO system fields)
  const mapHeader = (header: string): string | null => {
    const trimmedHeader = header.trim();
    
    console.log(`Mapping header: "${trimmedHeader}"`);
    
    // For deals, use EXACT field name matching only
    if (tableName === 'deals') {
      // REJECT system metadata fields completely
      if (['id', 'created_at', 'modified_at', 'created_by', 'modified_by'].includes(trimmedHeader)) {
        console.log(`Rejecting system field: ${trimmedHeader}`);
        return null;
      }
      
      if (config.allowedColumns.includes(trimmedHeader)) {
        console.log(`Exact field match found: ${trimmedHeader}`);
        return trimmedHeader;
      }
      
      // No fallback mappings for deals - must match exactly
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

  const validateAndConvertValue = (key: string, value: string) => {
    if (!value || value.trim() === '') return null;

    console.log(`Validating field ${key} with value: ${value}`);

    // Handle enum validations with exact matching
    if (key in config.enums) {
      const enumValues = config.enums[key];
      if (enumValues && enumValues.includes(value)) {
        return value;
      }
      // Try case-insensitive match
      const normalizedValue = value.trim();
      const matchedValue = enumValues.find(enumVal => enumVal.toLowerCase() === normalizedValue.toLowerCase());
      if (matchedValue) {
        return matchedValue;
      }
      // For critical fields like stage, return null if invalid
      if (key === 'stage') {
        console.warn(`Invalid stage value: ${value}, available values: ${enumValues.join(', ')}`);
        return null;
      }
      // For other enums, return null to avoid setting invalid values
      console.warn(`Invalid enum value for ${key}: ${value}, available values: ${enumValues.join(', ')}`);
      return null;
    }

    // Handle specific field types for deals (REMOVED system field handling)
    if (tableName === 'deals') {
      switch (key) {
        case 'priority':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const priority = parseInt(value);
          return isNaN(priority) ? null : Math.max(1, Math.min(5, priority));
        
        case 'probability':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const prob = parseInt(value);
          return isNaN(prob) ? null : Math.max(0, Math.min(100, prob));
        
        case 'project_duration':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const duration = parseInt(value);
          return isNaN(duration) ? null : Math.max(0, duration);
        
        case 'total_contract_value':
        case 'quarterly_revenue_q1':
        case 'quarterly_revenue_q2':
        case 'quarterly_revenue_q3':
        case 'quarterly_revenue_q4':
        case 'total_revenue':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          const revenue = parseFloat(value.replace(/[€$,]/g, ''));
          return isNaN(revenue) ? null : Math.max(0, revenue);
        
        case 'start_date':
        case 'end_date':
        case 'expected_closing_date':
        case 'rfq_received_date':
        case 'proposal_due_date':
        case 'signed_contract_date':
        case 'implementation_start_date':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          // Handle exported date format (YYYY-MM-DD)
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        
        // Text fields
        case 'deal_name':
        case 'project_name':
        case 'lead_name':
        case 'customer_name':
        case 'region':
        case 'lead_owner':
        case 'budget':
        case 'internal_comment':
        case 'customer_need':
        case 'action_items':
        case 'current_status':
        case 'closing':
        case 'won_reason':
        case 'lost_reason':
        case 'need_improvement':
        case 'drop_reason':
          if (value === '' || value === 'null' || value === 'undefined') return null;
          return value.trim();
        
        default:
          if (value === '' || value === 'null' || value === 'undefined') return null;
          return value.trim();
      }
    }

    // Handle specific field types for other tables
    switch (key) {
      case 'no_of_employees':
        const employees = parseInt(value);
        return isNaN(employees) ? null : employees;
      
      case 'annual_revenue':
      case 'amount':
      case 'rfq_value':
        const revenue = parseFloat(value.replace(/[$,]/g, ''));
        return isNaN(revenue) ? null : revenue;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? value : null;
      
      // Time fields for meetings
      case 'start_time':
      case 'end_time':
        if (tableName === 'meetings') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString();
        }
        return value.trim();
      
      case 'participants':
        // Handle comma-separated email list
        if (tableName === 'meetings') {
          return value.split(',').map(email => email.trim()).filter(email => email);
        }
        return value.trim();
        
      case 'tags':
        // Handle comma-separated tags list
        if (tableName === 'meetings') {
          return value.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        return value.trim();
        
      case 'follow_up_required':
        if (tableName === 'meetings') {
          return ['yes', 'true', '1', 'on'].includes(value.toLowerCase());
        }
        return value.trim();
      
      default:
        return value.trim();
    }
  };

  // Enhanced validation function specifically for import records
  const validateImportRecord = (record: any): boolean => {
    console.log('Validating import record:', record);
    
    if (tableName === 'deals') {
      const hasValidDealName = record.deal_name && record.deal_name.trim() !== '';
      const hasValidStage = record.stage && ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'].includes(record.stage);
      
      console.log(`Import validation - deal_name: ${record.deal_name}, stage: ${record.stage}, valid: ${hasValidDealName && hasValidStage}`);
      
      if (!hasValidDealName) {
        console.error('Invalid deal: missing deal_name');
        return false;
      }
      
      if (!hasValidStage) {
        console.error(`Invalid deal: invalid stage "${record.stage}"`);
        return false;
      }
      
      return true;
    }
    
    const isValid = config.required.every(field => {
      const value = record[field];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });
    
    console.log(`Import validation for ${tableName}:`, isValid);
    return isValid;
  };

  // IMPROVED duplicate detection logic - use more comprehensive matching
  const checkDuplicate = async (record: any): Promise<boolean> => {
    try {
      if (tableName === 'deals') {
        // Enhanced duplicate checking for deals - use multiple fields for better accuracy
        console.log('Checking for duplicate deal:', {
          deal_name: record.deal_name,
          stage: record.stage,
          customer_name: record.customer_name,
          project_name: record.project_name
        });

        // First check: exact deal_name match (case-insensitive)
        let query = supabase
          .from('deals')
          .select('id, deal_name, stage, customer_name, project_name')
          .ilike('deal_name', record.deal_name);

        const { data: nameMatches, error: nameError } = await query;
        
        if (nameError) {
          console.error('Error checking deal name duplicates:', nameError);
          return false;
        }

        if (nameMatches && nameMatches.length > 0) {
          // Additional checks for better duplicate detection
          const exactMatches = nameMatches.filter(existing => {
            // Exact deal name match
            const nameMatch = existing.deal_name.toLowerCase() === record.deal_name.toLowerCase();
            
            // Same stage match
            const stageMatch = existing.stage === record.stage;
            
            // Customer or project name match (if available)
            const customerMatch = record.customer_name && existing.customer_name && 
              existing.customer_name.toLowerCase() === record.customer_name.toLowerCase();
            
            const projectMatch = record.project_name && existing.project_name && 
              existing.project_name.toLowerCase() === record.project_name.toLowerCase();

            // Consider it a duplicate if:
            // 1. Same name and same stage, OR
            // 2. Same name and same customer, OR  
            // 3. Same name and same project
            return nameMatch && (stageMatch || customerMatch || projectMatch);
          });

          if (exactMatches.length > 0) {
            console.log(`Duplicate deal found:`, exactMatches[0]);
            return true;
          }
        }

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

  const handleImport = async (file: File) => {
    try {
      console.log(`Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      console.log('Import config:', { moduleName: moduleName, tableName: tableName });
      console.log('Expected columns for deals (NO system fields):', config.allowedColumns);
      
      const text = await file.text();
      console.log('File content loaded, length:', text.length);
      
      const { headers, rows: dataRows } = CSVParser.parseCSV(text);
      
      console.log('Parsed CSV - Headers:', headers);
      console.log('Parsed CSV - Data rows:', dataRows.length);
      
      if (dataRows.length > 0) {
        console.log('First data row:', dataRows[0]);
        console.log('First data row length:', dataRows[0].length);
        console.log('Headers length:', headers.length);
      }

      // Validate headers for deals (NO system fields expected)
      if (tableName === 'deals') {
        const expectedHeaders = config.allowedColumns;
        const systemFields = ['id', 'created_at', 'modified_at', 'created_by', 'modified_by'];
        const hasSystemFields = headers.some(h => systemFields.includes(h));
        
        if (hasSystemFields) {
          console.warn('CSV contains system fields that will be ignored:', headers.filter(h => systemFields.includes(h)));
          toast({
            title: "System fields detected",
            description: "System metadata fields will be ignored during import.",
          });
        }
        
        // Check if we have minimum required headers
        const hasRequiredHeaders = headers.includes('deal_name') && headers.includes('stage');
        if (!hasRequiredHeaders) {
          throw new Error('Missing required headers: deal_name and stage are required for deals import');
        }
      }

      const mappedHeaders = headers.map(header => ({
        original: header,
        mapped: mapHeader(header)
      }));

      const validHeaders = mappedHeaders.filter(h => h.mapped !== null);
      const invalidHeaders = mappedHeaders.filter(h => h.mapped === null);
      
      console.log('Valid headers:', validHeaders);
      console.log('Invalid headers:', invalidHeaders);
      
      if (validHeaders.length === 0) {
        throw new Error('No valid headers found. Please ensure CSV headers match export field names exactly.');
      }
      
      if (invalidHeaders.length > 0) {
        const systemFieldsIgnored = invalidHeaders.filter(h => 
          ['id', 'created_at', 'modified_at', 'created_by', 'modified_by'].includes(h.original)
        );
        const otherIgnored = invalidHeaders.filter(h => 
          !['id', 'created_at', 'modified_at', 'created_by', 'modified_by'].includes(h.original)
        );
        
        if (systemFieldsIgnored.length > 0) {
          console.log('System fields ignored (expected):', systemFieldsIgnored.map(h => h.original));
        }
        
        if (otherIgnored.length > 0) {
          console.warn('Other ignored columns:', otherIgnored.map(h => h.original));
          toast({
            title: "Column Warning",
            description: `Ignoring ${otherIgnored.length} unrecognized column(s): ${otherIgnored.map(h => h.original).join(', ')}`,
          });
        }
      }

      console.log('Header mappings:', mappedHeaders);
      console.log(`Processing ${dataRows.length} rows for ${tableName}`);

      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];

      // Process records one by one to ensure proper duplicate checking
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const record: any = {};
          
          mappedHeaders.forEach((headerMap, index) => {
            if (headerMap.mapped && index < row.length) {
              const rawValue = row[index];
              if (rawValue && rawValue.trim() !== '') {
                const validatedValue = validateAndConvertValue(headerMap.mapped, rawValue);
                if (validatedValue !== null) {
                  record[headerMap.mapped] = validatedValue;
                }
              }
            }
          });
          
          console.log(`Row ${i + 1} processed record:`, record);
          
          // Set required defaults based on table type
          if (tableName === 'deals') {
            // Ensure required fields have values
            if (!record.deal_name && record.project_name) {
              record.deal_name = record.project_name;
            }
            if (!record.deal_name) {
              errors.push(`Row ${i + 1}: Missing deal_name`);
              errorCount++;
              continue;
            }
            if (!record.stage) {
              record.stage = 'Lead';
            }
            
            // Set user ID for new records - ALWAYS set these automatically
            record.created_by = user?.id || '00000000-0000-0000-0000-000000000000';
            record.modified_by = user?.id || '00000000-0000-0000-0000-000000000000';
            
            const isValid = validateImportRecord(record);
            
            if (!isValid) {
              errors.push(`Row ${i + 1}: Invalid deal data - missing deal_name or invalid stage`);
              console.log(`Row ${i + 1}: Validation failed for deal`, record);
              errorCount++;
              continue;
            }
          } else {
            config.required.forEach(field => {
              if (!record[field]) {
                if (field === 'contact_name') {
                  record[field] = `Contact ${i + 1}`;
                } else if (field === 'lead_name') {
                  record[field] = `Lead ${i + 1}`;
                } else if (field === 'title') {
                  record[field] = `Meeting ${i + 1}`;
                } else if (field === 'contact_owner') {
                  throw new Error(`Contact Owner is required.`);
                } else if (field === 'start_time' || field === 'end_time') {
                  throw new Error(`Missing required field: ${field}`);
                }
              }
            });
            
            record.created_by = user?.id || '00000000-0000-0000-0000-000000000000';
            if (tableName !== 'meetings') {
              record.modified_by = user?.id || null;
            }
          }

          // Check for duplicates before insertion
          const isDuplicate = await checkDuplicate(record);
          if (isDuplicate) {
            console.log(`Skipping duplicate record: ${record.deal_name || record.contact_name || record.lead_name || 'Unknown'}`);
            duplicateCount++;
            continue;
          }

          // Insert single record
          console.log(`Inserting record ${i + 1}:`, record);
          
          const { data, error } = await supabase
            .from(tableName as any)
            .insert([record])
            .select('id');

          if (error) {
            console.error(`Error inserting row ${i + 1}:`, error);
            errors.push(`Row ${i + 1}: ${error.message}`);
            errorCount++;
          } else {
            const insertedCount = data?.length || 1;
            successCount += insertedCount;
            console.log(`Successfully inserted record ${i + 1}`);
          }

          // Small delay to prevent overwhelming the database
          if (i % 10 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (rowError: any) {
          console.error(`Error processing row ${i + 1}:`, rowError);
          errors.push(`Row ${i + 1}: ${rowError.message}`);
          errorCount++;
        }
      }

      console.log(`Import completed - Success: ${successCount}, Errors: ${errorCount}, Duplicates: ${duplicateCount}`);
      console.log('Import errors:', errors);

      let message = `Import completed: ${successCount} records imported`;
      if (duplicateCount > 0) message += `, ${duplicateCount} duplicates skipped`;
      if (errorCount > 0) message += `, ${errorCount} errors`;

      if (successCount > 0) {
        toast({
          title: "Import successful",
          description: message,
        });
      }

      if (errorCount > 0) {
        console.log('Import errors:', errors.slice(0, 10));
        toast({
          variant: "destructive",
          title: "Import completed with errors",
          description: `${message}. Check console for details.`,
        });
      } else if (duplicateCount > 0) {
        toast({
          title: "Import completed with duplicates",
          description: message,
        });
      }
      
      console.log('Refreshing data after import...');
      onRefresh();

    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    }
  };

  const handleExportAll = async (data: any[]) => {
    console.log(`Exporting all data for ${tableName}:`, data?.length || 0, 'records');
    const filename = getExportFilename(moduleName, 'all');
    exportToCSV(data, filename);
  };

  const handleExportSelected = (data: any[], selectedIds: string[]) => {
    const selectedData = data.filter(item => selectedIds.includes(item.id));
    const filename = getExportFilename(moduleName, 'selected');
    console.log(`Exporting selected data:`, selectedData.length, 'records');
    exportToCSV(selectedData, filename);
  };

  const handleExportFiltered = (filteredData: any[]) => {
    const filename = getExportFilename(moduleName, 'filtered');
    console.log(`Exporting filtered data:`, filteredData.length, 'records');
    exportToCSV(filteredData, filename);
  };

  const exportToCSV = async (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "No data to export",
      });
      return;
    }

    const headers = config.allowedColumns;

    console.log('Exporting with headers:', headers);
    console.log('Sample data:', data[0]);

    const processedData = data.map(row => {
      const processedRow: any = {};
      
      headers.forEach(header => {
        let value = row[header];
        
        if (value === null || value === undefined) {
          processedRow[header] = '';
          return;
        }
        
        if ((header.includes('time') || header.includes('date')) && !header.includes('_id')) {
          if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              processedRow[header] = date.toISOString();
            } else {
              processedRow[header] = '';
            }
          } else {
            processedRow[header] = '';
          }
        } else if (Array.isArray(value)) {
          processedRow[header] = value.join(', ');
        } else if (typeof value === 'boolean') {
          processedRow[header] = value ? 'true' : 'false';
        } else {
          processedRow[header] = String(value);
        }
      });
      
      return processedRow;
    });

    const csvContent = CSVParser.toCSV(processedData, headers);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log(`Export completed: ${data.length} records exported to ${filename}`);
    toast({
      title: "Export completed",
      description: `Successfully exported ${data.length} records to ${filename}`,
    });
  };

  return {
    handleImport,
    handleExportAll,
    handleExportSelected,
    handleExportFiltered
  };
};
