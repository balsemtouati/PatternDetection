export interface CleaningConfig {
  dateColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  maxBins: number;
  dateThreshold: number;
}

export interface CleanedRecord {
  [key: string]: any;
}

export interface ColumnType {
  name: string;
  type: 'date' | 'numeric' | 'categorical' | 'text' | 'boolean';
  confidence: number;
}

export class DataCleaner {
  /**
   * Détection automatique des types de colonnes
   */
  public detectColumnTypes(data: any[]): ColumnType[] {
    if (data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    const columnTypes: ColumnType[] = [];
    
    columns.forEach(column => {
      const type = this.detectColumnType(data, column);
      columnTypes.push({
        name: column,
        type: type.type,
        confidence: type.confidence
      });
    });
    
    return columnTypes;
  }

  /**
   * Nettoyage et transformation des données
   */
  public cleanAndTransformData(
    data: any[],
    columnTypes: ColumnType[],
    config?: Partial<CleaningConfig>
  ): CleanedRecord[] {
    const defaultConfig: CleaningConfig = {
      dateColumns: [],
      numericColumns: [],
      categoricalColumns: [],
      maxBins: 5,
      dateThreshold: 20
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    
    // Mettre à jour la configuration basée sur la détection automatique
    columnTypes.forEach(colType => {
      if (colType.confidence > 0.7) {
        switch (colType.type) {
          case 'date':
            if (!finalConfig.dateColumns.includes(colType.name)) {
              finalConfig.dateColumns.push(colType.name);
            }
            break;
          case 'numeric':
            if (!finalConfig.numericColumns.includes(colType.name)) {
              finalConfig.numericColumns.push(colType.name);
            }
            break;
          case 'categorical':
            if (!finalConfig.categoricalColumns.includes(colType.name)) {
              finalConfig.categoricalColumns.push(colType.name);
            }
            break;
        }
      }
    });
    
    return data.map(record => this.cleanRecord(record, finalConfig));
  }

  /**
   * Nettoyage d'un enregistrement individuel
   */
  private cleanRecord(record: any, config: CleaningConfig): CleanedRecord {
    const cleanedRecord: CleanedRecord = { ...record };
    
    // Nettoyage des colonnes de date
    config.dateColumns.forEach(dateCol => {
      if (cleanedRecord[dateCol]) {
        const parsedDate = this.parseDate(cleanedRecord[dateCol]);
        if (parsedDate) {
          cleanedRecord[dateCol] = parsedDate;
          // Ajouter des features temporelles
          cleanedRecord[`${dateCol}_year`] = parsedDate.getFullYear();
          cleanedRecord[`${dateCol}_month`] = parsedDate.getMonth() + 1;
          cleanedRecord[`${dateCol}_quarter`] = Math.ceil((parsedDate.getMonth() + 1) / 3);
          cleanedRecord[`${dateCol}_dayofweek`] = parsedDate.getDay();
        }
      }
    });
    
    // Nettoyage des colonnes numériques
    config.numericColumns.forEach(numericCol => {
      if (cleanedRecord[numericCol] !== undefined && cleanedRecord[numericCol] !== null) {
        const numericValue = this.parseNumeric(cleanedRecord[numericCol]);
        if (numericValue !== null) {
          cleanedRecord[numericCol] = numericValue;
          // Discrétisation automatique
          cleanedRecord[`${numericCol}_bin`] = this.discretizeValue(
            numericValue,
            this.getColumnStats(cleanedData, numericCol),
            config.maxBins
          );
        }
      }
    });
    
    // Nettoyage des colonnes catégorielles
    config.categoricalColumns.forEach(catCol => {
      if (cleanedRecord[catCol] !== undefined && cleanedRecord[catCol] !== null) {
        cleanedRecord[catCol] = this.cleanCategoricalValue(cleanedRecord[catCol]);
      }
    });
    
    return cleanedRecord;
  }

  /**
   * Détection du type d'une colonne
   */
  private detectColumnType(data: any[], columnName: string): { type: ColumnType['type']; confidence: number } {
    const values = data.map(record => record[columnName]).filter(val => val !== undefined && val !== null);
    if (values.length === 0) return { type: 'text', confidence: 0 };
    
    const sampleSize = Math.min(values.length, 100);
    const sample = values.slice(0, sampleSize);
    
    // Test pour les dates
    const dateMatches = sample.filter(val => this.isDateValue(val)).length;
    const dateConfidence = dateMatches / sampleSize;
    
    // Test pour les nombres
    const numericMatches = sample.filter(val => this.isNumericValue(val)).length;
    const numericConfidence = numericMatches / sampleSize;
    
    // Test pour les booléens
    const booleanMatches = sample.filter(val => this.isBooleanValue(val)).length;
    const booleanConfidence = booleanMatches / sampleSize;
    
    // Test pour les catégorielles
    const uniqueValues = new Set(sample).size;
    const categoricalConfidence = uniqueValues <= Math.min(20, sampleSize * 0.3) ? 0.8 : 0.2;
    
    // Déterminer le type avec la plus haute confiance
    const confidences = [
      { type: 'date' as const, confidence: dateConfidence },
      { type: 'numeric' as const, confidence: numericConfidence },
      { type: 'boolean' as const, confidence: booleanConfidence },
      { type: 'categorical' as const, confidence: categoricalConfidence },
      { type: 'text' as const, confidence: 0.1 }
    ];
    
    const bestMatch = confidences.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return bestMatch;
  }

  /**
   * Vérification si une valeur est une date
   */
  private isDateValue(value: any): boolean {
    if (value instanceof Date) return true;
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }

  /**
   * Vérification si une valeur est numérique
   */
  private isNumericValue(value: any): boolean {
    if (typeof value === 'number') return true;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return !isNaN(num) && isFinite(num);
    }
    return false;
  }

  /**
   * Vérification si une valeur est booléenne
   */
  private isBooleanValue(value: any): boolean {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return ['true', 'false', 'yes', 'no', '1', '0'].includes(lower);
    }
    return false;
  }

