import json
from dataclasses import dataclass
from typing import Any, Dict, List

from langchain.docstore.document import Document

import os, json
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document

from collections import defaultdict

import os, json
from collections import defaultdict
from typing import Any, Dict, List, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.vectorstores import FAISS  # for type clarity; already installed

try:
    from langchain_core.runnables.graph import Node as LCNode, Edge as LCEdge
except Exception:
    @dataclass
    class LCNode:
        id: str
        name: str = ""
        data: Dict[str, Any] = None
        metadata: Dict[str, Any] = None
    @dataclass
    class LCEdge:
        source: str
        target: str
        data: Dict[str, Any] = None
        metadata: Dict[str, Any] = None

def make_node_from_json(n: Dict[str, Any]):
    raw = n.get("data", {}) or {}
    node_id = n["id"]
    # good human-readable name if available
    name = raw.get("title") or raw.get("name") or node_id

    # Try modern signature first: (id, name, data, metadata)
    try:
        return LCNode(id=node_id, name=name, data=raw, metadata={})
    except TypeError:
        pass
    # Try legacy 2-arg versions
    try:
        return LCNode(id=node_id, data=raw)  # older langchain-core builds
    except TypeError:
        pass
    try:
        return LCNode(node_id, raw)  # positional
    except TypeError:
        pass
    # Try alt shape: (name, metadata) etc.
    try:
        return LCNode(name=node_id, metadata=raw)
    except TypeError:
        pass
    # Last resort: construct a dataclass-like shim
    return LCNode(id=node_id, name=name, data=raw, metadata={})

def make_edge_from_json(e: Dict[str, Any]):
    raw = e.get("data", {}) or {}
    src, tgt = e["source"], e["target"]
    # Modern: Edge(source, target, data, metadata?)
    try:
        return LCEdge(source=src, target=tgt, data=raw)
    except TypeError:
        pass
    # Alt: metadata instead of data
    try:
        return LCEdge(source=src, target=tgt, metadata=raw)
    except TypeError:
        pass
    # Positional
    try:
        return LCEdge(src, tgt, raw)
    except TypeError:
        pass
    # Fallback shim
    return LCEdge(source=src, target=tgt, data=raw, metadata={})

