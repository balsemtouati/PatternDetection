export interface DataSource {
  name: string;
  data: any[];
  type: 'crm' | 'erp' | 'financial' | 'hr' | 'projects' | 'tenders';
  filePath?: string;
}

export interface MergedRecord {
  __source__: string;
  __source_type__: string;
  __record_id__: string;
  __merged_at__: string;
  [key: string]: any;
}

export class DataMerger {
  /**
   * Fusion intelligente des sources de données
   */
  public mergeDataSources(dataSources: DataSource[]): MergedRecord[] {
    const mergedData: MergedRecord[] = [];
    
    dataSources.forEach(source => {
      source.data.forEach((record, index) => {
        const mergedRecord: MergedRecord = {
          ...record,
          __source__: source.name,
          __source_type__: source.type,
          __record_id__: `${source.name}_${Date.now()}_${index}`,
          __merged_at__: new Date().toISOString()
        };
        
        mergedData.push(mergedRecord);
      });
    });
    
    return mergedData;
  }

  /**
   * Validation des sources de données
   */
  public validateDataSources(dataSources: DataSource[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (dataSources.length === 0) {
      errors.push('No data sources provided');
    }
    
    dataSources.forEach(source => {
      if (!source.name) {
        errors.push(`Data source missing name`);
      }
      if (!source.type) {
        errors.push(`Data source ${source.name} missing type`);
      }
      if (!Array.isArray(source.data)) {
        errors.push(`Data source ${source.name} data is not an array`);
      }
      if (source.data.length === 0) {
        errors.push(`Data source ${source.name} is empty`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Statistiques de fusion
   */
  public getMergeStatistics(dataSources: DataSource[]): {
    totalSources: number;
    totalRecords: number;
    sourceBreakdown: { [key: string]: number };
  } {
    const sourceBreakdown: { [key: string]: number } = {};
    let totalRecords = 0;
    
    dataSources.forEach(source => {
      sourceBreakdown[source.name] = source.data.length;
      totalRecords += source.data.length;
    });
    
    return {
      totalSources: dataSources.length,
      totalRecords,
      sourceBreakdown
    };
  }
}

export default DataMerger; 