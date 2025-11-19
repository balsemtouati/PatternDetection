# GraphRAG Pattern Analysis Integration

This document describes the integration of GraphRAG (Graph-based Retrieval Augmented Generation) pattern analysis capabilities into the dashboard platform.

## Overview

The GraphRAG integration converts the Jupyter notebook logic from `Copy_of_GraphRAG_from_JSON.ipynb` into a production-ready backend service and frontend component for advanced business pattern detection.

## Architecture

### Backend Components

#### 1. GraphRAG Pattern Analyzer (`backend/graph_rag_analyzer.py`)
- **Purpose**: Core GraphRAG implementation for business intelligence
- **Features**:
  - Converts CSV data into graph representation (nodes and edges)
  - Builds vector embeddings using Google's embedding models
  - Uses FAISS for efficient similarity search
  - Employs Gemini 2.0 Flash for pattern analysis
  - Implements the strategic business analyst prompt for pattern detection

#### 2. API Integration (`backend/api_routes.py`)
- **New Endpoint**: `/api/analyze-graphrag`
- **Method**: POST
- **Purpose**: Handles GraphRAG analysis requests from frontend

### Frontend Components

#### 1. GraphRAG Service (`src/services/graphRagPatternService.ts`)
- **Purpose**: TypeScript service for GraphRAG API communication
- **Features**:
  - Data source preparation from uploaded CSV files
  - Pattern parsing from LLM responses
  - Pre-defined business analysis queries
  - Type-safe interfaces for all operations

#### 2. GraphRAG Analysis Component (`src/components/patterns/GraphRAGAnalysis.tsx`)
- **Purpose**: React component for GraphRAG pattern analysis UI
- **Features**:
  - Multi-file CSV upload interface
  - Predefined and custom query options
  - Real-time pattern visualization
  - Winning/losing configuration display

## Key Features

### Enhanced Prompt System

The system uses a sophisticated prompt designed for business strategy analysis:

```
You are a senior business strategist and data analyst.

You are analyzing structured datasets from a tech company (projects, tenders, HR, CRM, ERP, financial data) to discover **hidden performance patterns**.

Your task is to extract and present all relevant **winning or losing configurations** you find in the data. These are combinations of variables that clearly influence the outcome of offers or projects (profitability, win rate, delay, satisfaction, etc.).
```

### Pattern Format

Each detected pattern follows this structure:
- **Pattern Title**: Short descriptive name
- **Type**: Winning or Losing configuration
- **Description**: Detailed explanation of the pattern
- **Key Variables**: Critical variables and their values
- **Impact**: Quantified positive/negative effects
- **Confidence**: Statistical confidence level
- **Business Implication**: Actionable recommendation

### Data Processing Pipeline

1. **Data Upload**: Multiple CSV files uploaded via frontend
2. **Graph Construction**: Convert tabular data to graph representation
   - Projects → Project nodes
   - HR data → Employee and Department nodes
   - CRM data → Client and Industry nodes
   - Relationships → Edges between entities
3. **Vector Indexing**: Build FAISS index from node/edge documents
4. **Pattern Detection**: Use GraphRAG methodology:
   - Retrieve relevant subgraph based on query
   - Expand neighborhood with configurable hops
   - Generate business insights using LLM

## Installation & Setup

### Backend Dependencies

Add to `requirements.txt`:
```
langchain-core>=0.1.0
langchain-community>=0.0.20
langchain-google-genai>=1.0.6
faiss-cpu>=1.7.4
sentence-transformers>=2.2.0
pydantic>=2.0.0
chromadb>=0.4.0
networkx==3.1
```

### Environment Configuration

Set up Google API key:
```bash
export GOOGLE_API_KEY="your-google-api-key"
```

### Frontend Integration

The GraphRAG component is integrated into the Home Dashboard:
```tsx
import { GraphRAGAnalysis } from '../patterns';

// Component usage in HomeDashboard
<GraphRAGAnalysis onPatternsDetected={handlePatterns} />
```

## Usage

### 1. Data Upload
- Upload multiple CSV files containing business data
- Supported types: projects, HR, tenders, CRM, financial, ERP, assignments
- Files are automatically typed based on filename patterns

