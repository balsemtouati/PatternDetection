"""
Test script for notebook-based GraphRAG
"""
import requests
import json

# Test the notebook-based GraphRAG endpoint
def test_notebook_graphrag():
    url = "http://localhost:5000/api/analyze-graphrag"
    
    # Test query similar to the notebook example
    payload = {
        "query": "I have a new client who is suffering from aging SAP system. What should I do?",
        "config": {
            "hops": 1,
            "k": 12,
            "max_nodes": 1500
        }
    }
    
    print("🔍 Testing notebook GraphRAG with query:", payload["query"])
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print("📊 Metadata:", result.get("analysisMetadata", {}))
            print("\n" + "="*80)
            print("📝 FULL ANSWER:")
            print("="*80)
            print(result.get("patterns", ""))
            print("="*80)
            print("🏗️ Subgraph:", f"{len(result.get('subgraph', {}).get('nodes', []))} nodes, {len(result.get('subgraph', {}).get('edges', []))} edges")
        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_notebook_graphrag()
