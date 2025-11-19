#!/usr/bin/env python3
"""
Enhanced PDF Copilot with Together AI and LLM Judge
Modified for Hidden Pattern Analysis and Strategic Decision Making
"""

import os
import json
import pickle
from pathlib import Path
from typing import List, Dict, Optional
import logging
import requests

# PDF Processing
import PyPDF2
import fitz  # PyMuPDF for better text extraction

# Vector Processing
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Text Processing
import re
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

class TogetherAIClient:
    """Simple Together AI client"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.together.xyz/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completion(self, messages: List[Dict], model: str = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", max_tokens: int = 1000, temperature: float = 0.3):
        """Send chat completion request"""
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        response = requests.post(self.base_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]

class PDFCopilot:
    """Enhanced PDF Copilot with Pattern Analysis and Strategic Decision Making"""
    
    def __init__(self, together_api_key: str, data_folder: str = "murag_data"):
        """Initialize the Enhanced PDF Copilot"""
        self.data_folder = Path(data_folder)
        self.data_folder.mkdir(exist_ok=True)
        
        # Initialize Together AI client
        self.llm_client = TogetherAIClient(api_key=together_api_key)
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize vector store
        self.dimension = 384
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Storage for documents and metadata
        self.documents = []
        self.metadata = []
        self.pdf_info = {}
        
        # Load existing data if available
        self._load_existing_data()
        
        # Auto-scan for PDFs
        self._auto_scan_pdfs()
    
    def _extract_text_from_pdf(self, pdf_path: str) -> List[Dict]:
        """Extract text from PDF"""
        pages_content = []
        
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():
                    pages_content.append({
                        'page_number': page_num + 1,
                        'content': text.strip()
                    })
            doc.close()
            
        except Exception as e:
            # Fallback to PyPDF2
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page_num, page in enumerate(pdf_reader.pages):
                        text = page.extract_text()
                        if text.strip():
                            pages_content.append({
                                'page_number': page_num + 1,
                                'content': text.strip()
                            })
            except Exception as e2:
                logger.error(f"Could not process {pdf_path}")
                raise
        
        return pages_content
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into chunks"""
        text = re.sub(r'\s+', ' ', text.strip())
        
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            
            # Try to break at sentence boundary
            last_period = text.rfind('.', start, end)
            if last_period > start + chunk_size * 0.5:
                end = last_period + 1
            elif text[end] != ' ':
                last_space = text.rfind(' ', start, end)
                if last_space > start:
                    end = last_space
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
        
        return chunks
    
    def _add_pdf(self, pdf_path: str):
        """Add a PDF to the system (internal method)"""
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            return False
        
        pdf_id = pdf_path.stem
        if pdf_id in self.pdf_info:
            return True  # Already processed
        
        try:
            # Extract text from PDF
            pages = self._extract_text_from_pdf(str(pdf_path))
            
            if not pages:
                return False
            
            # Extract company name from filename or content
            company_name = self._extract_company_name(pdf_path.name, pages)
            
            # Process each page
            all_chunks = []
            chunk_metadata = []
            
            for page in pages:
                page_chunks = self._chunk_text(page['content'])
                
                for chunk_idx, chunk in enumerate(page_chunks):
                    if len(chunk.strip()) < 50:
                        continue
                    
                    metadata = {
                        'pdf_id': pdf_id,
                        'pdf_name': pdf_path.name,
                        'pdf_path': str(pdf_path),
                        'company_name': company_name,
                        'page_number': page['page_number'],
                        'chunk_index': chunk_idx,
                        'chunk_id': f"{pdf_id}_p{page['page_number']}_c{chunk_idx}",
                    }
                    
                    all_chunks.append(chunk)
                    chunk_metadata.append(metadata)
            
            if not all_chunks:
                return False
            
            # Generate embeddings
            embeddings = self.embedding_model.encode(all_chunks)
            faiss.normalize_L2(embeddings)
            
            # Add to vector store
            self.index.add(embeddings.astype('float32'))
            
            # Store documents and metadata
            start_idx = len(self.documents)
            self.documents.extend(all_chunks)
            self.metadata.extend(chunk_metadata)
            
            # Store PDF info
            self.pdf_info[pdf_id] = {
                'name': pdf_path.name,
                'path': str(pdf_path),
                'company_name': company_name,
                'chunks_count': len(all_chunks),
                'pages_count': len(pages),
            }
            
            # Save data
            self._save_data()
            return True
            
        except Exception as e:
            logger.error(f"Error processing {pdf_path.name}: {e}")
            return False
    
    def _extract_company_name(self, filename: str, pages: List[Dict]) -> str:
        """Extract company name from filename or content"""
        # Try filename first
        filename_lower = filename.lower()
        companies = {
            'capgemini': 'Capgemini',
            'accenture': 'Accenture', 
            'inetum': 'Inetum',
            'deloitte': 'Deloitte',
            'pwc': 'PwC',
            'ey': 'EY',
            'kpmg': 'KPMG',
            'mckinsey': 'McKinsey',
            'bcg': 'BCG',
            'bain': 'Bain',
            'microsoft': 'Microsoft',
            'google': 'Google',
            'amazon': 'Amazon',
            'apple': 'Apple'
        }
        
        for key, value in companies.items():
            if key in filename_lower:
                return value
        
        # Try to extract from first page content
        if pages:
            first_page = pages[0]['content'][:1000].lower()
            for key, value in companies.items():
                if key in first_page:
                    return value
        
        return "Unknown Company"
    
    def _search_similar(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search for similar chunks"""
        if len(self.documents) == 0:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])
        faiss.normalize_L2(query_embedding)
        
        # Search in vector store
        scores, indices = self.index.search(query_embedding.astype('float32'), min(top_k * 2, len(self.documents)))
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            
            results.append({
                'content': self.documents[idx],
                'metadata': self.metadata[idx],
                'similarity_score': float(score)
            })
            
            if len(results) >= top_k:
                break
        
        return results
    
    def _judge_retrieved_data(self, question: str, chunks: List[Dict]) -> List[Dict]:
        """Use LLM to judge if retrieved chunks are actually relevant to the query"""
        
        if not chunks:
            return []
        
        # Prepare chunks for evaluation
        chunks_text = []
        for i, chunk in enumerate(chunks):
            content = chunk['content'][:500] + "..." if len(chunk['content']) > 500 else chunk['content']
            chunks_text.append(f"CHUNK {i+1}:\nSource: {chunk['metadata']['pdf_name']} (Page {chunk['metadata']['page_number']})\nContent: {content}")
        
        judge_prompt = f"""You are an expert information retrieval judge specializing in competitive intelligence analysis. Your task is to determine which retrieved text chunks contain valuable competitive insights.

QUESTION: {question}

RETRIEVED CHUNKS:
{chr(10).join(chunks_text)}

For each chunk, determine if it contains information that can help answer the question OR reveal competitive insights such as:
- Strategic initiatives and business directions
- Market positioning and competitive advantages
- Financial performance indicators
- Technology investments and capabilities
- Partnership and acquisition strategies
- Customer segments and market approaches
- Operational metrics and performance data
- Future plans and roadmaps

Even if the chunk doesn't directly answer the question but contains valuable competitive intelligence, include it.

Respond with ONLY the numbers of relevant chunks (e.g., "1,3,5" or "2,4" or "none").
If no chunks are relevant, respond with "none".
Do not include explanations - just the numbers."""

        try:
            judge_response = self.llm_client.chat_completion([
                {"role": "user", "content": judge_prompt}
            ], max_tokens=50, temperature=0.1)
            
            # Parse the response to get relevant chunk indices
            judge_response = judge_response.strip().lower()
            
            if "none" in judge_response:
                return []
            
            # Extract numbers from response
            import re
            numbers = re.findall(r'\d+', judge_response)
            relevant_indices = [int(n) - 1 for n in numbers if int(n) <= len(chunks)]  # Convert to 0-based index
            
            # Return only the relevant chunks
            return [chunks[i] for i in relevant_indices if 0 <= i < len(chunks)]
            
        except Exception as e:
            logger.warning(f"Judge failed, using all chunks: {e}")
            return chunks  # Fallback to using all chunks if judge fails

    def _extract_recursive_patterns(self, question: str, relevant_chunks: List[Dict]) -> Dict[str, str]:
        """Extract recursive patterns across multiple years and companies"""
        
        # Group chunks by company and extract temporal information
        companies_data = {}
        temporal_data = []
        
        for chunk in relevant_chunks:
            content = chunk['content']
            metadata = chunk['metadata']
            company_name = metadata.get('company_name', 'Unknown')
            
            if company_name not in companies_data:
                companies_data[company_name] = []
            
            companies_data[company_name].append({
                'content': content[:800] + "..." if len(content) > 800 else content,
                'source': f"{metadata['pdf_name']} (Page {metadata['page_number']})"
            })
            
            temporal_data.append({
                'company': company_name,
                'content': content,
                'source': metadata['pdf_name']
            })
        
        # Build context for pattern analysis
        companies_context = []
        for company, data in companies_data.items():
            company_content = f"\n**{company}:**\n"
            for item in data[:3]:  # Limit to top 3 chunks per company
                company_content += f"- Source: {item['source']}\n  Content: {item['content']}\n\n"
            companies_context.append(company_content)
        
        pattern_analysis_prompt = f"""You are a Pattern Extraction Expert.  
Your sole role is to detect and extract SPECIFIC, ELABORATED PATTERNS from the given multi-company, multi-period data.  
You are NOT here to summarize, interpret, or speculate — only to extract concrete patterns exactly as they appear in the data.

PATTERN DEFINITION for this task:  
A pattern is a clearly defined sequence, structure, behavior, or configuration that appears multiple times, either:
- Across different companies (cross-company patterns)
- Across different time periods (temporal patterns)
- Across an entire industry (industry-wide patterns)
- Or in any other repeating or structurally similar context

INPUT DATA:
ORIGINAL QUESTION:
{question}

MULTI-COMPANY DATA:
{chr(10).join(companies_context)}

TASK:
1. Search the data exhaustively for patterns.
2. Extract ONLY patterns that are:
   - **Specific**: clearly describing the entities, actions, metrics, or configurations involved
   - **Elaborated**: providing details such as conditions, triggers, variations, and exceptions
   - **Data-grounded**: explicitly linked to where they appear in the input
3. Extract relevant and hidden patterns 
4. For each pattern:
   - Give it a clear descriptive title
   - Describe it in detail 
   - List references to how you extracted that pattern

OUTPUT FORMAT:
- Use bullet points under each category.
- Each bullet point must contain:
  **[Pattern Title]:** Detailed description with examples and contextual details.
- Do NOT provide generic statements like "companies often hire in cycles" — instead, specify exactly what the cycle is, how long, which companies, and when it occurs.

"""
        try:
            pattern_analysis = self.llm_client.chat_completion([
                {"role": "user", "content": pattern_analysis_prompt}
            ], max_tokens=700, temperature=0.3)
            
            # Generate the main analysis using filtered relevant data
            analysis_prompt = f"""Based on the recursive patterns identified and the competitor data provided, answer the original question with deep analytical insights.

ORIGINAL QUESTION: {question}

RECURSIVE PATTERNS IDENTIFIED:
{pattern_analysis}

COMPETITOR DATA FOR ANALYSIS:
{chr(10).join(companies_context)}

Provide a comprehensive analysis that:
1. Directly answers the original question
2. Incorporates the recursive patterns found
3. Provides strategic insights based on cross-company and temporal patterns
4. Focuses on actionable business intelligence

Keep your response analytical and insight-driven."""

            analysis = self.llm_client.chat_completion([
                {"role": "user", "content": analysis_prompt}
            ], max_tokens=600, temperature=0.3)
            
            return {
                'patterns': pattern_analysis,
                'analysis': analysis
            }
            
        except Exception as e:
            return {
                'patterns': f"Unable to detect recursive patterns at this time. ({str(e)})",
                'analysis': f"Based on available data: {relevant_chunks[0]['content'][:300]}... (from {relevant_chunks[0]['metadata']['pdf_name']})"
            }

    def _generate_strategic_recommendations(self, question: str, patterns_and_analysis: Dict[str, str], company_names: List[str]) -> str:
        """Generate strategic recommendations based on recursive patterns and competitive analysis"""
        
        companies_str = ", ".join(set(company_names)) if company_names else "your organization"
        
        recommendation_prompt = f"""You are a senior strategy consultant specializing in pattern-based competitive strategy. Based on the recursive patterns identified across companies and time periods, generate strategic recommendations for enhanced decision-making.

ORIGINAL QUESTION: {question}
COMPETITORS ANALYZED: {companies_str}

RECURSIVE PATTERNS IDENTIFIED:
{patterns_and_analysis.get('patterns', 'No patterns identified')}

COMPETITIVE ANALYSIS:
{patterns_and_analysis.get('analysis', 'No analysis available')}

Based on these RECURSIVE PATTERNS and competitive analysis, provide strategic recommendations that leverage or break these patterns:

🎯 **PATTERN-BASED STRATEGIC RECOMMENDATIONS:**

**Leverage Successful Recursive Patterns:**
- Which proven patterns should be adopted or accelerated?
- How can successful cross-company patterns be implemented?
- What timing advantages exist based on cyclical patterns?

**Break Negative Recursive Patterns:**
- Which industry-wide patterns create opportunities to differentiate?
- Where can pattern-breaking strategies create competitive advantage?
- What first-mover advantages exist by avoiding common patterns?

**Predictive Strategic Positioning:**
- Based on patterns, what strategic moves should be anticipated from competitors?
- Which market opportunities will emerge following historical patterns?
- What defensive strategies are needed based on recurring competitive behaviors?

**Decision-Making Framework:**
- Key criteria for pattern-based strategic decisions
- Risk mitigation for pattern-breaking strategies
- Timing considerations based on recursive cycles
- Resource allocation priorities based on pattern analysis

Each recommendation should be:
- Based on the recursive patterns identified
- Focused on competitive advantage through pattern intelligence
- Actionable with clear strategic rationale
- Anticipatory of future competitive moves based on patterns

Prioritize recommendations that provide sustainable competitive advantages by leveraging pattern intelligence."""

        try:
            recommendations = self.llm_client.chat_completion([
                {"role": "user", "content": recommendation_prompt}
            ], max_tokens=700, temperature=0.3)
            
            return recommendations
        except Exception as e:
            return f"🎯 **STRATEGIC RECOMMENDATIONS**: Unable to generate recommendations at this time. ({str(e)})"
    
    def ask(self, question: str) -> str:
        """Ask a question and get enhanced competitive intelligence analysis with recursive patterns"""
        # Search for potentially relevant chunks
        print("🔍 Searching documents...")
        candidate_chunks = self._search_similar(question, top_k=10)  # Get more candidates
        
        if not candidate_chunks:
            return "I couldn't find relevant information in your competitor PDFs to answer that question. Make sure you have PDF files in the 'pdfs' folder."
        
        # Use LLM judge to filter only truly relevant chunks
        print("⚖️  Filtering relevant information...")
        relevant_chunks = self._judge_retrieved_data(question, candidate_chunks)
        
        if not relevant_chunks:
            return "I found some documents that might be related, but none contain information directly relevant to your question. Try rephrasing your question or asking something more specific about competitor strategies."
        
        print(f"✅ Found {len(relevant_chunks)} relevant sources")
        
        # Extract company names from relevant sources
        company_names = [chunk['metadata'].get('company_name', 'Unknown Company') for chunk in relevant_chunks]
        company_names = [name for name in company_names if name != 'Unknown Company']
        
        # Generate analysis
        print("🤔 Generating analysis...")
        print("🔄 Hidden Patterns detection")
        
        # Extract recursive patterns and generate analysis
        patterns_and_analysis = self._extract_recursive_patterns(question, relevant_chunks)
        
        # Generate strategic recommendations
        print("🎯 Generating strategic recommendations to enhance decision making...")
        strategic_recommendations = self._generate_strategic_recommendations(question, patterns_and_analysis, company_names)
        
        # Format the output exactly as requested
        full_response = f"""💬 **ANALYSIS:**
{patterns_and_analysis.get('analysis', 'No analysis available')}

---

🎯 **STRATEGIC RECOMMENDATIONS:**
{strategic_recommendations}"""
        
        return full_response
    
    def _auto_scan_pdfs(self):
        """Automatically scan for PDFs in the pdfs folder"""
        folder = Path("pdfs")
        
        if not folder.exists():
            folder.mkdir()
            return
        
        pdf_files = list(folder.glob("*.pdf"))
        
        if not pdf_files:
            return
        
        new_pdfs = 0
        for pdf_file in pdf_files:
            if self._add_pdf(str(pdf_file)):
                if pdf_file.stem not in self.pdf_info or self.pdf_info.get(pdf_file.stem, {}).get('chunks_count', 0) > 0:
                    new_pdfs += 1
        
        if new_pdfs > 0:
            print(f"📚 Loaded {new_pdfs} competitor PDF(s) from the pdfs folder")
    
    def _save_data(self):
        """Save data to disk"""
        try:
            faiss.write_index(self.index, str(self.data_folder / "vector_index.faiss"))
            
            with open(self.data_folder / "documents.pkl", 'wb') as f:
                pickle.dump(self.documents, f)
            
            with open(self.data_folder / "metadata.pkl", 'wb') as f:
                pickle.dump(self.metadata, f)
            
            with open(self.data_folder / "pdf_info.json", 'w') as f:
                json.dump(self.pdf_info, f, indent=2, default=str)
        except Exception:
            pass
    
    def _load_existing_data(self):
        """Load existing data if available"""
        try:
            index_path = self.data_folder / "vector_index.faiss"
            if index_path.exists():
                self.index = faiss.read_index(str(index_path))
            
            docs_path = self.data_folder / "documents.pkl"
            if docs_path.exists():
                with open(docs_path, 'rb') as f:
                    self.documents = pickle.load(f)
            
            meta_path = self.data_folder / "metadata.pkl"
            if meta_path.exists():
                with open(meta_path, 'rb') as f:
                    self.metadata = pickle.load(f)
            
            pdf_info_path = self.data_folder / "pdf_info.json"
            if pdf_info_path.exists():
                with open(pdf_info_path, 'r') as f:
                    self.pdf_info = json.load(f)
        except Exception:
            pass

def main():
    """Enhanced competitive intelligence copilot interface"""
    
    # Check for Together AI API key
    api_key = os.getenv("TOGETHER_API_KEY")
    if not api_key:
        print("⛔ Please set your Together AI API key:")
        print("export TOGETHER_API_KEY='your-api-key-here'")
        print("\n💡 Get your free API key at: https://api.together.xyz/")
        return
    
    # Initialize Enhanced Competitive Intelligence Copilot
    print("🤖 Recursive Pattern Analysis Copilot Ready!")
    print("📊 Put competitor PDF files in the 'pdfs' folder")
    print("🔄 I specialize in finding recursive patterns across companies and years")
    print("🎯 Ask strategic questions to get pattern-based insights and recommendations")
    print("❓ Type 'quit' to exit\n")
    
    copilot = PDFCopilot(together_api_key=api_key)
    
    # Enhanced competitive intelligence chat loop
    while True:
        try:
            question = input("❓ Ask me anything: ").strip()
            
            if question.lower() in ['quit', 'exit', 'bye']:
                print("👋 Goodbye!")
                break
            
            if not question:
                continue
            
            answer = copilot.ask(question)
            print(f"\n{answer}\n")
            print("="*80 + "\n")
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"⛔ Sorry, something went wrong: {e}\n")

if __name__ == "__main__":
    main()