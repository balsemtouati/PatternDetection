"""
GraphRAG Pattern Analyzer using the exact notebook approach
This implementation follows the notebook logic exactly for compatibility
"""

import json
import os
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple
from collections import defaultdict

# LangChain imports
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from langchain_core.messages import SystemMessage, HumanMessage

# Setup logging
logging.basicConfig(level=logging.INFO)
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

class NotebookGraphRAGAnalyzer:
    """GraphRAG Pattern Analyzer using exact notebook approach"""
    
    def __init__(self, google_api_key: str, json_path: str):
        self.google_api_key = google_api_key
        self.json_path = json_path
        self.nodes = []
        self.edges = []
        self.by_id = {}
        self.out_edges = defaultdict(list)
        self.in_edges = defaultdict(list)
        self.faiss_index = None
        self.retriever = None
        
        # Load graph and initialize
        self._load_graph_from_json()
        self._build_documents()
        self._create_vector_store()
        self._build_adjacency()
        
        logger.info(f"✅ Notebook GraphRAG initialized with {len(self.nodes)} nodes, {len(self.edges)} edges")
    
    def make_node_from_json(self, n: Dict[str, Any]) -> LCNode:
        """Create node from JSON following notebook approach"""
        raw = n.get("data", {}) or {}
        node_id = n["id"]
        name = raw.get("title") or raw.get("name") or node_id
        return LCNode(id=node_id, name=name, data=raw, metadata={})
    
    def make_edge_from_json(self, e: Dict[str, Any]) -> LCEdge:
        """Create edge from JSON following notebook approach"""
        raw = e.get("data", {}) or {}
        src, tgt = e["source"], e["target"]
        return LCEdge(source=src, target=tgt, data=raw)
    
    def _load_graph_from_json(self):
        """Load JSON graph exactly like notebook"""
        logger.info(f"Loading graph from {self.json_path}")
        
        with open(self.json_path, "r", encoding="utf-8") as f:
            obj = json.load(f)
        
        self.nodes = [self.make_node_from_json(n) for n in obj["nodes"]]
        self.edges = [self.make_edge_from_json(e) for e in obj["edges"]]
        
        logger.info(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} edges from JSON")
    
    def node_to_text(self, n: LCNode) -> str:
        """Convert node to text like notebook"""
        lbls = n.data.get("labels", [])
        if isinstance(lbls, str):
            lbls = [lbls]
        
        parts = [f"Node {n.id}"]
        if "title" in n.data:
            parts.append(f"title: {n.data['title']}")
        if "name" in n.data:
            parts.append(f"name: {n.data['name']}")
        
        for k, v in n.data.items():
            if k in {"labels", "title", "name"}:
                continue
            if v is None or v == "":
                continue
            parts.append(f"{k}: {v}")
        
        return " | ".join(parts)
    
    def edge_to_text(self, e: LCEdge) -> str:
        """Convert edge to text like notebook"""
        typ = e.data.get("type", "")
        attrs = {k: v for k, v in e.data.items() if k != "type" and v not in (None, "")}
        return f"Edge {e.source} -[{typ}]-> {e.target} | " + " ".join(f"{k}:{v}" for k, v in attrs.items())
    
    def _build_documents(self):
        """Build documents for vector store like notebook"""
        node_docs = [
            Document(
                page_content=self.node_to_text(n),
                metadata={
                    "kind": "node",
                    "id": n.id,
                    "labels": ", ".join(n.data.get("labels", []) if isinstance(n.data.get("labels", []), list) else [n.data.get("labels", "")])
                }
            ) for n in self.nodes
        ]
        
        edge_docs = [
            Document(
                page_content=self.edge_to_text(e),
                metadata={
                    "kind": "edge",
                    "source": e.source,
                    "target": e.target,
                    "type": e.data.get("type", "")
                }
            ) for e in self.edges
        ]
        
        self.all_docs = node_docs + edge_docs
        logger.info(f"Built {len(node_docs)} node docs and {len(edge_docs)} edge docs")
    
    def _create_vector_store(self):
        """Create FAISS vector store like notebook"""
        # Remove any Google credentials that might interfere
        os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
        
        emb = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=self.google_api_key,
        )
        
        # Build FAISS index
        self.faiss_index = FAISS.from_documents(self.all_docs, emb)
        self.retriever = self.faiss_index.as_retriever(search_kwargs={"k": 12})
        
        logger.info("✅ Created FAISS vector store")
    
    def _n_id(self, n): 
        """Get node ID like notebook"""
        return getattr(n, "id", None) or getattr(n, "name", None) or ""
    
    def _n_data(self, n) -> Dict[str, Any]:
        """Get node data like notebook"""
        d = getattr(n, "data", None)
        if not isinstance(d, dict) or d is None:
            d = getattr(n, "metadata", {}) or {}
        return d
    
    def _labels(self, n):
        """Get node labels like notebook"""
        lbls = self._n_data(n).get("labels", [])
        return [lbls] if isinstance(lbls, str) else (lbls or [])
    
    def _title(self, n):
        """Get node title like notebook"""
        d = self._n_data(n)
        return d.get("title") or d.get("name") or self._n_id(n)
    
    def _e_data(self, e) -> Dict[str, Any]:
        """Get edge data like notebook"""
        d = getattr(e, "data", None)
        if not isinstance(d, dict) or d is None:
            d = getattr(e, "metadata", {}) or {}
        return d
    
    def _src(self, e): 
        """Get edge source like notebook"""
        return getattr(e, "source", None) or self._e_data(e).get("source", "")
    
    def _tgt(self, e): 
        """Get edge target like notebook"""
        return getattr(e, "target", None) or self._e_data(e).get("target", "")
    
    def _build_adjacency(self):
        """Build adjacency lists like notebook"""
        self.by_id = {self._n_id(n): n for n in self.nodes}
        self.out_edges = defaultdict(list)
        self.in_edges = defaultdict(list)
        
        for e in self.edges:
            s, t = self._src(e), self._tgt(e)
            if s and t:
                self.out_edges[s].append(e)
                self.in_edges[t].append(e)
        
        logger.info("✅ Built adjacency lists")
    
    def expand_neighborhood(self, seed_ids, hops=1, max_nodes=1500):
        """Expand neighborhood exactly like notebook"""
        seen = set(seed_ids)
        frontier = set(seed_ids)
        
        for _ in range(hops):
            new_nodes = set()
            for nid in frontier:
                for e in self.out_edges.get(nid, []) + self.in_edges.get(nid, []):
                    if self._src(e): 
                        new_nodes.add(self._src(e))
                    if self._tgt(e): 
                        new_nodes.add(self._tgt(e))
            frontier = new_nodes - seen
            seen |= new_nodes
            if len(seen) >= max_nodes:
                break
        
        sub_nodes = [self.by_id[i] for i in seen if i in self.by_id]
        sub_edges = [e for e in self.edges if self._src(e) in seen and self._tgt(e) in seen]
        return sub_nodes, sub_edges
    
    def build_summary(self, ns: List[Any], es: List[Any], max_per_label=25, max_edges=400) -> str:
        """Build summary exactly like notebook"""
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
                       model: str = "gemini-2.0-flash", temperature: float = 0.0):
        """Answer question exactly like notebook"""
        
        # 1) Retrieve
        local_retriever = self.faiss_index.as_retriever(search_kwargs={"k": k})
        docs = local_retriever.invoke(query)
        
        # 2) Seed IDs from node docs + edge docs
        seed_ids = set()
        for d in docs:
            kind = d.metadata.get("kind")
            if kind == "node" and "id" in d.metadata:
                seed_ids.add(d.metadata["id"])
            elif kind == "edge":
                if "source" in d.metadata: 
                    seed_ids.add(d.metadata["source"])
                if "target" in d.metadata: 
                    seed_ids.add(d.metadata["target"])
        
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
        
        # 4) Compact to summary (token-friendly)
        nodes_summary = self.build_summary(sub_nodes, sub_edges)
        
        # 5) Ask Gemini exactly like notebook
        llm = ChatGoogleGenerativeAI(model=model, google_api_key=self.google_api_key, temperature=temperature)
        
        sys = SystemMessage(content=(
            "You are an expert strategic assistant to Talan. You are provided with a graph database of historical data "
            "Clusters represent groups of similar challenges. to answer the question, reason over the content of the graph and perform any analysis necessary to uncover hidden patterns and assist decision making"
        ))
        human = HumanMessage(content=f"Subgraph:\n{nodes_summary}\n\nQuestion:\n{query}")
        resp = llm.invoke([sys, human])
        
        # 6) Return results
        answer = getattr(resp, "content", resp)
        
        logger.info(f"Retrieved docs: {len(docs)}  |  Seeds: {len(seed_ids)}  |  Subgraph: {len(sub_nodes)} nodes / {len(sub_edges)} edges")
        logger.info(f"Answer generated with {len(answer)} characters")
        
        return {
            "answer": answer,
            "sub_nodes": sub_nodes,
            "sub_edges": sub_edges,
            "docs": docs,
            "metadata": {
                "retrieved_docs": len(docs),
                "seed_count": len(seed_ids),
                "subgraph_nodes": len(sub_nodes),
                "subgraph_edges": len(sub_edges)
            }
        }
