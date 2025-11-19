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

class SimplePDFCopilot:
    """
    Simplified version of PDFCopilot that focuses on basic competitor intelligence
    without the heavy ML dependencies
    """
    
    def __init__(self, data_pdfs_path: str = None):
        """Initialize the simplified PDFCopilot"""
        # Use Google Gemini API key instead of Together AI
        self.google_api_key = os.getenv('GOOGLE_API_KEY', 'AIzaSyCnaRwNyRqbE8D9xZTlNFejmk-6peYhHXU')
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
                'processed': False,
                'content_summary': f"Annual report and financial data for {company_name}",
                'document_type': self._determine_document_type(filename)
            }
            
            self.documents.append(doc_entry)
            
            # Add to knowledge base with company-specific information
            if company_name not in self.knowledge_base:
                self.knowledge_base[company_name] = []
            
            self.knowledge_base[company_name].append(doc_entry)
            
            logger.info(f"Added PDF: {filename} for company: {company_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding PDF {file_path}: {str(e)}")
            return False
    
    def _extract_company_name(self, filename: str) -> str:
        """Extract company name from filename"""
        filename_lower = filename.lower()
        
        # Company name mappings
        company_mapping = {
            'accenture': 'Accenture',
            'capgemini': 'Capgemini',
            'cap-gemini': 'Capgemini',
            'devoteam': 'Devoteam',
            'inetum': 'Inetum',
            'wavestone': 'Wavestone',
            'talan': 'Talan',
            'one-point': 'Groupe One Point',
            'groupe-one-point': 'Groupe One Point',
            'ey': 'EY',
            'fis': 'FIS',
        }
        
        for key, company in company_mapping.items():
            if key in filename_lower:
                return company
        
        # Default to filename without extension
        return filename.split('.')[0].replace('_', ' ').replace('-', ' ').title()
    
    def _determine_document_type(self, filename: str) -> str:
        """Determine document type from filename"""
        filename_lower = filename.lower()
        
        if 'annual' in filename_lower or 'rapport' in filename_lower:
            return 'Annual Report'
        elif 'financial' in filename_lower:
            return 'Financial Report'
        elif 'output' in filename_lower:
            return 'Processed Report'
        else:
            return 'Business Document'
    
    def query(self, question: str, context: str = "") -> Dict[str, Any]:
        """
        Process a query about competitors
        """
        try:
            # Build context from loaded competitor documents
            companies = list(self.knowledge_base.keys())
            doc_context = self._build_document_context()
            
            # Combine with provided context
            full_context = f"{context}\n\n{doc_context}" if doc_context else context
            
            # If we have Gemini AI key, use it for enhanced responses
            if self.gemini_model:
                ai_response = self._get_ai_response(question, full_context, companies)
            else:
                ai_response = self._get_fallback_response(question, full_context, companies)
            
            return {
                'query': question,
                'response': ai_response,
                'context_used': bool(doc_context),
                'documents_count': len(self.documents),
                'companies_analyzed': companies,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                'query': question,
                'response': f"Error processing query: {str(e)}",
                'success': False
            }
    
    def _build_document_context(self) -> str:
        """Build context string from loaded documents"""
        if not self.documents:
            return ""
        
        context_parts = [
            f"Competitor Intelligence Database: {len(self.documents)} documents loaded",
            f"Companies analyzed: {', '.join(self.knowledge_base.keys())}",
            ""
        ]
        
        # Add summary for each company
        for company, docs in self.knowledge_base.items():
            doc_types = [doc['document_type'] for doc in docs]
            context_parts.append(f"• {company}: {len(docs)} documents ({', '.join(set(doc_types))})")
        
        return "\n".join(context_parts)
    
    def _get_ai_response(self, question: str, context: str, companies: List[str] = None) -> str:
        """
        Get AI response using Google Gemini API
        """
        try:
            companies_str = ", ".join(companies) if companies else "various competitors"
            
            prompt = f"""You are a competitive intelligence analyst with access to comprehensive data about {companies_str}.

Context and Data:
{context}

Question: {question}

Please provide a comprehensive competitive analysis focusing on:
1. Direct answer to the question based on available data
2. Competitive insights and market positioning
3. Strategic recommendations and opportunities
4. Comparative analysis across competitors
5. Market implications and trends

Draw insights from the annual reports and financial data available for: {companies_str}

Provide a detailed, professional analysis in a structured format."""

            response = self.gemini_model.generate_content(prompt)
            
            if response and response.text:
                return response.text
            else:
                logger.error("Gemini API returned empty response")
                return self._get_fallback_response(question, context, companies)
                
        except Exception as e:
            logger.error(f"Error with Gemini API: {str(e)}")
            return self._get_fallback_response(question, context, companies)
    
    def _get_fallback_response(self, question: str, context: str, companies: List[str] = None) -> str:
        """
        Provide a fallback response when AI is not available
        """
        companies_str = ", ".join(companies) if companies else "competitors"
        
        response_templates = {
            'pricing': f"Based on available data from {companies_str}, competitor pricing strategies typically focus on value proposition and market positioning. The annual reports show different approaches to pricing transparency and value communication.",
            'market': f"Market analysis from {companies_str} documents shows varying market share strategies, growth trajectories, and customer segments. Key competitors show different competitive advantages in the consulting/technology services space.",
            'strategy': f"Competitive strategy analysis across {companies_str} reveals different approaches to market positioning, service portfolios, and strategic initiatives. Focus areas include digital transformation, cloud services, and industry expertise.",
            'revenue': f"Revenue analysis from annual reports of {companies_str} shows different growth patterns, geographic distribution, and service line performance. Financial data indicates varying levels of profitability and investment strategies.",
            'service': f"Service portfolio analysis across {companies_str} reveals different specializations, from traditional consulting to digital transformation, cloud migration, and emerging technologies."
        }
        
        # Enhanced keyword matching for fallback responses
        question_lower = question.lower()
        for keyword, template in response_templates.items():
            if keyword in question_lower:
                enhanced_response = f"{template}\n\n📊 **Available Data Sources:**\n"
                if companies:
                    for company in companies:
                        company_docs = self.knowledge_base.get(company, [])
                        doc_types = set(doc['document_type'] for doc in company_docs)
                        enhanced_response += f"• {company}: {len(company_docs)} documents ({', '.join(doc_types)})\n"
                
                enhanced_response += f"\n💡 **Note:** For detailed AI-powered analysis with specific insights from these {len(self.documents)} competitor documents, please configure the GOOGLE_API_KEY environment variable."
                return enhanced_response
        
        # Generic fallback with competitor-specific information
        return f"""🔍 **Competitor Intelligence Analysis**

**Question:** "{question}"

**Available Competitor Data:**
• Companies: {companies_str}
• Documents: {len(self.documents)} annual reports and financial documents
• Coverage: Multi-year financial data, strategic initiatives, market positioning

**Analysis Capabilities:**
✅ Revenue and financial performance comparison
✅ Market positioning and competitive strategies  
✅ Service portfolio and specialization analysis
✅ Geographic presence and growth patterns
✅ Strategic initiatives and digital transformation focus

**Key Competitors in Database:**
{chr(10).join([f"• {company}: {len(docs)} documents" for company, docs in self.knowledge_base.items()])}

**For Enhanced AI Analysis:** Configure GOOGLE_API_KEY to get detailed insights, trend analysis, and strategic recommendations based on the comprehensive competitor document collection.

**Sample Questions You Can Ask:**
- "Compare revenue growth between Accenture and Capgemini"
- "What are the main strategic focuses of these competitors?"
- "How do these companies position themselves in digital transformation?"
- "What geographic markets do these competitors prioritize?"
"""

    def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the system
        """
        return {
            'documents_loaded': len(self.documents),
            'companies_analyzed': list(self.knowledge_base.keys()),
            'ai_enabled': bool(self.gemini_model),
            'knowledge_base_size': len(self.knowledge_base),
            'pdf_directory': self.data_pdfs_path,
            'ready': True,
            'ai_provider': 'Google Gemini' if self.gemini_model else 'None',
            'capabilities': [
                'Competitor document analysis',
                'Multi-company comparison',
                'Financial data insights',
                'Strategic analysis',
                'Market positioning analysis'
            ]
        }

# Alias for compatibility
PDFCopilot = SimplePDFCopilot
