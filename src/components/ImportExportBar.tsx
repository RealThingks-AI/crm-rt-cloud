import { useState } from "react";
import { Button } from "@/components/common/ui/button";
import { Input } from "@/components/common/ui/input";
import { Label } from "@/components/common/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/common/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/common/ui/tooltip";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { Deal } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";

interface ImportExportBarProps {
  deals: Deal[];
  onImport: (deals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => void;
  onExport: (selectedDeals?: Deal[]) => void;
  selectedDeals?: Deal[];
}

export const ImportExportBar = ({ deals, onImport, onExport, selectedDeals }: ImportExportBarProps) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const { toast } = useToast();

  const generateFileName = (prefix: string) => {
    const now = new Date();
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-');
    return `${prefix}_${date}_${time}.csv`;
  };

  const handleExport = () => {
    const dealsToExport = selectedDeals && selectedDeals.length > 0 ? selectedDeals : deals;
    
    if (dealsToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no deals to export.",
        variant: "destructive",
      });
      return;
    }

    // Filter out deals that don't have basic required data
    const validDeals = dealsToExport.filter(deal => {
      const hasBasicData = deal.id && 
                          deal.stage && 
                          (deal.project_name || deal.customer_name || deal.lead_name);
      
      if (!hasBasicData) {
        console.warn("Skipping invalid deal during export:", deal);
      }
      
      return hasBasicData;
    });

    if (validDeals.length === 0) {
      toast({
        title: "No valid data to export",
        description: "No deals have sufficient data for export.",
        variant: "destructive",
      });
      return;
    }

    if (validDeals.length < dealsToExport.length) {
      console.warn(`Filtered out ${dealsToExport.length - validDeals.length} invalid deals during export`);
    }

    // Export all fields exactly matching the app field names for full sync
    const exportFields = [
      'id',
      'project_name',
      'customer_name',
      'lead_owner',
      'stage',
      'priority',
      'total_contract_value',
      'expected_closing_date',
      'lead_name',
      'region',
      'probability',
      'customer_need',
      'customer_challenges',
      'relationship_strength',
      'budget',
      'business_value',
      'decision_maker_level',
      'is_recurring',
      'project_type',
      'duration',
      'revenue',
      'start_date',
      'end_date',
      'total_contract_value',
      'currency_type',
      'action_items',
      'current_status',
      'won_reason',
      'lost_reason',
      'need_improvement',
      'drop_reason',
      'internal_comment'
    ];

    // Create CSV headers
    const headers = exportFields.join(',');
    
    // Create CSV rows with better validation
    const rows = validDeals.map(deal => 
      exportFields.map(field => {
        const value = deal[field as keyof Deal];
        if (value === null || value === undefined || value === '') return '';
        
        // Convert to string and handle special characters
        let stringValue = String(value);
        
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',')
    );

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', generateFileName('Export'));
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${validDeals.length} valid deals to CSV`,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  const isValidValue = (value: string): boolean => {
    return value && 
           value.trim() !== '' && 
           value !== 'undefined' && 
           value !== 'null' && 
           value !== 'NULL' &&
           value !== 'NaN';
  };

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid file",
          description: "CSV file must have headers and at least one data row.",
          variant: "destructive",
        });
        return;
      }

      const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
      const data: (Partial<Deal> & { shouldUpdate?: boolean })[] = [];

      console.log('CSV headers:', headers);
      console.log('Expected number of columns:', headers.length);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        console.log(`Processing line ${i}:`, line);
        
        const values = parseCsvLine(line).map(v => v.replace(/^"|"$/g, '').trim());
        console.log(`Parsed values for line ${i}:`, values);
        console.log(`Values count: ${values.length}, Headers count: ${headers.length}`);
        
        // Skip lines that don't have the right number of columns
        if (values.length !== headers.length) {
          console.warn(`Skipping line ${i} - column count mismatch. Expected ${headers.length}, got ${values.length}`);
          continue;
        }
        
        const deal: Partial<Deal> & { shouldUpdate?: boolean } = {};
        let hasValidData = false;
        
        headers.forEach((header, index) => {
          const value = values[index];
          
          if (isValidValue(value)) {
            // Handle ID field - include valid UUIDs for updating existing records
            if (header === 'id') {
              if (isValidUUID(value)) {
                (deal as any)[header] = value;
                hasValidData = true;
                console.log(`Including ID field for record matching: ${value}`);
              } else {
                console.warn(`Invalid UUID for line ${i}: ${value}`);
              }
              return;
            }
            // Handle different data types based on field type
            else if (['priority', 'probability', 'duration'].includes(header)) {
              const numValue = parseInt(value);
              if (!isNaN(numValue) && numValue >= 0) {
                (deal as any)[header] = numValue;
                hasValidData = true;
              }
            } else if (['total_contract_value', 'revenue'].includes(header)) {
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && numValue >= 0) {
                (deal as any)[header] = numValue;
                hasValidData = true;
              }
            } else if (header === 'is_recurring') {
              (deal as any)[header] = value.toLowerCase() === 'true';
              hasValidData = true;
            } else if (['expected_closing_date', 'start_date', 'end_date'].includes(header)) {
              // Handle date fields - validate date format
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                (deal as any)[header] = value;
                hasValidData = true;
              }
            } else if (['relationship_strength', 'business_value', 'decision_maker_level', 'currency_type', 'stage'].includes(header)) {
              // Validate enum/important string values
              (deal as any)[header] = value;
              hasValidData = true;
            } else {
              // Regular string fields
              (deal as any)[header] = value;
              hasValidData = true;
            }
          }
        });

        // Only add deals that have meaningful data and essential fields
        if (hasValidData && (deal.project_name || deal.customer_name || deal.lead_name)) {
          deal.shouldUpdate = true;
          data.push(deal);
          console.log('Added deal:', deal);
        } else {
          console.log('Skipped invalid deal row:', deal);
        }
      }

      if (data.length === 0) {
        toast({
          title: "No valid data found",
          description: "The CSV file contains no valid deal data. Please ensure the file has proper headers and data.",
          variant: "destructive",
        });
        return;
      }

      console.log('Final import data:', data);
      onImport(data);
      setImportFile(null);
      
      toast({
        title: "Import successful",
        description: `Processed ${data.length} deals from CSV`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover-scale button-scale"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import deals from CSV file</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Deals from CSV</DialogTitle>
          </DialogHeader>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV file</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>
              
              {importFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    File: {importFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Size: {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!importFile}
                  className="hover-scale"
                >
                  Import Deals
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="hover-scale button-scale"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export deals to CSV file</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};