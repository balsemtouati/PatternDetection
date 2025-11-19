"""
GraphRAG Wrapper - Uses the exact logic from graphRAG.py but in a class format for API integration
"""
import json
from dataclasses import dataclass
from typing import Any, Dict, List
from langchain.docstore.document import Document
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.messages import SystemMessage, HumanMessage
from collections import defaultdict

class GraphRAGWrapper:
    """Wrapper class for the GraphRAG logic from graphRAG.py"""
    
    def __init__(self, google_api_key: str):
        self.google_api_key = google_api_key
        self.json_path = os.path.join(os.path.dirname(__file__), "..", "graphRAG", "case_studies_graph.json")
        
        # Set up the node and edge classes
        self._setup_node_edge_classes()
        
        # Load and process the graph
        self._load_graph()
        
        # Build the FAISS index
        self._build_faiss_index()
        
        # Build adjacency lists
        self._build_adjacency()
        
        print(f"GraphRAG initialized with {len(self.nodes)} nodes and {len(self.edges)} edges")
    
    def _setup_node_edge_classes(self):
        """Set up Node and Edge classes"""
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
        
        self.Node = LCNode
        self.Edge = LCEdge
    
    def _make_node_from_json(self, n: Dict[str, Any]):
        """Convert JSON node to LCNode"""
        raw = n.get("data", {}) or {}
        node_id = n["id"]
        name = raw.get("title") or raw.get("name") or node_id

        try:
            return self.Node(id=node_id, name=name, data=raw, metadata={})
        except TypeError:
            pass
        try:
            return self.Node(id=node_id, data=raw)
        except TypeError:
            pass
        try:
            return self.Node(node_id, raw)
        except TypeError:
            pass
        try:
            return self.Node(name=node_id, metadata=raw)
        except TypeError:
            pass
        return self.Node(id=node_id, name=name, data=raw, metadata={})

    def _make_edge_from_json(self, e: Dict[str, Any]):
        """Convert JSON edge to LCEdge"""
        raw = e.get("data", {}) or {}
        src, tgt = e["source"], e["target"]
        try:
            return self.Edge(source=src, target=tgt, data=raw)
        except TypeError:
            pass
        try:
            return self.Edge(source=src, target=tgt, metadata=raw)
        except TypeError:
            pass
        try:
            return self.Edge(src, tgt, raw)
        except TypeError:
            pass
        return self.Edge(source=src, target=tgt, data=raw, metadata={})
    
    def _load_graph(self):
        """Load the graph from JSON"""
        print(f"Loading graph from: {self.json_path}")
        with open(self.json_path, "r", encoding="utf-8") as f:
            obj = json.load(f)
        
        self.nodes = [self._make_node_from_json(n) for n in obj["nodes"]]
        self.edges = [self._make_edge_from_json(e) for e in obj["edges"]]
        
        print(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} edges")
    
    def _node_to_text(self, n) -> str:
        """Convert node to text representation"""
        lbls = n.data.get("labels", [])
        if isinstance(lbls, str):
            lbls = [lbls]
        parts = [f"Node {n.id}"]
        if "title" in n.data:
            parts.append(f"title: {n.data['title']}")
        if "name" in n.data:
            parts.append(f"name: {n.data['name']}")
        for k, v in n.data.items():
            if k in {"labels","title","name"}:
                continue
            if v is None or v == "":
                continue
            parts.append(f"{k}: {v}")
        return " | ".join(parts)

    def _edge_to_text(self, e) -> str:
        """Convert edge to text representation"""
        typ = e.data.get("type", "")
        attrs = {k:v for k,v in e.data.items() if k != "type" and v not in (None,"")}
        return f"Edge {e.source} -[{typ}]-> {e.target} | " + " ".join(f"{k}:{v}" for k,v in attrs.items())
    
    def _simple_meta(self, m):
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
    
    def _build_faiss_index(self):
        """Build FAISS index from nodes and edges"""
        # Convert nodes and edges to documents
        node_docs = [Document(
            page_content=self._node_to_text(n), 
            metadata={"kind":"node","id":n.id,"labels":n.data.get("labels",[])}
        ) for n in self.nodes]
        
        edge_docs = [Document(
            page_content=self._edge_to_text(e), 
            metadata={"kind":"edge","source":e.source,"target":e.target,"type":e.data.get("type","")}
        ) for e in self.edges]
        
        # Simplify metadata
        safe_node_docs = [Document(page_content=d.page_content, metadata=self._simple_meta(d.metadata)) for d in node_docs]
        safe_edge_docs = [Document(page_content=d.page_content, metadata=self._simple_meta(d.metadata)) for d in edge_docs]
        all_docs = safe_node_docs + safe_edge_docs
        
        # Create embeddings
        os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
        emb = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=self.google_api_key,
        )
        
        # Build FAISS index
        self.faiss_index = FAISS.from_documents(all_docs, emb)
        print(f"Built FAISS index with {len(all_docs)} documents")
    
    def _build_adjacency(self):
        """Build adjacency lists for graph traversal"""
        def _n_id(n): return getattr(n, "id", None) or getattr(n, "name", None) or ""
        def _src(e): return getattr(e, "source", None) or getattr(e, "data", {}).get("source", "")
        def _tgt(e): return getattr(e, "target", None) or getattr(e, "data", {}).get("target", "")
        
        self.by_id = {_n_id(n): n for n in self.nodes}
        self.out_edges = defaultdict(list)
        self.in_edges = defaultdict(list)
        
        for e in self.edges:
            s, t = _src(e), _tgt(e)
            if s and t:
                self.out_edges[s].append(e)
                self.in_edges[t].append(e)
    
    def _expand_neighborhood(self, seed_ids, hops=1, max_nodes=1500):
        """Expand from seed nodes to their neighborhood"""
        def _src(e): return getattr(e, "source", None) or getattr(e, "data", {}).get("source", "")
        def _tgt(e): return getattr(e, "target", None) or getattr(e, "data", {}).get("target", "")
        
        seen = set(seed_ids)
        frontier = set(seed_ids)
        
        for _ in range(hops):
            new_nodes = set()
            for nid in frontier:
                for e in self.out_edges.get(nid, []) + self.in_edges.get(nid, []):
                    if _src(e): new_nodes.add(_src(e))
                    if _tgt(e): new_nodes.add(_tgt(e))
            frontier = new_nodes - seen
            seen |= new_nodes
            if len(seen) >= max_nodes:
                break
        
        sub_nodes = [self.by_id[i] for i in seen if i in self.by_id]
        sub_edges = [e for e in self.edges if _src(e) in seen and _tgt(e) in seen]
        return sub_nodes, sub_edges
    
    def _build_summary(self, ns: List[Any], es: List[Any], max_per_label=25, max_edges=400) -> str:
        """Build summary of nodes and edges"""
        def _n_id(n): return getattr(n, "id", None) or getattr(n, "name", None) or ""
        def _n_data(n): 
            d = getattr(n, "data", None)
            if not isinstance(d, dict) or d is None:
                d = getattr(n, "metadata", {}) or {}
            return d
        def _labels(n):
            lbls = _n_data(n).get("labels", [])
            return [lbls] if isinstance(lbls, str) else (lbls or [])
        def _src(e): return getattr(e, "source", None) or getattr(e, "data", {}).get("source", "")
        def _tgt(e): return getattr(e, "target", None) or getattr(e, "data", {}).get("target", "")
        def _e_data(e):
            d = getattr(e, "data", None)
            if not isinstance(d, dict) or d is None:
                d = getattr(e, "metadata", {}) or {}
            return d
        
        buckets = defaultdict(list)
        for n in ns:
            labs = _labels(n) or ["Node"]
            for lab in labs:
                buckets[lab].append(n)

        lines = []
        for lab, items in buckets.items():
            for n in items[:max_per_label]:
                d = _n_data(n)
                brief = {
                    "id": _n_id(n),
                    "title": d.get("title"),
                    "name": d.get("name"),
                }
                for k in ("industry","industries","cluster_id","type","duration_months","complexity"):
                    if d.get(k) not in (None, "", []):
                        brief[k] = d.get(k)
                lines.append(f"{lab}: " + json.dumps({k:v for k,v in brief.items() if v is not None}, ensure_ascii=False))

        for e in es[:max_edges]:
            et = _e_data(e).get("type","")
            lines.append(f"EDGE: {_src(e)} -[{et}]-> {_tgt(e)}")
        return "\n".join(lines)
    
    def answer_question(self, query: str, hops: int = 1, k: int = 12, max_nodes: int = 1500, 
                       model: str = "gemini-2.0-flash", temperature: float = 0.0):
        """Answer a question using GraphRAG approach"""
        # 1) retrieve
        retriever = self.faiss_index.as_retriever(search_kwargs={"k": k})
        docs = retriever.invoke(query)

        # 2) seed IDs from node docs + edge docs
        seed_ids = set()
        for d in docs:
            kind = d.metadata.get("kind")
            if kind == "node" and "id" in d.metadata:
                seed_ids.add(d.metadata["id"])
            elif kind == "edge":
                if "source" in d.metadata: seed_ids.add(d.metadata["source"])
                if "target" in d.metadata: seed_ids.add(d.metadata["target"])

        # fallback: parse edge strings if needed
        if not seed_ids:
            for d in docs:
                if d.metadata.get("kind") == "edge":
                    txt = d.page_content
                    try:
                        s = txt.split("Edge ",1)[1].split(" -[",1)[0]
                        t = txt.split("]-> ",1)[1].split(" | ",1)[0]
                        seed_ids.update([s,t])
                    except Exception:
                        pass

        # 3) expand to neighborhood
        sub_nodes, sub_edges = self._expand_neighborhood(seed_ids, hops=hops, max_nodes=max_nodes)

        # 4) compact to summary (token-friendly)
        nodes_summary = self._build_summary(sub_nodes, sub_edges)

        # 5) ask Gemini
        llm = ChatGoogleGenerativeAI(model=model, google_api_key=self.google_api_key, temperature=temperature)

        sys = SystemMessage(content=(
            "You are an expert strategic consultant at Talan. Analyze the graph database to provide beautiful, "
            "comprehensive insights. Format your response as follows:\n\n"
            "# 🎯 Strategic Analysis & Recommendations\n\n"
            "## 📊 **Analysis Overview**\n"
            "[Provide a brief summary of what you found]\n\n"
            "## 🔍 **Detailed Findings**\n\n"
            "### 🏢 **Projects Identified:**\n\n"
            "For each project, use this format:\n"
            "**🚀 [Project Name]**\n"
            "- **Challenge:** [Challenge description]\n"
            "- **Industry:** [Industry context]\n"
            "- **Technology:** [Technology used]\n"
            "- **Impact:** [Business impact]\n\n"
            "## 💡 **Key Insights & Patterns**\n"
            "[Highlight important patterns and insights]\n\n"
            "## 🎯 **Strategic Recommendations**\n"
            "[Provide actionable recommendations based on the analysis]\n\n"
            "Use emojis, clear formatting, and make it visually engaging. Focus on practical business value."
        ))
        human = HumanMessage(content=f"Subgraph:\n{nodes_summary}\n\nQuestion:\n{query}")
        resp = llm.invoke([sys, human])

        # 6) return result
        answer_text = getattr(resp, "content", resp)
        print(f"Retrieved docs: {len(docs)}  |  Seeds: {len(seed_ids)}  |  Subgraph: {len(sub_nodes)} nodes / {len(sub_edges)} edges")
        
        return {
            "answer": answer_text,
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
