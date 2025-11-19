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
        with open(self.json_path, "r", encoding="utf-8") as f:
            obj = json.load(f)

        self.nodes: List[Any] = [make_node_from_json(n) for n in obj["nodes"]]
        self.edges: List[Any] = [make_edge_from_json(e) for e in obj["edges"]]
        print(f"Loaded {len(self.nodes)} nodes and {len(self.edges)} edges")
    
    def _setup_embeddings(self):
        """Setup Google embeddings"""
        # Optional: make sure ADC isn't accidentally used
        os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)

        self.emb = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=self.google_api_key,
        )
    
    def _build_index(self):
        """Build FAISS index from graph data"""
        def node_to_text(n) -> str:
            lbls = n.data.get("labels", [])
            if isinstance(lbls, str):
                lbls = [lbls]
            # pick some common fields
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

        def edge_to_text(e) -> str:
            typ = e.data.get("type", "")
            attrs = {k:v for k,v in e.data.items() if k != "type" and v not in (None,"")}
            return f"Edge {e.source} -[{typ}]-> {e.target} | " + " ".join(f"{k}:{v}" for k,v in attrs.items())

        node_docs = [Document(page_content=node_to_text(n), metadata={"kind":"node","id":n.id,"labels":n.data.get("labels",[])}) for n in self.nodes]
        edge_docs = [Document(page_content=edge_to_text(e), metadata={"kind":"edge","source":e.source,"target":e.target,"type":e.data.get("type","")}) for e in self.edges]

        # Keep metadata simple (no lists/dicts) for the vector store
        def _simple_meta(m):
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

        safe_node_docs = [Document(page_content=d.page_content, metadata=_simple_meta(d.metadata)) for d in node_docs]
        safe_edge_docs = [Document(page_content=d.page_content, metadata=_simple_meta(d.metadata)) for d in edge_docs]
        all_docs = safe_node_docs + safe_edge_docs

        # Build FAISS and a retriever
        self.faiss_index = FAISS.from_documents(all_docs, self.emb)
        self.retriever = self.faiss_index.as_retriever(search_kwargs={"k": 8})
        print(f"Built FAISS index with {len(all_docs)} documents")
    
    def _setup_adjacency(self):
        """Setup graph adjacency structures"""
        Node = LCNode
        Edge = LCEdge

        # --- minimal helpers (kept local) ---
        def _n_id(n): return getattr(n, "id", None) or getattr(n, "name", None) or ""
        def _n_data(n) -> Dict[str, Any]:
            d = getattr(n, "data", None)
            if not isinstance(d, dict) or d is None:
                d = getattr(n, "metadata", {}) or {}
            return d
        def _labels(n):
            lbls = _n_data(n).get("labels", [])
            return [lbls] if isinstance(lbls, str) else (lbls or [])
        def _title(n):
            d = _n_data(n)
            return d.get("title") or d.get("name") or _n_id(n)

        def _e_data(e) -> Dict[str, Any]:
            d = getattr(e, "data", None)
            if not isinstance(d, dict) or d is None:
                d = getattr(e, "metadata", {}) or {}
            return d
        def _src(e): return getattr(e, "source", None) or _e_data(e).get("source", "")
        def _tgt(e): return getattr(e, "target", None)  or _e_data(e).get("target", "")

        # --- build adjacency once ---
        self.by_id = {_n_id(n): n for n in self.nodes}
        self.out_edges = defaultdict(list)
        self.in_edges = defaultdict(list)
        
        for e in self.edges:
            s, t = _src(e), _tgt(e)
            if s and t:
                self.out_edges[s].append(e)
                self.in_edges[t].append(e)
        
        # Store helper functions as instance methods
        self._n_id = _n_id
        self._n_data = _n_data
        self._labels = _labels
        self._title = _title
        self._e_data = _e_data
        self._src = _src
        self._tgt = _tgt

    def expand_neighborhood(self, seed_ids, hops=1, max_nodes=1500):
        """Expand neighborhood from seed nodes"""
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
        """Build summary of subgraph"""
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
                # include a few salient numeric/text attrs if present
                for k in ("industry","industries","cluster_id","type","duration_months","complexity"):
                    if d.get(k) not in (None, "", []):
                        brief[k] = d.get(k)
                lines.append(f"{lab}: " + json.dumps({k:v for k,v in brief.items() if v is not None}, ensure_ascii=False))

        for e in es[:max_edges]:
            et = self._e_data(e).get("type","")
            lines.append(f"EDGE: {self._src(e)} -[{et}]-> {self._tgt(e)}")
        return "\n".join(lines)

    def answer_question(self, query: str, hops: int = 1, k: int = 12, max_nodes: int = 1500, 
                       model: str = "gemini-2.0-flash", temperature: float = 0.0):
        """Answer question using GraphRAG"""
        # 1) retrieve
        local_retriever = self.faiss_index.as_retriever(search_kwargs={"k": k})
        docs = local_retriever.invoke(query)

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
        sub_nodes, sub_edges = self.expand_neighborhood(seed_ids, hops=hops, max_nodes=max_nodes)

        # 4) compact to summary (token-friendly)
        nodes_summary = self.build_summary(sub_nodes, sub_edges)

        # 5) ask Gemini 2.0 Flash
        llm = ChatGoogleGenerativeAI(model=model, google_api_key=self.google_api_key, temperature=temperature)

        sys = SystemMessage(content=(
            "You are an expert strategic assistant to Talan. You are provided with a graph database of historical data "
            "Clusters represent groups of similar challenges. to answer the question, reason over the content of the graph and perform any analysis necessary to uncover hidden patterns and assist decision making"
        ))
        human = HumanMessage(content=f"Subgraph:\n{nodes_summary}\n\nQuestion:\n{query}")
        resp = llm.invoke([sys, human])

        # 6) pretty print + return raw bits if you want to reuse
        print(f"Retrieved docs: {len(docs)}  |  Seeds: {len(seed_ids)}  |  Subgraph: {len(sub_nodes)} nodes / {len(sub_edges)} edges")
        print("\nAnswer:\n", getattr(resp, "content", resp))
        return {"answer": getattr(resp, "content", resp), "sub_nodes": sub_nodes, "sub_edges": sub_edges, "docs": docs}

# For backwards compatibility, create an alias
EnhancedGraphRAG = WorkingGraphRAG