  /**
   * Parsing d'une date
   */
  private parseDate(value: any): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  /**
   * Parsing d'une valeur numérique
   */
  private parseNumeric(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Nettoyage d'une valeur catégorielle
   */
  private cleanCategoricalValue(value: any): string {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return String(value).toLowerCase();
  }

  /**
   * Discrétisation d'une valeur numérique
   */
  private discretizeValue(value: number, stats: any, maxBins: number): string {
    const { min, max, mean, std } = stats;
    const range = max - min;
    
    if (range === 0) return 'constant';
    
    const bins = Math.min(maxBins, Math.ceil(range / std) || 5);
    const binSize = range / bins;
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + (i * binSize);
      const binEnd = min + ((i + 1) * binSize);
      
      if (value >= binStart && value <= binEnd) {
        return `bin_${i + 1}`;
      }
    }
    
    return `bin_${bins}`;
  }

  /**
   * Calcul des statistiques d'une colonne
   */
  private getColumnStats(data: any[], columnName: string): any {
    const values = data
      .map(record => record[columnName])
      .filter(val => this.isNumericValue(val))
      .map(val => this.parseNumeric(val)!);
    
    if (values.length === 0) {
      return { min: 0, max: 0, mean: 0, std: 1 };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return { min, max, mean, std };
  }

  /**
   * Statistiques de nettoyage
   */
  public getCleaningStatistics(originalData: any[], cleanedData: any[]): {
    totalRecords: number;
    cleanedRecords: number;
    dateColumnsProcessed: number;
    numericColumnsProcessed: number;
    categoricalColumnsProcessed: number;
    transformationStats: {
      datesConverted: number;
      numbersConverted: number;
      categoriesCleaned: number;
    };
  } {
    const originalColumns = Object.keys(originalData[0] || {});
    const cleanedColumns = Object.keys(cleanedData[0] || {});
    
    const dateColumns = cleanedColumns.filter(col => 
      col.includes('_year') || col.includes('_month') || col.includes('_quarter')
    ).map(col => col.replace(/_year|_month|_quarter|_dayofweek/, ''));
    
    const numericColumns = cleanedColumns.filter(col => 
      col.includes('_bin') && !col.includes('_year') && !col.includes('_month')
    ).map(col => col.replace('_bin', ''));
    
    const categoricalColumns = originalColumns.filter(col => 
      !dateColumns.includes(col) && !numericColumns.includes(col)
    );
    
    return {
      totalRecords: originalData.length,
      cleanedRecords: cleanedData.length,
      dateColumnsProcessed: dateColumns.length,
      numericColumnsProcessed: numericColumns.length,
      categoricalColumnsProcessed: categoricalColumns.length,
      transformationStats: {
        datesConverted: dateColumns.length * originalData.length,
        numbersConverted: numericColumns.length * originalData.length,
        categoriesCleaned: categoricalColumns.length * originalData.length
      }
    };
  }

  /**
   * Validation des données nettoyées
   */
  public validateCleanedData(cleanedData: any[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (cleanedData.length === 0) {
      errors.push('No data after cleaning');
      return { isValid: false, errors, warnings };
    }
    
    // Vérifier la cohérence des colonnes
    const firstRecord = cleanedData[0];
    const expectedColumns = Object.keys(firstRecord);
    
    cleanedData.forEach((record, index) => {
      const recordColumns = Object.keys(record);
      
      // Vérifier les colonnes manquantes
      expectedColumns.forEach(col => {
        if (!recordColumns.includes(col)) {
          errors.push(`Record ${index} missing column: ${col}`);
        }
      });
      
      // Vérifier les valeurs null/undefined
      recordColumns.forEach(col => {
        if (record[col] === null || record[col] === undefined) {
          warnings.push(`Record ${index} has null/undefined value in column: ${col}`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default DataCleaner; 