"""
Pandas-free GraphRAG Pattern Analyzer
Advanced pattern detection without pandas dependency
"""

import json
import os
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
import networkx as nx

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# External dependencies
try:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    from langchain_community.vectorstores import FAISS
    from langchain.docstore.document import Document
    from langchain_core.messages import SystemMessage, HumanMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("⚠️ LangChain dependencies not available")

logger = logging.getLogger(__name__)

@dataclass
class GraphNode:
    """Represents a node in the business graph"""
    id: str
    type: str  # project, employee, client, industry, department
    properties: Dict[str, Any]

@dataclass
class GraphEdge:
    """Represents an edge in the business graph"""
    source: str
    target: str
    type: str  # belongs_to, works_in, assigned_to
    properties: Dict[str, Any]

class PandasFreeGraphRAGAnalyzer:
    """
    GraphRAG Pattern Analyzer without pandas dependency
    Processes business data using graph representation and LLM analysis
    """
    
    def __init__(self, google_api_key: Optional[str] = None, knowledge_graph_path: Optional[str] = None):
        """Initialize the GraphRAG analyzer"""
        
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        
        if not self.google_api_key:
            raise ValueError("Google API key is required. Set GOOGLE_API_KEY environment variable.")
        
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain dependencies are required for GraphRAG analysis")
        
        # Initialize LangChain components
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=self.google_api_key
        )
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=self.google_api_key,
            temperature=0.1
        )
        
        # Graph and vector store
        self.graph = None
        self.vector_store = None
        self.documents = []
        
        # Knowledge graph path - default to the existing graph JSON file
        self.knowledge_graph_path = knowledge_graph_path or os.path.join(
            os.path.dirname(__file__), '..', 'graphRAG', 'case_studies_graph.json'
        )
        
        # Load existing knowledge graph if available
        self.existing_graph_nodes = []
        self.existing_graph_edges = []
        self._load_existing_knowledge_graph()
        
        logger.info("GraphRAG Pattern Analyzer initialized successfully")
    
    def _load_existing_knowledge_graph(self):
        """Load existing knowledge graph from JSON file (664 nodes, 1703 edges)"""
        try:
            if os.path.exists(self.knowledge_graph_path):
                logger.info(f"Loading existing knowledge graph from {self.knowledge_graph_path}")
                
                with open(self.knowledge_graph_path, 'r', encoding='utf-8') as f:
                    graph_data = json.load(f)
                
                # Extract edges from JSON (like in the notebook)
                edges = graph_data.get('edges', [])
                logger.info(f"Found {len(edges)} edges in the graph")
                
                # Extract unique nodes from edges (following notebook logic)
                nodes_set = set()
                for edge in edges:
                    nodes_set.add(edge['source'])
                    nodes_set.add(edge['target'])
                
                logger.info(f"Extracted {len(nodes_set)} unique nodes from edges")
                
                # Create GraphNode objects for each unique node
                for node_id in nodes_set:
                    # Determine node type from ID (like in notebook)
                    node_type = node_id.split('|')[0] if '|' in node_id else 'Unknown'
                    
                    # Extract properties from node ID if present
                    properties = {'id': node_id}
                    if '|' in node_id:
                        properties['type'] = node_type
                        properties['name'] = node_id.split('|', 1)[1] if len(node_id.split('|')) > 1 else node_id
                    
                    node = GraphNode(
                        id=node_id,
                        type=node_type,
                        properties=properties
                    )
                    self.existing_graph_nodes.append(node)
                
                # Create GraphEdge objects
                for edge_data in edges:
                    edge = GraphEdge(
                        source=edge_data['source'],
                        target=edge_data['target'],
                        type=edge_data['data']['type'],
                        properties=edge_data['data']
                    )
                    self.existing_graph_edges.append(edge)
                
                logger.info(f"✅ Loaded existing knowledge graph: {len(self.existing_graph_nodes)} nodes, {len(self.existing_graph_edges)} edges")
                
                # Verify expected counts
                expected_nodes = 664
                expected_edges = 1703
                
                if len(self.existing_graph_nodes) == expected_nodes and len(self.existing_graph_edges) == expected_edges:
                    logger.info("✅ SUCCESS: Graph loaded with correct node and edge counts!")
                else:
                    logger.warning(f"⚠️ Node/edge counts don't match expected: nodes {len(self.existing_graph_nodes)}/{expected_nodes}, edges {len(self.existing_graph_edges)}/{expected_edges}")
                
            else:
                logger.warning(f"Knowledge graph file not found at {self.knowledge_graph_path}")
                
        except Exception as e:
            logger.error(f"Failed to load existing knowledge graph: {str(e)}")
    
    def _build_graph_from_data(self, data_sources: List[Dict[str, Any]]) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """Build graph representation from business data without pandas"""
        
        nodes = []
        edges = []
        
        logger.info(f"Building graph from {len(data_sources)} data sources")
        
        for source in data_sources:
            data_type = source.get("type", "unknown")
            data_items = source.get("data", [])
            
            logger.info(f"Processing {len(data_items)} items of type {data_type}")
            
            if data_type == "projects":
                project_nodes, project_edges = self._process_projects_data(data_items)
                nodes.extend(project_nodes)
                edges.extend(project_edges)
                
            elif data_type == "hr":
                hr_nodes, hr_edges = self._process_hr_data(data_items)
                nodes.extend(hr_nodes)
                edges.extend(hr_edges)
                
            elif data_type in ["crm", "clients"]:
                client_nodes, client_edges = self._process_client_data(data_items)
                nodes.extend(client_nodes)
                edges.extend(client_edges)
                
            elif data_type == "financial":
                financial_nodes, financial_edges = self._process_financial_data(data_items)
                nodes.extend(financial_nodes)
                edges.extend(financial_edges)
                
            elif data_type in ["tenders", "opportunities"]:
                tender_nodes, tender_edges = self._process_tender_data(data_items)
                nodes.extend(tender_nodes)
                edges.extend(tender_edges)
                
            else:
                # Generic processing for unknown data types
                generic_nodes = self._process_generic_data(data_items, data_type)
                nodes.extend(generic_nodes)
        
        logger.info(f"Built graph with {len(nodes)} nodes and {len(edges)} edges")
        return nodes, edges
    
    def _process_projects_data(self, projects: List[Dict]) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """Process project data into graph nodes and edges"""
        
        nodes = []
        edges = []
        
        for project in projects:
            # Create project node
            project_id = project.get("project_id", f"project_{len(nodes)}")
            
            project_node = GraphNode(
                id=project_id,
                type="project",
                properties={
                    "name": project.get("project_name", "Unknown"),
                    "tech_domain": project.get("tech_domain", "Unknown"),
                    "complexity": project.get("complexity", "Unknown"),
                    "duration_months": project.get("duration_months", 0),
                    "team_size": project.get("team_size", 0),
                    "profit_margin": project.get("profit_margin", 0),
                    "client_satisfaction": project.get("client_satisfaction", 0),
                    "delivery_status": project.get("delivery_status", "Unknown")
                }
            )
            nodes.append(project_node)
            
            # Create client node and edge
            client_name = project.get("client_name")
            if client_name:
                client_id = f"client_{client_name.replace(' ', '_')}"
                
                client_node = GraphNode(
                    id=client_id,
                    type="client",
                    properties={
                        "name": client_name,
                        "industry": project.get("industry", "Unknown")
                    }
                )
                
                # Check if client already exists
                existing_client = next((n for n in nodes if n.id == client_id), None)
                if not existing_client:
                    nodes.append(client_node)
                
                # Create edge
                edges.append(GraphEdge(
                    source=project_id,
                    target=client_id,
                    type="belongs_to",
                    properties={}
                ))
            
            # Create industry node and edge
            industry = project.get("industry")
            if industry:
                industry_id = f"industry_{industry.replace(' ', '_')}"
                
                industry_node = GraphNode(
                    id=industry_id,
                    type="industry",
                    properties={"name": industry}
                )
                
                # Check if industry already exists
                existing_industry = next((n for n in nodes if n.id == industry_id), None)
                if not existing_industry:
                    nodes.append(industry_node)
                
                # Create edge from client to industry
                if client_name:
                    client_id = f"client_{client_name.replace(' ', '_')}"
                    edges.append(GraphEdge(
                        source=client_id,
                        target=industry_id,
                        type="belongs_to_industry",
                        properties={}
                    ))
        
        return nodes, edges
    
    def _process_hr_data(self, hr_records: List[Dict]) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """Process HR data into graph nodes and edges"""
        
        nodes = []
        edges = []
        
        for record in hr_records:
            # Create employee node
            employee_id = record.get("employee_id", f"employee_{len(nodes)}")
            
            employee_node = GraphNode(
                id=employee_id,
                type="employee",
                properties={
                    "name": record.get("name", "Unknown"),
                    "position": record.get("position", "Unknown"),
                    "experience_years": record.get("experience_years", 0),
                    "hourly_rate": record.get("hourly_rate", 0),
                    "performance_score": record.get("performance_score", 0),
                    "certifications": record.get("certifications", "")
                }
            )
            nodes.append(employee_node)
            
            # Create department node and edge
            department = record.get("department")
            if department:
                dept_id = f"dept_{department.replace(' ', '_')}"
                
                dept_node = GraphNode(
                    id=dept_id,
                    type="department",
                    properties={"name": department}
                )
                
                # Check if department already exists
                existing_dept = next((n for n in nodes if n.id == dept_id), None)
                if not existing_dept:
                    nodes.append(dept_node)
                
                # Create edge
                edges.append(GraphEdge(
                    source=employee_id,
                    target=dept_id,
                    type="works_in",
                    properties={}
                ))
        
        return nodes, edges
    
    def _process_client_data(self, clients: List[Dict]) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """Process client/CRM data"""
        
        nodes = []
        edges = []
        
        for client in clients:
            client_id = client.get("client_id", f"client_{len(nodes)}")
            
            client_node = GraphNode(
                id=client_id,
                type="client",
                properties={
                    "name": client.get("name", "Unknown"),
                    "industry": client.get("industry", "Unknown"),
                    "size": client.get("size", "Unknown"),
                    "satisfaction_score": client.get("satisfaction_score", 0),
                    "revenue_potential": client.get("revenue_potential", 0)
                }
            )
            nodes.append(client_node)
        
        return nodes, edges
    
    def _process_financial_data(self, financial: List[Dict]) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """Process financial data"""
        
        nodes = []
        edges = []
        
        for record in financial:
            record_id = record.get("record_id", f"financial_{len(nodes)}")
            
            financial_node = GraphNode(
                id=record_id,
                type="financial",
                properties={
                    "revenue": record.get("revenue", 0),
                    "costs": record.get("costs", 0),
                    "profit": record.get("profit", 0),
                    "period": record.get("period", "Unknown")
                }
            )
            nodes.append(financial_node)
        
        return nodes, edges
    
    def _process_tender_data(self, tenders: List[Dict]) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """Process tender/opportunity data"""
        
        nodes = []
        edges = []
        
        for tender in tenders:
            tender_id = tender.get("tender_id", f"tender_{len(nodes)}")
            
            tender_node = GraphNode(
                id=tender_id,
                type="tender",
                properties={
                    "title": tender.get("title", "Unknown"),
                    "value": tender.get("value", 0),
                    "status": tender.get("status", "Unknown"),
                    "win_probability": tender.get("win_probability", 0)
                }
            )
            nodes.append(tender_node)
        
        return nodes, edges
    
    def _process_generic_data(self, items: List[Dict], data_type: str) -> List[GraphNode]:
        """Process generic data types"""
        
        nodes = []
        
        for item in items:
            item_id = item.get("id", f"{data_type}_{len(nodes)}")
            
            node = GraphNode(
                id=item_id,
                type=data_type,
                properties=item
            )
            nodes.append(node)
        
        return nodes
    
    def _create_networkx_graph(self, nodes: List[GraphNode], edges: List[GraphEdge]) -> nx.Graph:
        """Create NetworkX graph from nodes and edges"""
        
        G = nx.Graph()
        
        # Add nodes
        for node in nodes:
            G.add_node(node.id, type=node.type, **node.properties)
        
        # Add edges
        for edge in edges:
            if G.has_node(edge.source) and G.has_node(edge.target):
                G.add_edge(edge.source, edge.target, type=edge.type, **edge.properties)
        
        return G
    
    def _create_documents_from_graph(self, nodes: List[GraphNode], edges: List[GraphEdge]) -> List[Document]:
        """Create LangChain documents from graph data following notebook approach"""
        
        documents = []
        
        # Create documents from nodes (following notebook's node_to_text function)
        for node in nodes:
            content = self._node_to_text(node)
            
            # Simple metadata (no lists/dicts) for vector store compatibility
            metadata = {
                "kind": "node",
                "id": node.id,
                "type": node.type
            }
            
            doc = Document(page_content=content, metadata=metadata)
            documents.append(doc)
        
        # Create documents from edges (following notebook's edge_to_text function)
        for edge in edges:
            content = self._edge_to_text(edge)
            
            metadata = {
                "kind": "edge",
                "source": edge.source,
                "target": edge.target,
                "type": edge.type
            }
            
            doc = Document(page_content=content, metadata=metadata)
            documents.append(doc)
        
        return documents
    
    def _node_to_text(self, node: GraphNode) -> str:
        """Convert node to text following notebook approach"""
        parts = [f"Node {node.id}"]
        
        # Add type information
        if node.type:
            parts.append(f"type: {node.type}")
        
        # Add properties
        for key, value in node.properties.items():
            if key in {"id", "type"}:
                continue
            if value is None or value == "":
                continue
            parts.append(f"{key}: {value}")
        
        return " | ".join(parts)
    
    def _edge_to_text(self, edge: GraphEdge) -> str:
        """Convert edge to text following notebook approach"""
        content = f"Edge {edge.source} -[{edge.type}]-> {edge.target}"
        
        # Add edge properties
        attrs = {k: v for k, v in edge.properties.items() 
                if k != "type" and v not in (None, "")}
        
        if attrs:
            attr_str = " ".join(f"{k}:{v}" for k, v in attrs.items())
            content += f" | {attr_str}"
        
        return content
    
    def _simple_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Simplify metadata for vector store compatibility"""
        out = {}
        for k, v in (metadata or {}).items():
            if isinstance(v, (str, int, float, bool)) or v is None:
                out[k] = v
            elif isinstance(v, (list, tuple)):
                out[k] = ", ".join(map(str, v))
            elif isinstance(v, dict):
                out[k] = json.dumps(v, ensure_ascii=False)
            else:
                out[k] = str(v)
        return out

    def _build_graph_adjacency(self, nodes: List[GraphNode], edges: List[GraphEdge]):
        """Build adjacency lists for graph traversal following notebook approach"""
        
        # Index nodes by ID
        self.nodes_by_id = {node.id: node for node in nodes}
        
        # Build adjacency lists
        self.out_edges = defaultdict(list)
        self.in_edges = defaultdict(list)
        
        for edge in edges:
            self.out_edges[edge.source].append(edge)
            self.in_edges[edge.target].append(edge)
        
        logger.info(f"Built adjacency for {len(self.nodes_by_id)} nodes")

    def _expand_neighborhood(self, seed_ids: List[str], hops: int = 1, max_nodes: int = 1500):
        """Expand neighborhood following notebook approach"""
        
        seen_nodes = set(seed_ids)
        frontier = set(seed_ids)
        
        for _ in range(hops):
            new_nodes = set()
            for node_id in list(frontier):
                # Add outgoing neighbors
                for edge in self.out_edges.get(node_id, []):
                    if edge.target:
                        new_nodes.add(edge.target)
                
                # Add incoming neighbors
                for edge in self.in_edges.get(node_id, []):
                    if edge.source:
                        new_nodes.add(edge.source)
            
            frontier = new_nodes - seen_nodes
            seen_nodes |= new_nodes
            
            if len(seen_nodes) >= max_nodes:
                break
        
        # Get subgraph nodes and edges
        sub_nodes = [self.nodes_by_id[node_id] for node_id in seen_nodes if node_id in self.nodes_by_id]
        sub_edges = [edge for edge in self.existing_graph_edges if edge.source in seen_nodes and edge.target in seen_nodes]
        
        return sub_nodes, sub_edges

    def _build_summary(self, nodes: List[GraphNode], edges: List[GraphEdge], max_per_type: int = 25, max_edges: int = 400) -> str:
        """Build summary following notebook approach"""
        
        # Group nodes by type
        buckets = defaultdict(list)
        for node in nodes:
            node_type = node.type or "Node"
            buckets[node_type].append(node)
        
        lines = []
        
        # Add node summaries
        for node_type, items in buckets.items():
            for node in items[:max_per_type]:
                brief = {
                    "id": node.id,
                    "type": node.type
                }
                
                # Add key properties
                for key in ["name", "title", "industry", "location", "salary", "experience"]:
                    if key in node.properties and node.properties[key] not in (None, "", []):
                        brief[key] = node.properties[key]
                
                lines.append(f"{node_type}: " + json.dumps({k: v for k, v in brief.items() if v is not None}, ensure_ascii=False))
        
        # Add edge summaries
        for edge in edges[:max_edges]:
            lines.append(f"EDGE: {edge.source} -[{edge.type}]-> {edge.target}")
        
        return "\n".join(lines)
    
    def analyze_patterns(self, data_sources: List[Dict[str, Any]], config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main analysis method using GraphRAG methodology
        """
        
        try:
            logger.info("Starting GraphRAG pattern analysis")
            
            # Extract configuration
            query = config.get("query", "What are the key business patterns?")
            hops = config.get("hops", 1)
            retrieval_k = config.get("retrieval_k", 12)
            max_nodes = config.get("max_nodes", 1500)
            
            # Use existing knowledge graph if available, otherwise build from data
            if self.existing_graph_nodes and self.existing_graph_edges:
                logger.info(f"🔄 Using existing knowledge graph: {len(self.existing_graph_nodes)} nodes, {len(self.existing_graph_edges)} edges")
                nodes = self.existing_graph_nodes
                edges = self.existing_graph_edges
                
                # Optionally merge with new data if provided
                if data_sources and len(data_sources) > 0:
                    logger.info("Merging existing knowledge graph with new data...")
                    new_nodes, new_edges = self._build_graph_from_data(data_sources)
                    
                    # Merge nodes (avoid duplicates)
                    existing_node_ids = {node.id for node in nodes}
                    for new_node in new_nodes:
                        if new_node.id not in existing_node_ids:
                            nodes.append(new_node)
                    
                    # Merge edges (avoid duplicates)
                    existing_edge_pairs = {(edge.source, edge.target, edge.type) for edge in edges}
                    for new_edge in new_edges:
                        edge_key = (new_edge.source, new_edge.target, new_edge.type)
                        if edge_key not in existing_edge_pairs:
                            edges.append(new_edge)
                    
                    logger.info(f"After merge: {len(nodes)} nodes, {len(edges)} edges")
            else:
                # Build graph from scratch if no existing graph
                logger.info("Building graph from provided data sources...")
                nodes, edges = self._build_graph_from_data(data_sources)
            
            # Limit nodes if too many
            if len(nodes) > max_nodes:
                nodes = nodes[:max_nodes]
                logger.warning(f"Limited nodes to {max_nodes} for performance")
            
            # Build adjacency for neighborhood expansion
            self._build_graph_adjacency(nodes, edges)
            
            # Create documents with simplified metadata
            self.documents = self._create_documents_from_graph(nodes, edges)
            
            # Create vector store with simplified metadata
            safe_documents = []
            for doc in self.documents:
                safe_metadata = self._simple_metadata(doc.metadata)
                safe_doc = Document(page_content=doc.page_content, metadata=safe_metadata)
                safe_documents.append(safe_doc)
            
            if safe_documents:
                self.vector_store = FAISS.from_documents(safe_documents, self.embeddings)
                logger.info(f"Created vector store with {len(safe_documents)} documents")
            else:
                raise ValueError("No documents created from graph data")
            
            # Retrieve relevant documents (following notebook approach)
            retriever = self.vector_store.as_retriever(search_kwargs={"k": retrieval_k})
            retrieved_docs = retriever.invoke(query)
            
            # Extract seed IDs from retrieved documents (following notebook approach)
            seed_ids = set()
            for doc in retrieved_docs:
                kind = doc.metadata.get("kind")
                if kind == "node" and "id" in doc.metadata:
                    seed_ids.add(doc.metadata["id"])
                elif kind == "edge":
                    if "source" in doc.metadata:
                        seed_ids.add(doc.metadata["source"])
                    if "target" in doc.metadata:
                        seed_ids.add(doc.metadata["target"])
            
            # Fallback: parse edge strings if needed
            if not seed_ids:
                for doc in retrieved_docs:
                    if doc.metadata.get("kind") == "edge":
                        try:
                            txt = doc.page_content
                            s = txt.split("Edge ", 1)[1].split(" -[", 1)[0]
                            t = txt.split("]-> ", 1)[1].split(" | ", 1)[0]
                            seed_ids.update([s, t])
                        except Exception:
                            pass
            
            # Expand to neighborhood (following notebook approach)
            sub_nodes, sub_edges = self._expand_neighborhood(list(seed_ids), hops=hops, max_nodes=max_nodes)
            
            # Build summary (following notebook approach)
            subgraph_summary = self._build_summary(sub_nodes, sub_edges)
            
            # Generate analysis using LLM (following notebook approach)
            patterns_text = self._generate_pattern_analysis_with_context(query, subgraph_summary, len(sub_nodes), len(sub_edges), len(retrieved_docs), len(seed_ids))
            
            # Create response
            result = {
                "success": True,
                "patterns": patterns_text,
                "analysisMetadata": {
                    "method": "GraphRAG",
                    "graph_stats": {
                        "total_nodes": len(nodes),
                        "total_edges": len(edges),
                        "subgraph_nodes": len(sub_nodes),
                        "subgraph_edges": len(sub_edges)
                    },
                    "retrieval_metadata": {
                        "query": query,
                        "retrieved_docs": len(retrieved_docs),
                        "seed_ids": len(seed_ids),
                        "hops": hops
                    }
                },
                "subgraph": {
                    "nodes": [{"id": node.id, "type": node.type, **node.properties} for node in sub_nodes[:20]],
                    "edges": [{"source": edge.source, "target": edge.target, "type": edge.type} for edge in sub_edges[:20]]
                }
            }
            
            logger.info("GraphRAG analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"GraphRAG analysis failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "patterns": "",
                "analysisMetadata": {"method": "GraphRAG", "error": str(e)}
            }
    
    def _generate_pattern_analysis(self, query: str, context: str) -> str:
        """Generate pattern analysis using LLM"""
        
        system_prompt = """You are a senior business strategist and data analyst.

You are analyzing a comprehensive knowledge graph with 664+ nodes and 1700+ edges representing relationships between projects, clients, technologies, locations, industries, and business outcomes from a tech consulting company.

This knowledge graph contains rich interconnected data including:
- Project performance metrics (duration, costs, success rates)
- Client relationships and industry sectors  
- Technology stacks and implementation patterns
- Geographic and temporal patterns
- Employee assignments and team compositions

Your task is to extract and present **hidden performance patterns** from this graph structure. These are combinations of variables that clearly influence business outcomes (profitability, win rate, delivery success, client satisfaction, etc.).

For each pattern detected, structure your response as follows:

🧠 **Pattern [X] — [Short descriptive title]**  
**Type**: [Winning configuration] / [Losing configuration]

**Description**:  
[Clear explanation of what the pattern shows using graph relationships]

**Key Variables**:  
- `variable1 = value/range`
- `variable2 = value/range`  
- `variable3 = value/range`

**Impact**:
- 🟢 [Positive effects with quantified metrics from graph data]
- 🔴 [Negative effects with quantified metrics from graph data]

**Confidence**: [High/Medium/Low] based on graph connectivity and data strength

**Business Implication**:  
[Clear, actionable recommendation leveraging graph insights]

Focus on patterns that leverage the graph's interconnected nature and provide specific, actionable insights for business strategy."""
        
        user_prompt = f"""Query: {query}

Business Data Context:
{context}

Please analyze this data and identify the most important business patterns, focusing on factors that drive success or failure in projects, client relationships, and business performance."""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = self.llm.invoke(messages)
        return response.content if hasattr(response, 'content') else str(response)

    def _generate_pattern_analysis_with_context(self, query: str, subgraph_summary: str, num_nodes: int, num_edges: int, num_docs: int, num_seeds: int) -> str:
        """Generate pattern analysis using LLM with subgraph context following notebook approach"""
        
        system_prompt = """You are an expert strategic assistant to Talan. You are provided with a graph database of historical data where clusters represent groups of similar challenges. 

Your task is to extract and present **hidden performance patterns** from this graph structure. These are combinations of variables that clearly influence business outcomes.

For each pattern detected, structure your response EXACTLY as follows:

🧠 **Pattern [1] — [Short descriptive title]**  
**Type**: [Winning configuration] / [Losing configuration]

**Description**:  
[Clear explanation of what the pattern shows using graph relationships]

**Key Variables**:  
- `variable1 = value/range`
- `variable2 = value/range`  
- `variable3 = value/range`

**Impact**:
- 🟢 [Positive effects with quantified metrics from graph data]
- 🔴 [Negative effects with quantified metrics from graph data]

**Confidence**: [High/Medium/Low] based on graph connectivity and data strength

**Business Implication**:  
[Clear, actionable recommendation leveraging graph insights]

IMPORTANT: 
- Start each pattern with the 🧠 emoji
- Use the exact format above
- Include at least 2-3 patterns
- Focus on actionable business insights"""
        
        user_prompt = f"Subgraph:\n{subgraph_summary}\n\nQuestion:\n{query}"
        
        # Log retrieval statistics like in notebook
        logger.info(f"Retrieved docs: {num_docs}  |  Seeds: {num_seeds}  |  Subgraph: {num_nodes} nodes / {num_edges} edges")
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = self.llm.invoke(messages)
        answer = response.content if hasattr(response, 'content') else str(response)
        
        logger.info(f"Answer generated with {len(answer)} characters")
        return answer

# Export for backward compatibility
GraphRAGPatternAnalyzer = PandasFreeGraphRAGAnalyzer
