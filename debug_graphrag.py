#!/usr/bin/env python3
"""
Debug script to check GraphRAG response format
"""

import requests
import json

def debug_graphrag_response():
    """Debug the GraphRAG response to see the actual pattern format"""
    
    backend_url = "http://localhost:5000"
    
    # Test GraphRAG analysis
    test_query = "What patterns can help with SAP system upgrades?"
    
    payload = {
        "config": {
            "analysisType": "graphRAG",
            "query": test_query,
            "hops": 1,
            "retrieval_k": 12,
            "max_nodes": 1000
        },
        "dataSources": []  # Empty - use existing knowledge graph
    }
    
    try:
        print(f"🔍 Testing GraphRAG with query: {test_query}")
        
        response = requests.post(
            f"{backend_url}/api/analyze-graphrag",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ GraphRAG analysis successful!")
            print(f"Success: {result.get('success', False)}")
            
            # Show the patterns text as received
            patterns = result.get('patterns', '')
            print(f"\n📄 Raw Patterns Response ({len(patterns)} characters):")
            print("=" * 100)
            print(patterns)
            print("=" * 100)
            
            # Check if it contains expected pattern markers
            pattern_markers = ['🧠', '**Pattern', 'Description', 'Key Variables', 'Impact', 'Business Implication']
            found_markers = [marker for marker in pattern_markers if marker in patterns]
            missing_markers = [marker for marker in pattern_markers if marker not in patterns]
            
            print(f"\n🔍 Pattern Format Analysis:")
            print(f"   Found markers: {found_markers}")
            if missing_markers:
                print(f"   Missing markers: {missing_markers}")
            
            # Show metadata
            metadata = result.get('analysisMetadata', {})
            print(f"\n📊 Metadata:")
            print(json.dumps(metadata, indent=2))
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_graphrag_response()
