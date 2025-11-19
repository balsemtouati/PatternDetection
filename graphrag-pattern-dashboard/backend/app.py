"""
Main Flask Application for Pattern Analysis Backend
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging
from config import UPLOAD_FOLDER, DEBUG, HOST, PORT
from api_routes_nopandas import APIRoutes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create Flask app
app = Flask(__name__)
CORS(app)

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize API routes
api_routes = APIRoutes(app)

# Add a simple root endpoint
@app.route('/')
def root():
    return jsonify({
        'message': 'Pattern Analysis Backend API',
        'version': '1.0.0',
        'endpoints': {
            'upload': '/api/upload',
            'analyze': '/api/analyze',
            'health': '/api/health',
            'status': '/api/status'
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Pattern Analysis Backend...")
    print(f"📍 Backend URL: http://{HOST}:{PORT}")
    print("🔗 API Endpoints:")
    print("   - POST /api/upload - Upload files")
    print("   - POST /api/analyze - Analyze patterns")
    print("   - GET  /api/health - Health check")
    print("   - GET  /api/status - Detailed status")
    print(f"\n📁 Upload folder: {UPLOAD_FOLDER}")
    print("=" * 50)
    
    app.run(debug=DEBUG, port=PORT, host=HOST) 