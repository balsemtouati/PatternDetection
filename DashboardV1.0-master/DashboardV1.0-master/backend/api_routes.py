"""
API Routes Module for Pattern Analysis Backend
"""
from flask import request, jsonify
from datetime import datetime
import logging
from data_processor_nopandas import PandasFreeDataProcessor
from pattern_analyzer_nopandas import SimplifiedPatternAnalyzer
from graph_rag_analyzer_nopandas import PandasFreeGraphRAGAnalyzer
from config import UPLOAD_FOLDER

logger = logging.getLogger(__name__)

class APIRoutes:
    """Handles all API routes for the pattern analysis backend"""
    
    def __init__(self, app):
        self.app = app
        self.data_processor = PandasFreeDataProcessor(UPLOAD_FOLDER)
from pattern_analyzer import PatternAnalyzer
from graph_rag_analyzer_nopandas import PandasFreeGraphRAGAnalyzer
from config import UPLOAD_FOLDER

logger = logging.getLogger(__name__)

class APIRoutes:
    """Handles all API routes for the pattern analysis backend"""
    
    def __init__(self, app):
        self.app = app
        self.data_processor = PandasFreeDataProcessor(UPLOAD_FOLDER)
        self.pattern_analyzer = PatternAnalyzer()
        self.graph_rag_analyzer = PandasFreeGraphRAGAnalyzer()
        self._register_routes()
    
    def _register_routes(self):
        """Register all API routes"""
        self.app.add_url_rule('/api/upload', 'upload_file', self.upload_file, methods=['POST'])
        self.app.add_url_rule('/api/analyze', 'analyze', self.analyze, methods=['POST'])
        self.app.add_url_rule('/api/analyze-graphrag', 'analyze_graphrag', self.analyze_graphrag, methods=['POST'])
        self.app.add_url_rule('/api/health', 'health_check', self.health_check, methods=['GET'])
        self.app.add_url_rule('/api/status', 'status', self.status, methods=['GET'])
    
    def upload_file(self):
        """Handle file upload endpoint"""
        try:
            if 'files' not in request.files:
                return jsonify({'error': 'No files provided'}), 400
            
            files = request.files.getlist('files')
            uploaded_files = []
            
            for file in files:
                if file and self.data_processor.allowed_file(file.filename):
                    try:
                        processed_file = self.data_processor.process_uploaded_file(file, file.filename)
                        uploaded_files.append(processed_file)
                        logger.info(f"Successfully processed file: {file.filename}")
                    except Exception as e:
                        logger.error(f"Error processing file {file.filename}: {e}")
                        return jsonify({'error': f'Error processing {file.filename}: {str(e)}'}), 400
                else:
                    logger.warning(f"Invalid file: {file.filename if file else 'None'}")
                    return jsonify({'error': f'Invalid file format: {file.filename if file else "None"}'}), 400
            
            return jsonify({
                'message': f'Successfully uploaded {len(uploaded_files)} files',
                'files': uploaded_files,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error in upload_file: {e}")
            return jsonify({'error': str(e)}), 500
    
    def analyze(self):
        """Handle pattern analysis endpoint"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            data_sources = data.get('dataSources', [])
            config = data.get('config', {})
            
            if not data_sources:
                return jsonify({'error': 'No data sources provided'}), 400
            
            # Validate data sources
            for source in data_sources:
                if 'data' not in source or 'type' not in source:
                    return jsonify({'error': 'Invalid data source format'}), 400
            
            # Perform pattern analysis
            result = self.pattern_analyzer.analyze_patterns(data_sources, config)
            
            logger.info(f"Analysis completed: {result['analysisMetadata']['patterns_detected']} patterns found")
            
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Error in analyze: {e}")
            return jsonify({'error': str(e)}), 500
    
    def analyze_graphrag(self):
        """Handle GraphRAG pattern analysis endpoint"""
        try:
            data = request.json
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            data_sources = data.get('dataSources', [])
            config = data.get('config', {})
            
            if not data_sources:
                return jsonify({'error': 'No data sources provided'}), 400

            # Validate data sources
            for source in data_sources:
                if 'data' not in source or 'type' not in source:
                    return jsonify({'error': 'Invalid data source format'}), 400

            # Set default query if not provided
            if 'query' not in config:
                config['query'] = 'Analyze all business patterns and identify winning and losing configurations for projects, team performance, and client relationships'

            # Perform GraphRAG pattern analysis
            result = self.graph_rag_analyzer.analyze_patterns(data_sources, config)
            
            if result.get('success'):
                logger.info(f"GraphRAG Analysis completed: {result['analysisMetadata']['patterns_detected']} patterns found")
            else:
                logger.error(f"GraphRAG Analysis failed: {result.get('error', 'Unknown error')}")

            return jsonify(result)

        except Exception as e:
            logger.error(f"Error in analyze_graphrag: {e}")
            return jsonify({'error': str(e)}), 500
    
    def health_check(self):
        """Health check endpoint"""
        try:
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'services': {
                    'data_processor': 'operational',
                    'pattern_analyzer': 'operational',
                    'pattern_miner': 'operational'
                }
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    def status(self):
        """Detailed status endpoint"""
        try:
            # Get system status
            import psutil
            import os
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            return jsonify({
                'status': 'operational',
                'timestamp': datetime.now().isoformat(),
                'system': {
                    'cpu_usage': cpu_percent,
                    'memory_usage': memory.percent,
                    'disk_usage': disk.percent,
                    'uptime': psutil.boot_time()
                },
                'services': {
                    'data_processor': 'operational',
                    'pattern_analyzer': 'operational',
                    'pattern_miner': 'operational'
                },
                'config': {
                    'upload_folder': UPLOAD_FOLDER,
                    'allowed_extensions': list(self.data_processor.allowed_file('test.csv').__class__.__dict__.keys())
                }
            })
            
        except ImportError:
            # psutil not available, return basic status
            return jsonify({
                'status': 'operational',
                'timestamp': datetime.now().isoformat(),
                'note': 'Detailed system metrics not available (psutil not installed)',
                'services': {
                    'data_processor': 'operational',
                    'pattern_analyzer': 'operational',
                    'pattern_miner': 'operational'
                }
            })
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            return jsonify({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500 