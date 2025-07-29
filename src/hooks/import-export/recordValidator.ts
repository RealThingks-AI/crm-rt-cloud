
import { getColumnConfig } from './columnConfig';

export const createRecordValidator = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (record: any): boolean => {
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
};
