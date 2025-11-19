#!/usr/bin/env python3
"""
Script de lancement du backend Flask
"""

from app import app

if __name__ == '__main__':
    print("🚀 Starting Pattern Analysis Backend...")
    print("📍 Backend URL: http://localhost:5000")
    print("🔗 API Endpoints:")
    print("   - POST /api/upload - Upload files")
    print("   - POST /api/analyze - Analyze patterns")
    print("   - GET  /api/health - Health check")
    print("\n📁 Upload folder: ./uploads")
    print("=" * 50)
    
    app.run(debug=True, port=5000, host='0.0.0.0') 