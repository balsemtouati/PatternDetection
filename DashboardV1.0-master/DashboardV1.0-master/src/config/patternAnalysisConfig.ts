import { PatternAnalysisConfig } from '../services/api/PatternAnalysisAPI';

/**
 * Configuration par défaut pour l'analyse de patterns
 */
export const DEFAULT_PATTERN_CONFIG: PatternAnalysisConfig = {
  maxPatterns: 8,
  minConfidence: 0.6,
  minSupport: 0.1,
  complexityLevel: 'high',
  focusAreas: ['profitability', 'efficiency', 'risk', 'quality']
};

/**
 * Configurations prédéfinies pour différents types d'analyse
 */
export const PATTERN_CONFIGS = {
  // Configuration pour analyse rapide
  quick: {
    maxPatterns: 4,
    minConfidence: 0.7,
    minSupport: 0.15,
    complexityLevel: 'medium' as const,
    focusAreas: ['profitability', 'efficiency']
  },

  // Configuration pour analyse complète
  comprehensive: {
    maxPatterns: 12,
    minConfidence: 0.5,
    minSupport: 0.05,
    complexityLevel: 'expert' as const,
    focusAreas: ['profitability', 'efficiency', 'risk', 'quality', 'innovation', 'growth']
  },

  // Configuration pour analyse de performance
  performance: {
    maxPatterns: 6,
    minConfidence: 0.8,
    minSupport: 0.2,
    complexityLevel: 'high' as const,
    focusAreas: ['efficiency', 'quality']
  },

  // Configuration pour analyse de risque
  risk: {
    maxPatterns: 8,
    minConfidence: 0.6,
    minSupport: 0.1,
    complexityLevel: 'high' as const,
    focusAreas: ['risk', 'quality', 'efficiency']
  }
};

/**
 * Types de données supportés
 */
export const SUPPORTED_DATA_TYPES = {
  crm: {
    name: 'CRM Data',
    description: 'Customer Relationship Management data',
    fields: ['client_name', 'deal_value', 'status', 'submission_date', 'team_size', 'sector']
  },
  erp: {
    name: 'ERP Data',
    description: 'Enterprise Resource Planning data',
    fields: ['project_id', 'budget', 'actual_cost', 'completion_rate', 'start_date', 'end_date']
  },
  financial: {
    name: 'Financial Data',
    description: 'Financial performance data',
    fields: ['revenue', 'costs', 'profit', 'month', 'year', 'department']
  },
  hr: {
    name: 'HR Data',
    description: 'Human Resources data',
    fields: ['employee_id', 'performance_score', 'department', 'hire_date', 'salary']
  },
  projects: {
    name: 'Project Data',
    description: 'Project management data',
    fields: ['project_id', 'status', 'start_date', 'end_date', 'team_size', 'budget']
  },
  tenders: {
    name: 'Tender Data',
    description: 'Tender and bid data',
    fields: ['tender_id', 'submission_date', 'value', 'status', 'sector', 'location']
  }
};

/**
 * Seuils de configuration
 */
export const CONFIG_THRESHOLDS = {
  minConfidence: {
    min: 0.3,
    max: 0.95,
    step: 0.05,
    default: 0.6
  },
  minSupport: {
    min: 0.01,
    max: 0.5,
    step: 0.01,
    default: 0.1
  },
  maxPatterns: {
    min: 2,
    max: 20,
    step: 1,
    default: 8
  }
};

/**
 * Niveaux de complexité et leurs descriptions
 */
export const COMPLEXITY_LEVELS = {
  low: {
    name: 'Low Complexity',
    description: 'Simple patterns, easy to implement',
    maxVariables: 3,
    maxDepth: 2
  },
  medium: {
    name: 'Medium Complexity',
    description: 'Moderate complexity, requires some resources',
    maxVariables: 5,
    maxDepth: 3
  },
  high: {
    name: 'High Complexity',
    description: 'Complex patterns, requires significant resources',
    maxVariables: 8,
    maxDepth: 4
  },
  expert: {
    name: 'Expert Level',
    description: 'Very complex patterns, requires expertise',
    maxVariables: 12,
    maxDepth: 5
  }
};

/**
 * Zones de focus et leurs descriptions
 */
export const FOCUS_AREAS = {
  profitability: {
    name: 'Profitability',
    description: 'Focus on profit margins and revenue optimization',
    color: '#10B981'
  },
  efficiency: {
    name: 'Efficiency',
    description: 'Focus on operational efficiency and productivity',
    color: '#3B82F6'
  },
  risk: {
    name: 'Risk Management',
    description: 'Focus on risk identification and mitigation',
    color: '#EF4444'
  },
  quality: {
    name: 'Quality',
    description: 'Focus on quality improvement and standards',
    color: '#8B5CF6'
  },
  innovation: {
    name: 'Innovation',
    description: 'Focus on innovation and new opportunities',
    color: '#F59E0B'
  },
  growth: {
    name: 'Growth',
    description: 'Focus on business growth and expansion',
    color: '#06B6D4'
  }
};

/**
 * Configuration des patterns spécifiques
 */
export const PATTERN_SPECIFIC_CONFIG = {
  certification_paradox: {
    minDataPoints: 100,
    requiredFields: ['certification_density', 'team_composition', 'profit_margin'],
    confidenceThreshold: 0.7
  },
  quarter_end_trap: {
    minDataPoints: 50,
    requiredFields: ['submission_date', 'status', 'deal_value'],
    confidenceThreshold: 0.6
  },
  industry_experience: {
    minDataPoints: 80,
    requiredFields: ['sector', 'team_experience', 'project_success'],
    confidenceThreshold: 0.75
  },
  communication_hierarchy: {
    minDataPoints: 60,
    requiredFields: ['acquisition_channel', 'team_seniority', 'client_satisfaction'],
    confidenceThreshold: 0.65
  },
  geographic_inefficiency: {
    minDataPoints: 40,
    requiredFields: ['location', 'costs', 'profit_margin'],
    confidenceThreshold: 0.6
  }
};

/**
 * Configuration des métriques de scoring
 */
export const SCORING_WEIGHTS = {
  support: 0.15,
  confidence: 0.25,
  lift: 0.20,
  conviction: 0.10,
  impact: 0.25,
  complexity: 0.05
};

/**
 * Configuration des seuils de validation
 */
export const VALIDATION_THRESHOLDS = {
  minConfidence: 0.1,
  minSupport: 0.05,
  minOverallScore: 0.3,
  maxLiftForHighConfidence: 1.0
};

export default {
  DEFAULT_PATTERN_CONFIG,
  PATTERN_CONFIGS,
  SUPPORTED_DATA_TYPES,
  CONFIG_THRESHOLDS,
  COMPLEXITY_LEVELS,
  FOCUS_AREAS,
  PATTERN_SPECIFIC_CONFIG,
  SCORING_WEIGHTS,
  VALIDATION_THRESHOLDS
}; 