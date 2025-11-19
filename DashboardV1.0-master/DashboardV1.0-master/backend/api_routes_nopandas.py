"""
API # Add the backend d        # Initialize GraphRAG using the wrapper class
        google_api_key = os.getenv('GOOGLE_API_KEY', 'AIzaSyA1CTxhgunnghEmp-0YQiqy1Hdz615ymV0')
        self.graph_rag_analyzer = GraphRAGWrapper(google_api_key)tory to Python path for graphrag_wrapper
sys.path.append(os.path.dirname(__file__))
from graphrag_wrapper import GraphRAGWrappertes Module for Pattern Analysis Backend - Pandas Free Version
"""
from flask import request, jsonify
from datetime import datetime
import logging
import os
import sys

# Add the backend directory to Python path for working_graphrag
sys.path.append(os.path.dirname(__file__))
from working_graphrag import WorkingGraphRAG

# Import MURAG for competitor intelligence
from MURAG_simple import PDFCopilot

from config import UPLOAD_FOLDER

logger = logging.getLogger(__name__)

class APIRoutes:
    """Handles all API routes for the pattern analysis backend"""
    
    def __init__(self, app):
        self.app = app
        
        # Initialize GraphRAG using the new working class
        google_api_key = os.getenv('GOOGLE_API_KEY', 'AIzaSyDsY6pE43phCdC8mAiYKzlRQegxPedUXOQ')
        json_path = os.path.join(os.path.dirname(__file__), "..", "graphRAG", "case_studies_graph.json")
        self.graph_rag_analyzer = WorkingGraphRAG(json_path, google_api_key)
        
        # Initialize MURAG for competitor intelligence (now uses Google Gemini)
        try:
            self.murag_copilot = PDFCopilot()
            logger.info("MURAG competitor intelligence initialized successfully")
        except Exception as e:
            self.murag_copilot = None
            logger.warning(f"MURAG initialization failed: {e}")
        
        # Register routes
        self.register_routes()
    
    def register_routes(self):
        """Register all API routes"""
        self.app.add_url_rule('/api/health', 'health_check', self.health_check, methods=['GET'])
        self.app.add_url_rule('/api/analyze-graphrag', 'analyze_graphrag', self.analyze_graphrag, methods=['POST'])
        self.app.add_url_rule('/api/competitor-chat', 'competitor_chat', self.competitor_chat, methods=['POST'])
    
    def health_check(self):
        """Health check endpoint"""
        murag_status = 'disabled'
        murag_details = {}
        
        if self.murag_copilot:
            try:
                murag_details = self.murag_copilot.get_status()
                murag_status = 'available' if murag_details.get('ai_enabled', False) else 'limited'
            except Exception as e:
                murag_status = 'error'
                murag_details = {'error': str(e)}
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'graph_rag_analyzer': 'available',
                'competitor_intelligence': murag_status
            },
            'murag_details': murag_details
        })
    
    def upload_data(self):
        """Handle data file upload"""
        try:
            # Validate request
            is_valid, message = self.data_processor.validate_upload_request(request)
            if not is_valid:
                return jsonify({'success': False, 'error': message}), 400
            
            file = request.files['file']
            
            # Save file
            filepath = self.data_processor.save_uploaded_file(file)
            
            # Process the data
            result = self.data_processor.process_data_for_analysis(filepath)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'File uploaded and processed successfully',
                    'data': result
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Processing failed')
                }), 500
                
        except Exception as e:
            logger.error(f"Upload error: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    def analyze_patterns(self):
        """Handle pattern analysis requests"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            # Extract data sources and configuration
            data_sources = data.get('dataSources', [])
            config = data.get('config', {})
            
            if not data_sources:
                return jsonify({'success': False, 'error': 'No data sources provided'}), 400
            
            # Run pattern analysis
            result = self.pattern_analyzer.analyze_patterns(data_sources, config)
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    def analyze_graphrag(self):
        """Handle GraphRAG pattern analysis requests using notebook approach"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            # Extract query from request - check both root level and config
            query = data.get('query', '')
            config = data.get('config', {})
            
            # If no query at root level, check inside config
            if not query:
                query = config.get('query', '')
            
            if not query:
                return jsonify({'success': False, 'error': 'No query provided'}), 400
            
            logger.info(f"🚀 Starting GraphRAG analysis with query: {query}")
            
            # Run analysis using GraphRAGWrapper
            result = self.graph_rag_analyzer.answer_question(
                query=query,
                hops=config.get('hops', 1),
                k=config.get('k', 12),
                max_nodes=config.get('max_nodes', 1500)
            )
            
            # Safely extract metadata
            metadata = result.get('metadata', {})
            logger.info(f"📊 GraphRAG metadata: {metadata}")
            
            # Convert metadata to frontend format (camelCase)
            formatted_metadata = {
                'retrievedDocs': metadata.get('retrieved_docs', len(result.get('docs', []))),
                'seedCount': metadata.get('seed_count', len([d for d in result.get('docs', []) if d.metadata.get('kind') == 'node'])),
                'subgraphNodes': metadata.get('subgraph_nodes', len(result.get('sub_nodes', []))),
                'subgraphEdges': metadata.get('subgraph_edges', len(result.get('sub_edges', []))),
                'query': query,
                'approach': 'graphrag_wrapper',
                'hops': config.get('hops', 1),
                'k': config.get('k', 12)
            }
            
            # Format response for frontend compatibility
            response = {
                'success': True,
                'patterns': result.get('answer', ''),
                'analysisMetadata': formatted_metadata,
                'subgraph': {
                    'nodes': [
                        {
                            'id': getattr(n, 'id', ''),
                            'type': ', '.join(n.data.get('labels', [])) if isinstance(n.data.get('labels', []), list) else n.data.get('labels', ''),
                            'title': n.data.get('title', n.data.get('name', getattr(n, 'id', ''))),
                            'data': n.data
                        } for n in result.get('sub_nodes', [])[:50]  # Limit for response size
                    ],
                    'edges': [
                        {
                            'source': e.source,
                            'target': e.target,
                            'type': e.data.get('type', '')
                        } for e in result.get('sub_edges', [])[:100]  # Limit for response size
                    ]
                }
            }
            
            logger.info(f"✓ GraphRAG Wrapper analysis completed successfully")
            
            return jsonify(response)
            
        except Exception as e:
            logger.error(f"❌ GraphRAG Wrapper analysis error: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'patterns': '',
                'analysisMetadata': {
                    'error': str(e),
                    'approach': 'graphrag_wrapper'
                }
            }), 500
    
    def competitor_chat(self):
        """Handle competitor intelligence chat requests using MURAG"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            # Extract query from request
            query = data.get('query', '')
            
            if not query:
                return jsonify({'success': False, 'error': 'No query provided'}), 400
                
            if not self.murag_copilot:
                return jsonify({
                    'success': False, 
                    'error': 'Competitor intelligence service not available. Please ensure GOOGLE_API_KEY is configured.'
                }), 503
            
            logger.info(f"🔍 Starting competitor intelligence analysis with query: {query}")
            
            # Get response from MURAG
            murag_response = self.murag_copilot.query(query)
            
            # Format response for frontend
            response = {
                'success': murag_response.get('success', True),
                'answer': murag_response.get('response', 'No response generated'),
                'timestamp': datetime.now().isoformat(),
                'query': query,
                'documents_count': murag_response.get('documents_count', 0),
                'companies_analyzed': murag_response.get('companies_analyzed', [])
            }
            
            logger.info(f"✅ Competitor intelligence analysis completed")
            
            return jsonify(response)
            
        except Exception as e:
            logger.error(f"❌ Competitor intelligence error: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e),
                'answer': f"Sorry, I encountered an error while analyzing competitor information: {str(e)}"
            }), 500
