import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CSVParser } from '@/utils/csvParser';
import { getExportFilename } from '@/utils/exportUtils';
import { getColumnConfig } from './import-export/columnConfig';
import { createHeaderMapper } from './import-export/headerMapper';
import { createValueValidator } from './import-export/valueValidator';
import { createDuplicateChecker } from './import-export/duplicateChecker';
import { createRecordValidator } from './import-export/recordValidator';

interface ImportExportOptions {
  moduleName: string;
  onRefresh: () => void;
  tableName?: string;
}

export const useImportExport = ({ moduleName, onRefresh, tableName = 'contacts_module' }: ImportExportOptions) => {
  const { user } = useAuth();
  const config = getColumnConfig(tableName);
  
  // Create utility functions for this table
  const mapHeader = createHeaderMapper(tableName);
  const validateAndConvertValue = createValueValidator(tableName);
  const checkDuplicate = createDuplicateChecker(tableName);
  const validateImportRecord = createRecordValidator(tableName);

  const handleImport = async (file: File) => {
    try {
      console.log(`Starting import of ${file.name} (${file.size} bytes) into ${tableName}`);
      console.log('Import config:', { moduleName: moduleName, tableName: tableName });
      console.log('Expected columns for deals:', config.allowedColumns);
      
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

      // Validate headers for deals
      if (tableName === 'deals') {
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
        const systemFields = ['id', 'created_at', 'modified_at', 'created_by', 'modified_by'];
        const otherIgnored = invalidHeaders.filter(h => !systemFields.includes(h.original));
        
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

      // Process records one by one with enhanced duplicate checking
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
            
            // Set user ID for new records
            record.created_by = user?.id || '00000000-0000-0000-0000-000000000000';
            record.modified_by = user?.id || '00000000-0000-0000-0000-000000000000';
            
            const isValid = validateImportRecord(record);
            
            if (!isValid) {
              errors.push(`Row ${i + 1}: Invalid deal data - missing deal_name or invalid stage`);
              console.log(`Row ${i + 1}: Validation failed for deal`, record);
              errorCount++;
              continue;
            }
            
            // Enhanced duplicate checking - check BEFORE insert with delay for database consistency
            console.log(`Checking for duplicates before inserting row ${i + 1}...`);
            
            // Add a small delay to ensure database consistency
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const isDuplicate = await checkDuplicate(record);
            if (isDuplicate) {
              console.log(`Skipping duplicate record ${i + 1}: ${record.deal_name}`);
              duplicateCount++;
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

            // Check for duplicates before insertion
            const isDuplicate = await checkDuplicate(record);
            if (isDuplicate) {
              console.log(`Skipping duplicate record: ${record.contact_name || record.lead_name || 'Unknown'}`);
              duplicateCount++;
              continue;
            }
          }

          // Insert single record with proper type handling
          console.log(`Inserting record ${i + 1}:`, record);
          
          const insertResult = await supabase
            .from(tableName)
            .insert([record])
            .select('id');

          if (insertResult.error) {
            console.error(`Error inserting row ${i + 1}:`, insertResult.error);
            errors.push(`Row ${i + 1}: ${insertResult.error.message}`);
            errorCount++;
          } else if (insertResult.data) {
            const insertedCount = insertResult.data.length;
            successCount += insertedCount;
            console.log(`Successfully inserted record ${i + 1}:`, insertResult.data[0]?.id);
          }

          // Small delay to prevent overwhelming the database
          if (i % 5 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
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
