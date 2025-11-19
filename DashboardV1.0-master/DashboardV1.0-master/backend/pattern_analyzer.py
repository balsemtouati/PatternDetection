"""
Pattern Analyzer Module - Orchestrates pattern mining and analysis
"""
import pandas as pd
import numpy as np
from datetime import datetime
import logging
from pattern_miner import GPGrowthPatternMiner, PatternRefiner
from data_processor import DataProcessor
from config import DEFAULT_MIN_SUPPORT, DEFAULT_MIN_CONFIDENCE, DEFAULT_MAX_PATTERNS, COLUMN_MAPPINGS

# Try to import advanced analyzer
try:
    from advanced_pattern_analyzer import AdvancedPatternAnalyzer
    ADVANCED_ANALYZER_AVAILABLE = True
except ImportError:
    ADVANCED_ANALYZER_AVAILABLE = False

logger = logging.getLogger(__name__)

class PatternAnalyzer:
    """Main pattern analysis orchestrator"""
    
    def __init__(self, config=None):
        self.config = config or {}
        self.miner = GPGrowthPatternMiner(
            min_support=self.config.get('minSupport', DEFAULT_MIN_SUPPORT),
            min_confidence=self.config.get('minConfidence', DEFAULT_MIN_CONFIDENCE)
        )
        self.refiner = PatternRefiner()
        self.data_processor = DataProcessor()
        
        # Initialize advanced analyzer if available
        if ADVANCED_ANALYZER_AVAILABLE:
            # Use the user's Gemini API key for advanced analysis
            gemini_api_key = "AIzaSyB-qjZtan_tQ899yRMqc-QxRFAHYmLtw_I"
            self.advanced_analyzer = AdvancedPatternAnalyzer(gemini_api_key=gemini_api_key)
            logger.info("✓ Advanced pattern analyzer initialized with Gemini AI")
        else:
            self.advanced_analyzer = None
            logger.info("⚠️ Advanced pattern analyzer not available - using standard analysis")
    
    def analyze_patterns(self, data_sources, config=None):
        """Main pattern analysis function"""
        if config is None:
            config = self.config
        
        # Use advanced analyzer if available and data sources are sufficient
        if self.advanced_analyzer and self._should_use_advanced_analysis(data_sources):
            logger.info("🔍 Using advanced pattern detection...")
            return self.advanced_analyzer.analyze_patterns(data_sources, config)
        
        # Fall back to standard analysis
        logger.info("🔍 Using standard pattern detection...")
        return self._standard_analysis(data_sources, config)
    
    def _should_use_advanced_analysis(self, data_sources):
        """Determine if advanced analysis should be used"""
        if not data_sources:
            return False
        
        # Check if we have enough data sources for advanced analysis
        data_types = [source.get('type', '') for source in data_sources]
        required_types = ['projects', 'hr', 'assignments']
        
        # Count how many required types we have
        available_types = sum(1 for req_type in required_types if req_type in data_types)
        
        # Use advanced analysis if we have at least 2 required data types
        return available_types >= 2
    
    def _standard_analysis(self, data_sources, config):
        """Standard pattern analysis using GPGrowth"""
        all_patterns = []
        analysis_metadata = {
            'total_records': 0,
            'data_sources': len(data_sources),
            'patterns_detected': 0,
            'processing_time': 0,
            'timestamp': datetime.now().isoformat()
        }
        
        start_time = datetime.now()
        
        try:
            for source in data_sources:
                df = pd.DataFrame(source['data'])
                data_type = source['type']
                
                if len(df) < 10:  # Skip small datasets
                    logger.warning(f"Skipping {data_type} dataset with only {len(df)} records")
                    continue
                
                # Get column mappings for this data type
                column_mapping = self.data_processor.get_column_mapping(data_type)
                key_cols = column_mapping.get('key_cols', [])
                value_cols = column_mapping.get('value_cols', [])
                
                # Filter columns that actually exist in the dataframe
                key_cols = [col for col in key_cols if col in df.columns]
                value_cols = [col for col in value_cols if col in df.columns]
                
                # If no specific columns found, use first few columns
                if not key_cols and not value_cols:
                    all_cols = list(df.columns)
                    key_cols = all_cols[:min(3, len(all_cols)//2)]
                    value_cols = all_cols[min(3, len(all_cols)//2):min(6, len(all_cols))]
                
                # Preprocess data for pattern mining
                processed_df = self.miner.preprocess_data(df)
                
                # Extract transactions
                transactions = self.miner.extract_transactions(processed_df, key_cols, value_cols)
                
                if len(transactions) < 5:  # Skip if too few transactions
                    logger.warning(f"Skipping {data_type} dataset with only {len(transactions)} transactions")
                    continue
                
                # Mine patterns
                raw_patterns = self.miner.mine_patterns(
                    transactions, 
                    max_patterns=config.get('maxPatterns', DEFAULT_MAX_PATTERNS)
                )
                
                # Refine patterns
                for raw_pattern in raw_patterns:
                    refined_pattern = self.refiner.refine_pattern(raw_pattern, {
                        'data_type': data_type,
                        'record_count': len(df),
                        'columns': list(df.columns),
                        'key_cols': key_cols,
                        'value_cols': value_cols
                    })
                    all_patterns.append(refined_pattern)
                
                analysis_metadata['total_records'] += len(df)
            
            # Sort by overall score and limit
            all_patterns.sort(key=lambda x: x['scores']['overallScore'], reverse=True)
            max_patterns = config.get('maxPatterns', DEFAULT_MAX_PATTERNS)
            all_patterns = all_patterns[:max_patterns]
            
            analysis_metadata['patterns_detected'] = len(all_patterns)
            analysis_metadata['processing_time'] = (datetime.now() - start_time).total_seconds()
            
            # Calculate statistics
            statistics = self._calculate_statistics(all_patterns)
            
            return {
                'patterns': all_patterns,
                'analysisMetadata': analysis_metadata,
                'statistics': statistics
            }
            
        except Exception as e:
            logger.error(f"Error in standard pattern analysis: {e}")
            raise
    
    def _calculate_statistics(self, patterns):
        """Calculate analysis statistics"""
        if not patterns:
            return {
                'scoring': {
                    'totalPatterns': 0,
                    'averageScores': {
                        'support': 0, 'confidence': 0, 'lift': 0, 
                        'conviction': 0, 'impact': 0, 'overall': 0
                    },
                    'scoreDistribution': {
                        'excellent': 0, 'good': 0, 'fair': 0, 'poor': 0
                    },
                    'complexityDistribution': {
                        'low': 0, 'medium': 0, 'high': 0, 'veryHigh': 0
                    }
                },
                'validation': {
                    'valid': 0,
                    'invalid': 0
                }
            }
        
        # Score distribution
        score_distribution = {
            'excellent': len([p for p in patterns if p['scores']['overallScore'] >= 0.8]),
            'good': len([p for p in patterns if 0.6 <= p['scores']['overallScore'] < 0.8]),
            'fair': len([p for p in patterns if 0.4 <= p['scores']['overallScore'] < 0.6]),
            'poor': len([p for p in patterns if p['scores']['overallScore'] < 0.4])
        }
        
        # Complexity distribution
        complexity_distribution = {
            'low': len([p for p in patterns if p['complexity'] == 'Low']),
            'medium': len([p for p in patterns if p['complexity'] == 'Medium']),
            'high': len([p for p in patterns if p['complexity'] == 'High']),
            'veryHigh': len([p for p in patterns if p['complexity'] == 'Very High'])
        }
        
        # Average scores
        avg_scores = {
            'support': np.mean([p['scores']['support'] for p in patterns]),
            'confidence': np.mean([p['scores']['confidence'] for p in patterns]),
            'lift': np.mean([p['scores']['lift'] for p in patterns]),
            'conviction': np.mean([p['scores']['conviction'] for p in patterns]),
            'impact': np.mean([p['scores']['impact'] for p in patterns]),
            'overall': np.mean([p['scores']['overallScore'] for p in patterns])
        }
        
        return {
            'scoring': {
                'totalPatterns': len(patterns),
                'averageScores': avg_scores,
                'scoreDistribution': score_distribution,
                'complexityDistribution': complexity_distribution
            },
            'validation': {
                'valid': len(patterns),
                'invalid': 0
            }
        }
    
    def analyze_single_dataset(self, df, data_type, config=None):
        """Analyze patterns in a single dataset"""
        if config is None:
            config = self.config
        
        # Get column mappings
        column_mapping = self.data_processor.get_column_mapping(data_type)
        key_cols = column_mapping.get('key_cols', [])
        value_cols = column_mapping.get('value_cols', [])
        
        # Filter existing columns
        key_cols = [col for col in key_cols if col in df.columns]
        value_cols = [col for col in value_cols if col in df.columns]
        
        # Preprocess data
        processed_df = self.miner.preprocess_data(df)
        
        # Extract transactions
        transactions = self.miner.extract_transactions(processed_df, key_cols, value_cols)
        
        if len(transactions) < 5:
            return []
        
        # Mine patterns
        raw_patterns = self.miner.mine_patterns(transactions, max_patterns=5)
        
        # Refine patterns
        refined_patterns = []
        for raw_pattern in raw_patterns:
            refined_pattern = self.refiner.refine_pattern(raw_pattern, {
                'data_type': data_type,
                'record_count': len(df),
                'columns': list(df.columns)
            })
            refined_patterns.append(refined_pattern)
        
        return refined_patterns
    
    def get_analysis_summary(self, patterns):
        """Get a summary of the analysis results"""
        if not patterns:
            return {
                'total_patterns': 0,
                'average_confidence': 0,
                'average_impact': 0,
                'top_pattern_type': None,
                'complexity_distribution': {}
            }
        
        # Calculate averages
        avg_confidence = np.mean([p['scores']['confidence'] for p in patterns])
        avg_impact = np.mean([p['scores']['impact'] for p in patterns])
        
        # Get pattern type distribution
        pattern_types = [p.get('pattern_type', 'unknown') for p in patterns]
        type_counts = {}
        for p_type in pattern_types:
            type_counts[p_type] = type_counts.get(p_type, 0) + 1
        
        top_pattern_type = max(type_counts.items(), key=lambda x: x[1])[0] if type_counts else None
        
        # Complexity distribution
        complexity_distribution = {}
        for pattern in patterns:
            complexity = pattern['complexity']
            complexity_distribution[complexity] = complexity_distribution.get(complexity, 0) + 1
        
        return {
            'total_patterns': len(patterns),
            'average_confidence': avg_confidence,
            'average_impact': avg_impact,
            'top_pattern_type': top_pattern_type,
            'complexity_distribution': complexity_distribution
        } 