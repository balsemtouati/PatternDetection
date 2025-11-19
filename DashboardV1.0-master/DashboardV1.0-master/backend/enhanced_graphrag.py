"""
Enhanced GraphRAG implementation using Google Gemini
Based on the working tempTesti.py implementation
"""
import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple
from collections import defaultdict
import logging

from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

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

class EnhancedGraphRAG:
    """Enhanced GraphRAG implementation using Google Gemini and FAISS"""
    
    def __init__(self, json_path: str, google_api_key: str = None):
        """Initialize the GraphRAG system"""
        self.json_path = json_path
        self.google_api_key = google_api_key or os.getenv('GOOGLE_API_KEY', 'AIzaSyA1CTxhgunnghEmp-0YQiqy1Hdz615ymV0')
        
        # Initialize components
        self.nodes = []
        self.edges = []
        self.by_id = {}
        self.out_edges = defaultdict(list)
        self.in_edges = defaultdict(list)
        self.faiss_index = None
        self.retriever = None
        
        # Load and setup
        self._load_graph()
        self._setup_embeddings()
        self._build_vector_store()
        
        logger.info(f"Enhanced GraphRAG initialized with {len(self.nodes)} nodes and {len(self.edges)} edges")
    
    def _make_node_from_json(self, n: Dict[str, Any]) -> LCNode:
        """Create a node from JSON data"""
        raw = n.get("data", {}) or {}
        node_id = n["id"]
        name = raw.get("title") or raw.get("name") or node_id
        return LCNode(id=node_id, name=name, data=raw, metadata={})
    
    def _make_edge_from_json(self, e: Dict[str, Any]) -> LCEdge:
        """Create an edge from JSON data"""
        raw = e.get("data", {}) or {}
        src, tgt = e["source"], e["target"]
        return LCEdge(source=src, target=tgt, data=raw, metadata={})
    
    def _load_graph(self):
        """Load graph data from JSON file"""
        try:
            with open(self.json_path, "r", encoding="utf-8") as f:
                obj = json.load(f)
            
            self.nodes = [self._make_node_from_json(n) for n in obj["nodes"]]
            self.edges = [self._make_edge_from_json(e) for e in obj["edges"]]
            
            # Build adjacency maps
            self.by_id = {self._n_id(n): n for n in self.nodes}
            for e in self.edges:
                s, t = self._src(e), self._tgt(e)
                if s and t:
                    self.out_edges[s].append(e)
                    self.in_edges[t].append(e)
            
            logger.info(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} edges from {self.json_path}")
            
        except Exception as e:
            logger.error(f"Failed to load graph: {e}")
            raise
    
    def _setup_embeddings(self):
        """Setup Google Embeddings"""
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self.google_api_key,
            )
            logger.info("Google embeddings initialized successfully")
        except Exception as e:
            logger.error(f"Failed to setup embeddings: {e}")
            raise
    
    def _build_vector_store(self):
        """Build FAISS vector store from graph data"""
        try:
            # Convert nodes and edges to documents
            node_docs = [
                Document(
                    page_content=self._node_to_text(n),
                    metadata=self._simple_meta({
                        "kind": "node",
                        "id": self._n_id(n),
                        "labels": self._labels(n)
                    })
                ) for n in self.nodes
            ]
            
            edge_docs = [
                Document(
                    page_content=self._edge_to_text(e),
                    metadata=self._simple_meta({
                        "kind": "edge",
                        "source": self._src(e),
                        "target": self._tgt(e),
                        "type": self._e_data(e).get("type", "")
                    })
                ) for e in self.edges
            ]
            
            all_docs = node_docs + edge_docs
            
            # Build FAISS index
            self.faiss_index = FAISS.from_documents(all_docs, self.embeddings)
            self.retriever = self.faiss_index.as_retriever(search_kwargs={"k": 12})
            
            logger.info(f"Built FAISS index with {len(all_docs)} documents")
            
        except Exception as e:
            logger.error(f"Failed to build vector store: {e}")
            raise
    
    def _node_to_text(self, n: LCNode) -> str:
        """Convert node to text representation"""
        parts = [f"Node {self._n_id(n)}"]
        data = self._n_data(n)
        
        if "title" in data:
            parts.append(f"title: {data['title']}")
        if "name" in data:
            parts.append(f"name: {data['name']}")
        
        for k, v in data.items():
            if k in {"labels", "title", "name"} or v is None or v == "":
                continue
            parts.append(f"{k}: {v}")
        
        return " | ".join(parts)
    
    def _edge_to_text(self, e: LCEdge) -> str:
        """Convert edge to text representation"""
        typ = self._e_data(e).get("type", "")
        attrs = {k: v for k, v in self._e_data(e).items() if k != "type" and v not in (None, "")}
        attr_str = " ".join(f"{k}:{v}" for k, v in attrs.items())
        return f"Edge {self._src(e)} -[{typ}]-> {self._tgt(e)} | {attr_str}"
    
    def _simple_meta(self, m: Dict) -> Dict:
        """Simplify metadata for vector store"""
        out = {}
        for k, v in (m or {}).items():
            if isinstance(v, (str, int, float, bool)) or v is None:
                out[k] = v
            elif isinstance(v, (list, tuple)):
                out[k] = ", ".join(map(str, v))
            elif isinstance(v, dict):
                out[k] = json.dumps(v, ensure_ascii=False)
            else:
                out[k] = str(v)
        return out
    
    # Helper methods for accessing node/edge properties
    def _n_id(self, n): return getattr(n, "id", None) or getattr(n, "name", None) or ""
    def _n_data(self, n) -> Dict[str, Any]:
        d = getattr(n, "data", None)
        if not isinstance(d, dict) or d is None:
            d = getattr(n, "metadata", {}) or {}
        return d
    def _labels(self, n):
        lbls = self._n_data(n).get("labels", [])
        return [lbls] if isinstance(lbls, str) else (lbls or [])
    def _title(self, n):
        d = self._n_data(n)
        return d.get("title") or d.get("name") or self._n_id(n)
    
    def _e_data(self, e) -> Dict[str, Any]:
        d = getattr(e, "data", None)
        if not isinstance(d, dict) or d is None:
            d = getattr(e, "metadata", {}) or {}
        return d
    def _src(self, e): return getattr(e, "source", None) or self._e_data(e).get("source", "")
    def _tgt(self, e): return getattr(e, "target", None) or self._e_data(e).get("target", "")
    
    def expand_neighborhood(self, seed_ids, hops=1, max_nodes=1500):
        """Expand neighborhood around seed nodes"""
        seen = set(seed_ids)
        frontier = set(seed_ids)
        
        for _ in range(hops):
            new_nodes = set()
            for nid in frontier:
                for e in self.out_edges.get(nid, []) + self.in_edges.get(nid, []):
                    if self._src(e): new_nodes.add(self._src(e))
                    if self._tgt(e): new_nodes.add(self._tgt(e))
            frontier = new_nodes - seen
            seen |= new_nodes
            if len(seen) >= max_nodes:
                break
        
        sub_nodes = [self.by_id[i] for i in seen if i in self.by_id]
        sub_edges = [e for e in self.edges if self._src(e) in seen and self._tgt(e) in seen]
        return sub_nodes, sub_edges
    
    def build_summary(self, ns: List[Any], es: List[Any], max_per_label=25, max_edges=400) -> str:
        """Build a compact summary of nodes and edges"""
        buckets = defaultdict(list)
        for n in ns:
            labs = self._labels(n) or ["Node"]
            for lab in labs:
                buckets[lab].append(n)
        
        lines = []
        for lab, items in buckets.items():
            for n in items[:max_per_label]:
                d = self._n_data(n)
                brief = {
                    "id": self._n_id(n),
                    "title": d.get("title"),
                    "name": d.get("name"),
                }
                # Include salient attributes
                for k in ("industry", "industries", "cluster_id", "type", "duration_months", "complexity"):
                    if d.get(k) not in (None, "", []):
                        brief[k] = d.get(k)
                lines.append(f"{lab}: " + json.dumps({k: v for k, v in brief.items() if v is not None}, ensure_ascii=False))
        
        for e in es[:max_edges]:
            et = self._e_data(e).get("type", "")
            lines.append(f"EDGE: {self._src(e)} -[{et}]-> {self._tgt(e)}")
        
        return "\n".join(lines)
    
    def answer_question(self, query: str, hops: int = 1, k: int = 12, max_nodes: int = 1500, 
                       model: str = "gemini-2.0-flash-exp", temperature: float = 0.0):
        """Answer a question using GraphRAG"""
        try:
            # 1) Retrieve relevant documents
            local_retriever = self.faiss_index.as_retriever(search_kwargs={"k": k})
            docs = local_retriever.invoke(query)
            
            # 2) Extract seed IDs from retrieved documents
            seed_ids = set()
            for d in docs:
                kind = d.metadata.get("kind")
                if kind == "node" and "id" in d.metadata:
                    seed_ids.add(d.metadata["id"])
                elif kind == "edge":
                    if "source" in d.metadata: seed_ids.add(d.metadata["source"])
                    if "target" in d.metadata: seed_ids.add(d.metadata["target"])
            
            # Fallback: parse edge strings if needed
            if not seed_ids:
                for d in docs:
                    if d.metadata.get("kind") == "edge":
                        txt = d.page_content
                        try:
                            s = txt.split("Edge ", 1)[1].split(" -[", 1)[0]
                            t = txt.split("]-> ", 1)[1].split(" | ", 1)[0]
                            seed_ids.update([s, t])
                        except Exception:
                            pass
            
            # 3) Expand to neighborhood
            sub_nodes, sub_edges = self.expand_neighborhood(seed_ids, hops=hops, max_nodes=max_nodes)
            
            # 4) Build compact summary
            nodes_summary = self.build_summary(sub_nodes, sub_edges)
            
            # 5) Ask Gemini
            llm = ChatGoogleGenerativeAI(
                model=model, 
                google_api_key=self.google_api_key, 
                temperature=temperature
            )
            
            sys = SystemMessage(content=(
                "You are an expert strategic assistant to Talan. You are provided with a graph database of historical data. "
                "Clusters represent groups of similar challenges. To answer the question, reason over the content of the graph "
                "and perform any analysis necessary to uncover hidden patterns and assist decision making. "
                "Provide detailed, actionable insights based on the data."
            ))
            
            human = HumanMessage(content=f"Subgraph:\n{nodes_summary}\n\nQuestion:\n{query}")
            resp = llm.invoke([sys, human])
            
            answer = getattr(resp, "content", str(resp))
            
            logger.info(f"GraphRAG query processed: {len(docs)} docs, {len(seed_ids)} seeds, {len(sub_nodes)} nodes")
            
            return {
                "answer": answer,
                "metadata": {
                    "retrieved_docs": len(docs),
                    "seed_ids": len(seed_ids),
                    "subgraph_nodes": len(sub_nodes),
                    "subgraph_edges": len(sub_edges)
                }
            }
            
        except Exception as e:
            logger.error(f"GraphRAG query failed: {e}")
            return {
                "answer": f"Error processing query: {str(e)}",
                "metadata": {"error": True}
            }

# For compatibility with existing code
class GraphRAGFromJSON(EnhancedGraphRAG):
    """Compatibility wrapper for the enhanced GraphRAG"""
    
    def query(self, question: str, context: str = "") -> Dict[str, Any]:
        """Query method for compatibility with existing API"""
        try:
            result = self.answer_question(question)
            return {
                "analysis": result["answer"],
                "patterns": [],  # Enhanced patterns could be added here
                "metadata": result["metadata"],
                "success": True
            }
        except Exception as e:
            logger.error(f"GraphRAG query error: {e}")
            return {
                "analysis": f"Error: {str(e)}",
                "patterns": [],
                "metadata": {"error": True},
                "success": False
            }
