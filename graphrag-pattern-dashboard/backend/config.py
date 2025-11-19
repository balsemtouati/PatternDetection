"""
Configuration module for the Pattern Analysis Backend
"""
import os

# Flask Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'json', 'xlsx'}
DEBUG = True
HOST = '0.0.0.0'
PORT = 5000

# Pattern Mining Configuration
DEFAULT_MIN_SUPPORT = 0.1
DEFAULT_MIN_CONFIDENCE = 0.6
DEFAULT_MAX_PATTERNS = 8

# Data Processing Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
CHUNK_SIZE = 8192

# Pattern Analysis Configuration
PATTERN_TYPES = {
    'certification_paradox': {
        'complexity': 'Very High',
        'keywords': ['certification', 'team', 'experience']
    },
    'temporal_trap': {
        'complexity': 'High',
        'keywords': ['date', 'month', 'quarter', 'time']
    },
    'amplification_effect': {
        'complexity': 'Very High',
        'keywords': ['industry', 'sector', 'domain']
    },
    'hierarchy_pattern': {
        'complexity': 'High',
        'keywords': ['channel', 'source', 'method']
    },
    'optimization_opportunity': {
        'complexity': 'Medium',
        'keywords': []
    }
}

# Data Type Detection
DATA_TYPE_MAPPING = {
    'crm': ['crm', 'sales', 'deals', 'leads', 'opportunities'],
    'erp': ['erp', 'project', 'tasks', 'workflow'],
    'financial': ['financial', 'finance', 'revenue', 'cost', 'profit'],
    'hr': ['hr', 'employee', 'personnel', 'staff'],
    'tenders': ['tender', 'bid', 'proposal', 'rfp'],
    'projects': ['project', 'assignment', 'delivery']
}

# Column Mappings for Different Data Types
COLUMN_MAPPINGS = {
    'crm': {
        'key_cols': ['sector', 'team_size', 'submission_date', 'client_type'],
        'value_cols': ['deal_value', 'status', 'win_rate', 'sales_stage']
    },
    'financial': {
        'key_cols': ['month', 'quarter', 'year', 'department'],
        'value_cols': ['revenue', 'costs', 'profit_margin', 'budget']
    },
    'erp': {
        'key_cols': ['project_type', 'team_composition', 'client_sector'],
        'value_cols': ['completion_rate', 'budget', 'actual_cost', 'timeline']
    },
    'hr': {
        'key_cols': ['experience_level', 'certification', 'department'],
        'value_cols': ['performance_score', 'billable_hours', 'satisfaction']
    },
    'tenders': {
        'key_cols': ['submission_date', 'sector', 'budget_range'],
        'value_cols': ['win_rate', 'competition_level', 'success_rate']
    },
    'projects': {
        'key_cols': ['project_type', 'team_size', 'duration'],
        'value_cols': ['success_rate', 'client_satisfaction', 'profit_margin']
    }
}

# Scoring Weights
SCORING_WEIGHTS = {
    'confidence': 0.4,
    'lift': 0.3,
    'impact': 0.3
}

# Complexity Scores
COMPLEXITY_SCORES = {
    'Low': 0.3,
    'Medium': 0.6,
    'High': 0.8,
    'Very High': 0.9
} 