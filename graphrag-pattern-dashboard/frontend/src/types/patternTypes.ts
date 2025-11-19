/**
 * Types pour l'analyse de patterns
 */

export interface PatternAnalysisResult {
  patterns: ScoredPattern[];
  analysisMetadata: {
    totalRecords: number;
    dataSources: number;
    patternsDetected: number;
    confidence: number;
    timestamp: string;
    processingTime: number;
  };
  statistics: {
    scoring: ScoringStatistics;
    validation: {
      valid: number;
      invalid: number;
    };
  };
}

export interface ScoredPattern {
  id: string;
  title: string;
  description: string;
  impact: number;
  confidence: number;
  complexity: 'Low' | 'Medium' | 'High' | 'Very High';
  variables: string[];
  businessValue: string[];
  implementation: string[];
  metrics: string[];
  scores: PatternScore;
}

export interface PatternScore {
  patternId: string;
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  impact: number;
  complexity: number;
  overallScore: number;
}

export interface ScoringStatistics {
  totalPatterns: number;
  averageScores: {
    support: number;
    confidence: number;
    lift: number;
    conviction: number;
    impact: number;
    overall: number;
  };
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  complexityDistribution: {
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
}

export interface PatternAnalysisConfig {
  maxPatterns: number;
  minConfidence: number;
  minSupport: number;
  complexityLevel: 'medium' | 'high' | 'expert';
  focusAreas: string[];
}

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

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
}

export interface PatternRule {
  id: string;
  title: string;
  description: string;
  impact: number;
  confidence: number;
  complexity: 'Low' | 'Medium' | 'High' | 'Very High';
  variables: string[];
  businessValue: string[];
  implementation: string[];
  metrics: string[];
}

export interface TemporalPattern {
  id: string;
  title: string;
  description: string;
  pattern: 'seasonal' | 'trend' | 'cyclic' | 'anomaly';
  confidence: number;
  impact: number;
  timeRange: {
    start: string;
    end: string;
    frequency: string;
  };
  variables: string[];
}

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

// Types pour les patterns spécifiques aux ventes
export interface SalesPattern extends ScoredPattern {
  patternType: 'certification_paradox' | 'quarter_end_trap' | 'industry_experience' | 'communication_hierarchy' | 'geographic_inefficiency';
  salesMetrics: {
    winRate?: number;
    profitMargin?: number;
    dealSize?: number;
    salesCycle?: number;
  };
}

// Types pour les patterns temporels
export interface TemporalAnalysisResult {
  seasonalPatterns: TemporalPattern[];
  trendPatterns: TemporalPattern[];
  cyclicPatterns: TemporalPattern[];
  anomalies: TemporalPattern[];
}

// Types pour les métriques de performance
export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

// Types pour les rapports d'analyse
export interface AnalysisReport {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  technicalDetails: {
    analysisMetadata: any;
    statistics: any;
    patternBreakdown: any;
  };
}

// Types pour l'export/import
export interface PatternExportData {
  patterns: ScoredPattern[];
  exportMetadata: {
    exportedAt: string;
    totalPatterns: number;
    version: string;
  };
}

// Types pour la validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Types pour les configurations avancées
export interface AdvancedConfig {
  algorithm: 'apriori' | 'fp-growth' | 'eclat';
  minSupport: number;
  minConfidence: number;
  maxLength: number;
  enableLift: boolean;
  enableConviction: boolean;
}

// Types pour les résultats d'analyse incrémentale
export interface IncrementalAnalysisResult {
  updatedPatterns: ScoredPattern[];
  newPatterns: ScoredPattern[];
  removedPatterns: ScoredPattern[];
  changeSummary: {
    totalChanges: number;
    significantChanges: number;
    newInsights: number;
  };
}

export default {
  PatternAnalysisResult,
  ScoredPattern,
  PatternScore,
  ScoringStatistics,
  PatternAnalysisConfig,
  DataSource,
  MergedRecord,
  AssociationRule,
  PatternRule,
  TemporalPattern,
  CleaningConfig,
  CleanedRecord,
  ColumnType,
  SalesPattern,
  TemporalAnalysisResult,
  PerformanceMetrics,
  AnalysisReport,
  PatternExportData,
  ValidationResult,
  AdvancedConfig,
  IncrementalAnalysisResult
}; 