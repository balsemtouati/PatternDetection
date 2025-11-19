"""
Simplified MURAG (Multi-Agent Unified Retrieval-Augmented Generation) System
Focused on competitor intelligence without heavy dependencies
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
import requests
import glob
import google.generativeai as genai

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFCopilot:
    """
    Simplified version of PDFCopilot that focuses on basic competitor intelligence
    without the heavy ML dependencies
    """
    
    def __init__(self, data_pdfs_path: str = None):
        """Initialize the simplified PDFCopilot"""
        # Use Google Gemini API key instead of Together AI
        self.google_api_key = os.getenv('GOOGLE_API_KEY', '4b322a763a7299971019c96037f5570733d8a6752f23aede7578e1ec916497a3')
        self.documents = []
        self.knowledge_base = {}
        
        # Set default PDF directory path
        if data_pdfs_path is None:
            # Default to Data_pdfs/pdfs relative to backend directory
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            self.data_pdfs_path = os.path.join(backend_dir, '..', 'Data_pdfs', 'pdfs')
        else:
            self.data_pdfs_path = data_pdfs_path
        
        # Initialize Google Gemini
        if self.google_api_key:
            try:
                genai.configure(api_key=self.google_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("Google Gemini AI initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
                self.gemini_model = None
        else:
            logger.warning("GOOGLE_API_KEY not found. AI responses will be limited.")
            self.gemini_model = None
        
        # Automatically load PDFs from directory
        self.load_pdfs_from_directory()
    
    def load_pdfs_from_directory(self) -> int:
        """
        Load all PDFs from the specified directory
        Returns the number of PDFs loaded
        """
        loaded_count = 0
        
        if not os.path.exists(self.data_pdfs_path):
            logger.warning(f"PDF directory not found: {self.data_pdfs_path}")
            return 0
        
        # Find all PDF files in the directory
        pdf_pattern = os.path.join(self.data_pdfs_path, "*.pdf")
        pdf_files = glob.glob(pdf_pattern)
        
        logger.info(f"Found {len(pdf_files)} PDF files in {self.data_pdfs_path}")
        
        for pdf_file in pdf_files:
            if self.add_pdf(pdf_file):
                loaded_count += 1
        
        logger.info(f"Successfully loaded {loaded_count} competitor PDFs")
        return loaded_count
    
    def add_pdf(self, file_path: str) -> bool:
        """
        Add a PDF to the knowledge base
        For now, this extracts basic metadata and creates document entries
        """
        try:
            if not os.path.exists(file_path):
                logger.error(f"PDF file not found: {file_path}")
                return False
            
            filename = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            
            # Extract company name from filename (basic heuristic)
            company_name = self._extract_company_name(filename)
            
            # Create document entry
            doc_entry = {
                'filename': filename,
                'path': file_path,
                'company': company_name,
                'file_size': file_size,
                'type': 'competitor_report'
            }
            
            self.documents.append(doc_entry)
            
            # Add to knowledge base by company
            if company_name not in self.knowledge_base:
                self.knowledge_base[company_name] = []
            self.knowledge_base[company_name].append(doc_entry)
            
            logger.info(f"Added PDF: {filename} for company: {company_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding PDF {file_path}: {e}")
            return False
    
    def _extract_company_name(self, filename: str) -> str:
        """Extract company name from filename using basic heuristics"""
        # Remove file extension
        name = os.path.splitext(filename)[0]
        
        # Common patterns for company names
        company_patterns = [
            'accenture', 'capgemini', 'devoteam', 'ey-japan', 'fis', 
            'groupe-one-point', 'inetum', 'talan', 'wavestone'
        ]
        
        # Check if any company pattern matches
        for pattern in company_patterns:
            if pattern.lower() in name.lower():
                return pattern.title()
        
        # If no pattern matches, return first part of filename
        return name.split('_')[0].title()
    
    def get_status(self) -> Dict[str, Any]:
        """Get the current status of the PDFCopilot"""
        return {
            'ai_enabled': self.gemini_model is not None,
            'total_documents': len(self.documents),
            'companies_loaded': list(self.knowledge_base.keys()),
            'pdf_directory': self.data_pdfs_path,
            'api_key_configured': bool(self.google_api_key)
        }
    
    def chat(self, message: str) -> str:
        """Chat with the competitor intelligence system"""
        if not self.gemini_model:
            return "AI service not available. Please check your Google API key configuration."
        
        try:
            # Prepare context about available companies
            companies_info = []
            for company, docs in self.knowledge_base.items():
                companies_info.append(f"{company}: {len(docs)} documents")
            
            context = f"""You are a competitor intelligence expert. You have access to information about the following companies:
            {', '.join(companies_info)}
            
            Available companies: {', '.join(self.knowledge_base.keys())}
            
            Please provide insights about these companies based on the user's question. If you need specific information from the PDFs, let the user know what's available.
            """
            
            # Generate response using Gemini
            response = self.gemini_model.generate_content([
                context,
                message
            ])
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return f"Sorry, I encountered an error: {str(e)}"
    
    def search_companies(self, query: str) -> List[Dict[str, Any]]:
        """Search for companies based on query"""
        results = []
        query_lower = query.lower()
        
        for company, docs in self.knowledge_base.items():
            if query_lower in company.lower():
                results.append({
                    'company': company,
                    'documents': docs,
                    'total_docs': len(docs)
                })
        
        return results
    
    def get_company_info(self, company_name: str) -> Dict[str, Any]:
        """Get detailed information about a specific company"""
        if company_name not in self.knowledge_base:
            return {'error': f'Company {company_name} not found'}
        
        docs = self.knowledge_base[company_name]
        return {
            'company': company_name,
            'total_documents': len(docs),
            'documents': docs,
            'file_types': list(set(doc.get('type', 'unknown') for doc in docs))
        }

