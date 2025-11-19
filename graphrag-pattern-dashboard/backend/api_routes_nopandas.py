"""
API Module for Pattern Analysis Backend - Pandas Free Version
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
        google_api_key = os.getenv('GOOGLE_API_KEY', 'AIzaSyA1CTxhgunnghEmp-0YQiqy1Hdz615ymV0')
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
    
    def analyze_graphrag(self):
        """Analyze patterns using GraphRAG"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            query = data.get('query', '')
            if not query:
                return jsonify({'success': False, 'error': 'Query is required'}), 400
            
            # Analyze using GraphRAG
            result = self.graph_rag_analyzer.analyze_query(query)
            
            return jsonify({
                'success': True,
                'result': result
            })
            
        except Exception as e:
            logger.error(f"Error in GraphRAG analysis: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    def competitor_chat(self):
        """Chat with competitor intelligence using MURAG"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            message = data.get('message', '')
            if not message:
                return jsonify({'success': False, 'error': 'Message is required'}), 400
            
            if not self.murag_copilot:
                return jsonify({
                    'success': False,
                    'error': 'Competitor intelligence service not available'
                }), 503
            
            # Get response from MURAG
            response = self.murag_copilot.chat(message)
            
            return jsonify({
                'success': True,
                'response': response
            })
            
        except Exception as e:
            logger.error(f"Error in competitor chat: {e}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
