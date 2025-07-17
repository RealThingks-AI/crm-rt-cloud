/**
 * Generate a standardized filename for import/export operations
 * Format: [ModuleName]_DD_MM_YYYY_HH_MM.csv
 * Example: Deals_27_06_2025_11_30.csv
 */
export const generateExportFilename = (moduleName: string, suffix?: string): string => {
  const now = new Date();
  
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const baseFilename = `${moduleName}_${day}_${month}_${year}_${hours}_${minutes}`;
  
  if (suffix) {
    return `${baseFilename}_${suffix}.csv`;
  }
  
  return `${baseFilename}.csv`;
};

/**
 * Generate filename for different export types
 */
export const getExportFilename = (moduleName: string, type: 'all' | 'selected' | 'filtered'): string => {
  switch (type) {
    case 'selected':
      return generateExportFilename(moduleName, 'Selected');
    case 'filtered':
      return generateExportFilename(moduleName, 'Filtered');
    case 'all':
    default:
      return generateExportFilename(moduleName);
  }
};