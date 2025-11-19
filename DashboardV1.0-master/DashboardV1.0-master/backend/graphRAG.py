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


json_path = os.path.join(os.path.dirname(__file__), "..", "graphRAG", "case_studies_graph.json")
print("Using:", json_path)
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

# ---- Load your JSON graph
with open(json_path, "r", encoding="utf-8") as f:
    obj = json.load(f)

nodes: List[Any] = [make_node_from_json(n) for n in obj["nodes"]]
edges: List[Any] = [make_edge_from_json(e) for e in obj["edges"]]

len(nodes), len(edges)
Node = LCNode
Edge = LCEdge

def node_to_text(n: Node) -> str:
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

def edge_to_text(e: Edge) -> str:
    typ = e.data.get("type", "")
    attrs = {k:v for k,v in e.data.items() if k != "type" and v not in (None,"")}
    return f"Edge {e.source} -[{typ}]-> {e.target} | " + " ".join(f"{k}:{v}" for k,v in attrs.items())

node_docs = [Document(page_content=node_to_text(n), metadata={"kind":"node","id":n.id,"labels":n.data.get("labels",[])}) for n in nodes]
edge_docs = [Document(page_content=edge_to_text(e), metadata={"kind":"edge","source":e.source,"target":e.target,"type":e.data.get("type","")}) for e in edges]

len(node_docs), len(edge_docs), node_docs[0].page_content[:200]

# ✅ 2) Provide your key explicitly to the embeddings class
GOOGLE_API_KEY = "AIzaSyA1CTxhgunnghEmp-0YQiqy1Hdz615ymV0"  # <-- put your key here or use os.getenv("GOOGLE_API_KEY")
assert GOOGLE_API_KEY, "Set GOOGLE_API_KEY (string)."

# Optional: make sure ADC isn’t accidentally used
os.environ.pop("GOOGLE_APPLICATION_CREDENTIALS", None)

emb = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=GOOGLE_API_KEY,
)

# ✅ 3) Keep metadata simple (no lists/dicts) for the vector store
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

# ✅ 4) Build FAISS and a retriever
faiss_index = FAISS.from_documents(all_docs, emb)
retriever = faiss_index.as_retriever(search_kwargs={"k": 8})

# (optional) persist / reload
faiss_index.save_local("faiss_graph")
# reload example:
# faiss_index = FAISS.load_local("faiss_graph", emb, allow_dangerous_deserialization=True)


# Use the FAISS index you built earlier
retriever = faiss_index.as_retriever(search_kwargs={"k": 8})

# --- Robust accessors (handle different langchain-core versions) ---
def node_key(n):
    # Prefer .id; fall back to .name
    return getattr(n, "id", None) or getattr(n, "name", None)

def edge_src(e):
    return getattr(e, "source", None) or getattr(e, "src", None) or getattr(e, "start", None) or (getattr(e, "data", {}) or getattr(e, "metadata", {})).get("source")

def edge_tgt(e):
    return getattr(e, "target", None) or getattr(e, "dst", None) or getattr(e, "end", None) or (getattr(e, "data", {}) or getattr(e, "metadata", {})).get("target")

# Index nodes by key
by_id = {node_key(n): n for n in nodes if node_key(n) is not None}

# Build adjacency
out_edges = defaultdict(list)
in_edges = defaultdict(list)
for e in edges:
    s, t = edge_src(e), edge_tgt(e)
    if s is None or t is None:
        continue
    out_edges[s].append(e)
    in_edges[t].append(e)

def expand_neighborhood(hit_ids, hops=1):
    seen_nodes = set(hit_ids)
    frontier = set(hit_ids)
    for _ in range(hops):
        new_nodes = set()
        for nid in list(frontier):
            for e in out_edges.get(nid, []) + in_edges.get(nid, []):
                s, t = edge_src(e), edge_tgt(e)
                if s: new_nodes.add(s)
                if t: new_nodes.add(t)
        frontier = new_nodes - seen_nodes
        seen_nodes |= new_nodes
    sub_nodes = [by_id[i] for i in seen_nodes if i in by_id]
    sub_edges = [e for e in edges if edge_src(e) in seen_nodes and edge_tgt(e) in seen_nodes]
    return sub_nodes, sub_edges


os.environ["GOOGLE_API_KEY"] = "AIzaSyCnaRwNyRqbE8D9xZTlNFejmk-6peYhHXU"


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
by_id = {_n_id(n): n for n in nodes}
out_edges = defaultdict(list); in_edges = defaultdict(list)
for e in edges:
    s, t = _src(e), _tgt(e)
    if s and t:
        out_edges[s].append(e); in_edges[t].append(e)

def expand_neighborhood(seed_ids, hops=1, max_nodes=1500):
    seen = set(seed_ids); frontier = set(seed_ids)
    for _ in range(hops):
        new_nodes = set()
        for nid in frontier:
            for e in out_edges.get(nid, []) + in_edges.get(nid, []):
                if _src(e): new_nodes.add(_src(e))
                if _tgt(e): new_nodes.add(_tgt(e))
        frontier = new_nodes - seen
        seen |= new_nodes
        if len(seen) >= max_nodes:
            break
    sub_nodes = [by_id[i] for i in seen if i in by_id]
    sub_edges = [e for e in edges if _src(e) in seen and _tgt(e) in seen]
    return sub_nodes, sub_edges

def build_summary(ns: List[Any], es: List[Any], max_per_label=25, max_edges=400) -> str:
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
            # include a few salient numeric/text attrs if present
            for k in ("industry","industries","cluster_id","type","duration_months","complexity"):
                if d.get(k) not in (None, "", []):
                    brief[k] = d.get(k)
            lines.append(f"{lab}: " + json.dumps({k:v for k,v in brief.items() if v is not None}, ensure_ascii=False))

    for e in es[:max_edges]:
        et = _e_data(e).get("type","")
        lines.append(f"EDGE: {_src(e)} -[{et}]-> {_tgt(e)}")
    return "\n".join(lines)

# --- build a generic GraphRAG answerer ---
retriever = faiss_index.as_retriever(search_kwargs={"k": 12})  # bump k a bit

def answer_question(
    query: str,
    hops: int = 1,
    k: int = 12,
    max_nodes: int = 1500,
    model: str = "gemini-2.0-flash",
    temperature: float = 0.0,
):
    # 1) retrieve
    local_retriever = faiss_index.as_retriever(search_kwargs={"k": k})
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
    sub_nodes, sub_edges = expand_neighborhood(seed_ids, hops=hops, max_nodes=max_nodes)

    # 4) compact to summary (token-friendly)
    nodes_summary = build_summary(sub_nodes, sub_edges)

    # 5) ask Gemini 2.0 Flash
    api_key = os.getenv("GOOGLE_API_KEY", "AIzaSyASgbjsK530ZrtX7wqVTPY1Lblcg2YBzQ8")
    assert api_key, "Please set env var GOOGLE_API_KEY."
    llm = ChatGoogleGenerativeAI(model=model, google_api_key=api_key, temperature=temperature)

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

# ---- Example usage (works for ANY question) ----
result = answer_question("Which projects in the Food Industry used SAP and what challenges were resolved?", hops=1, k=12)
#result = answer_question("I have a new client who is suffering from aging sap system. what should i do")
print(result.answer)
#result = answer_question("Which departments correlate with high productivity scores across projects?", hops=2)