class WorkingGraphRAG:
    def __init__(self, json_path: str, google_api_key: str):
        self.json_path = json_path
        self.google_api_key = google_api_key
        
        # Set environment variable
        os.environ["GOOGLE_API_KEY"] = google_api_key
        
        # Load graph data
        self._load_graph()
        self._setup_embeddings()
        self._build_index()
        self._setup_adjacency()
    
    def _load_graph(self):
        """Load graph data from JSON file"""
        try:
            with open(self.json_path, 'r', encoding='utf-8') as f:
                self.graph_data = json.load(f)
            self.nodes = self.graph_data.get('nodes', [])
            self.edges = self.graph_data.get('edges', [])
            print(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} edges")
        except Exception as e:
            print(f"Error loading graph: {e}")
            self.nodes = []
            self.edges = []
    
    def _setup_embeddings(self):
        """Setup Google Gemini embeddings"""
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self.google_api_key
            )
            print("Embeddings setup successful")
        except Exception as e:
            print(f"Error setting up embeddings: {e}")
            self.embeddings = None
    
    def _build_index(self):
        """Build FAISS index from node documents"""
        if not self.embeddings or not self.nodes:
            print("Cannot build index: missing embeddings or nodes")
            return
        
        try:
            # Create documents from nodes
            documents = []
            for node in self.nodes:
                node_data = node.get('data', {})
                content = self._extract_node_content(node_data)
                if content:
                    doc = Document(
                        page_content=content,
                        metadata={'node_id': node['id'], 'node_data': node_data}
                    )
                    documents.append(doc)
            
            # Build FAISS index
            self.vectorstore = FAISS.from_documents(documents, self.embeddings)
            print(f"Built FAISS index with {len(documents)} documents")
        except Exception as e:
            print(f"Error building index: {e}")
            self.vectorstore = None
    
    def _extract_node_content(self, node_data: Dict[str, Any]) -> str:
        """Extract meaningful content from node data"""
        content_parts = []
        
        # Extract various text fields
        for field in ['title', 'name', 'description', 'content', 'text']:
            if field in node_data and node_data[field]:
                content_parts.append(str(node_data[field]))
        
        # Extract from nested structures
        if 'properties' in node_data:
            for prop, value in node_data['properties'].items():
                if isinstance(value, str) and value:
                    content_parts.append(f"{prop}: {value}")
        
        return " ".join(content_parts)
    
    def _setup_adjacency(self):
        """Setup adjacency lists for graph traversal"""
        self.adjacency = defaultdict(list)
        for edge in self.edges:
            source = edge['source']
            target = edge['target']
            self.adjacency[source].append(target)
            self.adjacency[target].append(source)  # Undirected graph
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """Analyze a query using GraphRAG approach"""
        if not self.vectorstore:
            return {"error": "Vector store not available"}
        
        try:
            # Search for relevant nodes
            docs = self.vectorstore.similarity_search(query, k=5)
            
            # Extract relevant node IDs
            relevant_nodes = [doc.metadata['node_id'] for doc in docs]
            
            # Find connected nodes in the graph
            connected_nodes = self._find_connected_nodes(relevant_nodes)
            
            # Generate analysis using Google Gemini
            analysis = self._generate_analysis(query, docs, connected_nodes)
            
            return {
                "query": query,
                "relevant_nodes": relevant_nodes,
                "connected_nodes": list(connected_nodes),
                "analysis": analysis,
                "graph_context": self._get_graph_context(connected_nodes)
            }
            
        except Exception as e:
            return {"error": f"Analysis failed: {str(e)}"}
    
    def _find_connected_nodes(self, node_ids: List[str], max_depth: int = 2) -> set:
        """Find nodes connected to the given nodes within max_depth"""
        connected = set(node_ids)
        frontier = set(node_ids)
        
        for depth in range(max_depth):
            new_frontier = set()
            for node_id in frontier:
                if node_id in self.adjacency:
                    neighbors = self.adjacency[node_id]
                    for neighbor in neighbors:
                        if neighbor not in connected:
                            connected.add(neighbor)
                            new_frontier.add(neighbor)
            frontier = new_frontier
            if not frontier:
                break
        
        return connected
    
    def _get_graph_context(self, node_ids: set) -> Dict[str, Any]:
        """Get context information for the given nodes"""
        context = {
            "nodes": [],
            "edges": [],
            "summary": {}
        }
        
        # Get node details
        for node_id in node_ids:
            node = next((n for n in self.nodes if n['id'] == node_id), None)
            if node:
                context["nodes"].append({
                    "id": node_id,
                    "data": node.get('data', {})
                })
        
        # Get relevant edges
        for edge in self.edges:
            if edge['source'] in node_ids and edge['target'] in node_ids:
                context["edges"].append(edge)
        
        # Generate summary
        if context["nodes"]:
            context["summary"] = {
                "total_nodes": len(context["nodes"]),
                "total_edges": len(context["edges"]),
                "node_types": list(set(n.get('data', {}).get('type', 'unknown') for n in context["nodes"]))
            }
        
        return context
    
    def _generate_analysis(self, query: str, docs: List[Document], connected_nodes: set) -> str:
        """Generate analysis using Google Gemini"""
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-pro",
                google_api_key=self.google_api_key
            )
            
            # Prepare context
            context_text = self._prepare_context_for_llm(docs, connected_nodes)
            
            system_message = SystemMessage(content=f"""You are a pattern analysis expert. Analyze the given query in the context of the provided graph data. 
            Focus on identifying patterns, relationships, and insights that could be valuable for business analysis.
            
            Context: {context_text}
            
            Provide a clear, structured analysis with actionable insights.""")
            
            human_message = HumanMessage(content=f"Please analyze this query: {query}")
            
            response = llm.invoke([system_message, human_message])
            return response.content
            
        except Exception as e:
            return f"Analysis generation failed: {str(e)}"
    
    def _prepare_context_for_llm(self, docs: List[Document], connected_nodes: set) -> str:
        """Prepare context information for the LLM"""
        context_parts = []
        
        # Add document content
        for i, doc in enumerate(docs):
            context_parts.append(f"Document {i+1}: {doc.page_content}")
        
        # Add node information
        for node_id in connected_nodes:
            node = next((n for n in self.nodes if n['id'] == node_id), None)
            if node:
                node_data = node.get('data', {})
                context_parts.append(f"Node {node_id}: {self._extract_node_content(node_data)}")
        
        return "\n\n".join(context_parts)