### 2. Query Selection
Choose from predefined analysis focuses:
- **Overall Business Patterns**: Comprehensive analysis
- **Project Success Factors**: Focus on delivery optimization
- **Client Relationship Optimization**: Retention and growth patterns
- **Team Performance Dynamics**: HR and team optimization
- **Financial Performance Patterns**: Profit margin optimization
- **Risk and Failure Prevention**: Risk mitigation patterns

### 3. Analysis Execution
- Click "Analyze Business Patterns" to start processing
- System builds graph representation
- Creates vector embeddings
- Retrieves relevant subgraph
- Generates strategic insights

### 4. Results Interpretation
- View detected patterns with confidence scores
- Understand winning vs losing configurations
- Access actionable business implications
- Export results for further analysis

## Graph Data Model

### Node Types
- **Project**: tech_domain, complexity, duration, team_size, profit_margin
- **Employee**: experience, certifications, performance_score, hourly_rate
- **Client**: industry, size, satisfaction_score, revenue_potential
- **Department**: organizational units
- **Industry**: business sectors
- **Financial**: revenue, costs, profit data

### Edge Types
- **belongs_to**: Project → Client relationships
- **works_in**: Employee → Department relationships
- **belongs_to_industry**: Client → Industry relationships

## Performance Considerations

### Scalability
- **Node Limit**: Configurable max_nodes (default: 1500)
- **Retrieval Limit**: Configurable k parameter (default: 12)
- **Hop Distance**: Configurable neighborhood expansion (default: 1)

### Memory Optimization
- Documents are limited to essential metadata
- Large graphs are truncated for performance
- Vector store uses FAISS for efficient similarity search

## Example Output

```
🧠 **Pattern 1 — High-Margin Project Configuration**  
**Type**: Winning configuration

**Description**:  
Projects in healthcare sector with 5-7 team members and 6-9 month duration consistently achieve 35%+ profit margins when led by senior developers with 7+ years experience.

**Key Variables**:  
- `sector = Healthcare`
- `team_size = 5-7`  
- `duration_months = 6-9`
- `lead_experience = 7+ years`

**Impact**:
- 🟢 +35% average profit margin
- 🟢 +2.1 client satisfaction score

**Business Implication**:  
Prioritize healthcare projects with experienced leads and optimal team sizing for maximum profitability.
```

## API Reference

### GraphRAG Analysis Endpoint

**POST** `/api/analyze-graphrag`

**Request Body**:
```json
{
  "dataSources": [
    {
      "type": "projects",
      "data": [...]
    }
  ],
  "config": {
    "query": "Analysis query string",
    "hops": 1,
    "retrieval_k": 12,
    "max_nodes": 1500
  }
}
```

**Response**:
```json
{
  "success": true,
  "patterns": "LLM-generated pattern text",
  "analysisMetadata": {
    "method": "GraphRAG",
    "patterns_detected": 3,
    "graph_stats": {...},
    "retrieval_metadata": {...}
  },
  "subgraph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

## Troubleshooting

### Common Issues

1. **"GraphRAG service not available"**
   - Ensure backend is running
   - Check Google API key configuration
   - Verify LangChain dependencies installed

2. **"No patterns detected"**
   - Upload more diverse data files
   - Try different analysis queries
   - Check data quality and completeness

3. **Performance issues**
   - Reduce max_nodes parameter
   - Limit file sizes
   - Use fewer hops for large datasets

### Debugging

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Monitor API calls:
```bash
tail -f backend/logs/api.log
```

## Future Enhancements

### Planned Features
- **Graph Visualization**: Interactive network visualization
- **Pattern Persistence**: Save and compare pattern analysis over time
- **Advanced Filtering**: Filter patterns by confidence, impact, etc.
- **Export Options**: PDF, Excel reports with detailed analysis
- **Batch Processing**: Handle multiple analysis requests
- **Custom Embeddings**: Domain-specific embedding models

### Performance Improvements
- **Caching**: Cache frequently accessed subgraphs
- **Parallel Processing**: Concurrent analysis for multiple queries
- **Database Integration**: Persistent graph storage
- **Real-time Updates**: Incremental graph updates

## Contributing

When contributing to the GraphRAG integration:

1. **Backend Changes**: Test with sample data in `backend/test_backend.py`
2. **Frontend Changes**: Ensure TypeScript types are updated
3. **API Changes**: Update API documentation
4. **Dependencies**: Update requirements.txt appropriately

## License

This GraphRAG integration follows the same license as the main dashboard project.
