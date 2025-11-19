#!/usr/bin/env python3
"""
Test script to verify the updated GraphRAG integration with the knowledge graph
"""

import requests
import json

def test_graphrag_endpoint():
    """Test the GraphRAG endpoint with knowledge graph analysis"""
    
    backend_url = "http://localhost:5000"
    
    # Test GraphRAG analysis with existing knowledge graph
    print("🧠 Testing GraphRAG analysis with existing knowledge graph...")
    
    test_query = "I have a new client who is suffering from aging SAP system. What should I do?"
    
    payload = {
        "dataSources": [],  # Empty - we want to use existing knowledge graph
        "config": {
            "analysisType": "graphRAG",
            "query": test_query,
            "hops": 1,
            "retrieval_k": 12,
            "max_nodes": 1000
        }
    }
    
    try:
        print(f"Query: {test_query}")
        print("Sending request to GraphRAG endpoint...")
        
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
            
            # Check metadata
            metadata = result.get('analysisMetadata', {})
            graph_stats = metadata.get('graph_stats', {})
            
            print(f"\n📊 Graph Statistics:")
            print(f"   Total nodes: {graph_stats.get('total_nodes', 'N/A')}")
            print(f"   Total edges: {graph_stats.get('total_edges', 'N/A')}")
            print(f"   Subgraph nodes: {graph_stats.get('subgraph_nodes', 'N/A')}")
            print(f"   Subgraph edges: {graph_stats.get('subgraph_edges', 'N/A')}")
            
            retrieval_meta = metadata.get('retrieval_metadata', {})
            print(f"\n🔍 Retrieval Metadata:")
            print(f"   Retrieved docs: {retrieval_meta.get('retrieved_docs', 'N/A')}")
            print(f"   Seed IDs: {retrieval_meta.get('seed_ids', 'N/A')}")
            print(f"   Hops: {retrieval_meta.get('hops', 'N/A')}")
            
            # Show analysis result
            patterns = result.get('patterns', '')
            print(f"\n🎯 Analysis Result ({len(patterns)} characters):")
            print("=" * 80)
            print(patterns[:1000] + "..." if len(patterns) > 1000 else patterns)
            print("=" * 80)
            
            # Verify we're using the knowledge graph
            total_nodes = graph_stats.get('total_nodes', 0)
            total_edges = graph_stats.get('total_edges', 0)
            
            if total_nodes >= 660 and total_edges >= 1600:
                print("\n✅ SUCCESS: GraphRAG is using the existing knowledge graph!")
                print(f"   Expected ~664 nodes, got {total_nodes}")
                print(f"   Expected ~1703 edges, got {total_edges}")
                return True
            else:
                print(f"\n⚠️ WARNING: Graph size seems smaller than expected")
                print(f"   Got {total_nodes} nodes, {total_edges} edges")
                return False
            
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error during GraphRAG test: {e}")
        return False

if __name__ == "__main__":
    success = test_graphrag_endpoint()
    if success:
        print("\n🎉 GraphRAG integration test PASSED!")
        print("The frontend can now access the existing knowledge graph via the GraphRAG endpoint.")
    else:
        print("\n❌ GraphRAG integration test FAILED!")
        print("Check the backend logs for more details.")
