"""
Data Processing Module for Pattern Analysis Backend
"""
import pandas as pd
import numpy as np
import os
from werkzeug.utils import secure_filename
from datetime import datetime
import logging
from config import ALLOWED_EXTENSIONS, DATA_TYPE_MAPPING, COLUMN_MAPPINGS

logger = logging.getLogger(__name__)

class DataProcessor:
    """Handles data processing, validation, and preprocessing"""
    
    def __init__(self, upload_folder='uploads'):
        self.upload_folder = upload_folder
        os.makedirs(upload_folder, exist_ok=True)
    
    def allowed_file(self, filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    def detect_data_type(self, filename):
        """Detect data type based on filename"""
        lower_name = filename.lower()
        
        for data_type, keywords in DATA_TYPE_MAPPING.items():
            if any(keyword in lower_name for keyword in keywords):
                return data_type
        
        return 'projects'  # Default fallback
    
    def read_file(self, filepath):
        """Read file based on its extension"""
        try:
            if filepath.endswith('.csv'):
                return pd.read_csv(filepath)
            elif filepath.endswith('.json'):
                return pd.read_json(filepath)
            elif filepath.endswith('.xlsx'):
                return pd.read_excel(filepath)
            else:
                raise ValueError(f"Unsupported file format: {filepath}")
        except Exception as e:
            logger.error(f"Error reading file {filepath}: {e}")
            raise
    
    def validate_data(self, df, data_type):
        """Validate data quality and structure"""
        validation_results = {
            'is_valid': True,
            'issues': [],
            'warnings': [],
            'record_count': len(df),
            'column_count': len(df.columns)
        }
        
        # Check for empty dataframe
        if df.empty:
            validation_results['is_valid'] = False
            validation_results['issues'].append("DataFrame is empty")
            return validation_results
        
        # Check for required columns based on data type
        if data_type in COLUMN_MAPPINGS:
            required_cols = COLUMN_MAPPINGS[data_type]['key_cols'] + COLUMN_MAPPINGS[data_type]['value_cols']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                validation_results['warnings'].append(f"Missing expected columns: {missing_cols}")
        
        # Check for null values
        null_counts = df.isnull().sum()
        high_null_cols = null_counts[null_counts > len(df) * 0.5].index.tolist()
        
        if high_null_cols:
            validation_results['warnings'].append(f"High null values in columns: {high_null_cols}")
        
        # Check for duplicate rows
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            validation_results['warnings'].append(f"Found {duplicate_count} duplicate rows")
        
        return validation_results
    
    def preprocess_data(self, df, data_type):
        """Preprocess data for analysis"""
        processed_df = df.copy()
        
        # Handle missing values
        processed_df = self._handle_missing_values(processed_df, data_type)
        
        # Convert data types
        processed_df = self._convert_data_types(processed_df, data_type)
        
        # Add derived columns
        processed_df = self._add_derived_columns(processed_df, data_type)
        
        # Clean text columns
        processed_df = self._clean_text_columns(processed_df)
        
        return processed_df
    
    def _handle_missing_values(self, df, data_type):
        """Handle missing values based on data type"""
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                if df[col].dtype in ['int64', 'float64']:
                    # Fill numerical columns with median
                    df[col] = df[col].fillna(df[col].median())
                else:
                    # Fill categorical columns with mode
                    mode_value = df[col].mode()
                    if not mode_value.empty:
                        df[col] = df[col].fillna(mode_value.iloc[0])
                    else:
                        df[col] = df[col].fillna('Unknown')
        return df
    
    def _convert_data_types(self, df, data_type):
        """Convert data types based on data type"""
        # Convert date columns
        date_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['date', 'time', 'created', 'updated'])]
        
        for col in date_columns:
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
            except:
                pass
        
        # Convert numerical columns
        numerical_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['value', 'amount', 'cost', 'price', 'rate', 'score'])]
        
        for col in numerical_columns:
            try:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            except:
                pass
        
        return df
    
    def _add_derived_columns(self, df, data_type):
        """Add derived columns for analysis"""
        # Add month and quarter columns for date columns
        date_columns = df.select_dtypes(include=['datetime64']).columns
        
        for col in date_columns:
            df[f'{col}_month'] = df[col].dt.month
            df[f'{col}_quarter'] = df[col].dt.quarter
            df[f'{col}_year'] = df[col].dt.year
        
        # Add profit margin for financial data
        if data_type == 'financial' and 'revenue' in df.columns and 'costs' in df.columns:
            df['profit_margin'] = (df['revenue'] - df['costs']) / df['revenue']
        
        # Add win rate for CRM data
        if data_type == 'crm' and 'status' in df.columns:
            df['win_rate'] = (df['status'] == 'won').astype(int)
        
        return df
    
    def _clean_text_columns(self, df):
        """Clean text columns"""
        text_columns = df.select_dtypes(include=['object']).columns
        
        for col in text_columns:
            # Remove extra whitespace
            df[col] = df[col].astype(str).str.strip()
            
            # Convert to title case for consistency
            df[col] = df[col].str.title()
        
        return df
    
    def process_uploaded_file(self, file, filename):
        """Process an uploaded file"""
        try:
            # Save file
            filepath = os.path.join(self.upload_folder, secure_filename(filename))
            file.save(filepath)
            
            # Read file
            df = self.read_file(filepath)
            
            # Detect data type
            data_type = self.detect_data_type(filename)
            
            # Validate data
            validation = self.validate_data(df, data_type)
            
            # Preprocess data
            processed_df = self.preprocess_data(df, data_type)
            
            return {
                'name': filename,
                'type': data_type,
                'data': processed_df.to_dict('records'),
                'size': len(processed_df),
                'path': filepath,
                'validation': validation,
                'columns': list(processed_df.columns)
            }
            
        except Exception as e:
            logger.error(f"Error processing file {filename}: {e}")
            raise
    
    def get_column_mapping(self, data_type):
        """Get column mapping for a specific data type"""
        return COLUMN_MAPPINGS.get(data_type, {
            'key_cols': [],
            'value_cols': []
        }) 