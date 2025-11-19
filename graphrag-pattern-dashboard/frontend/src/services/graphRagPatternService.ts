/**
 * GraphRAG Pattern Detection Service
 * Integrates with the GraphRAG backend for advanced pattern analysis
 */

const API_BASE_URL = 'http://localhost:5000';

export interface GraphRAGRequest {
  dataSources?: Array<{
    type: string;
    data: any[];
  }>;
  config: {
    analysisType?: string;
    query?: string;
    hops?: number;
    retrieval_k?: number;
    max_nodes?: number;
  };
}

export interface GraphRAGResponse {
  success: boolean;
  patterns: string;
  analysisMetadata: {
    method: string;
    graph_stats: {
      total_nodes: number;
      total_edges: number;
      subgraph_nodes?: number;
      subgraph_edges?: number;
    };
    retrieval_metadata: {
      query: string;
      retrieved_docs: number;
      seed_ids?: number;
      hops: number;
    };
  };
  subgraph?: {
    nodes: Array<{
      id: string;
      type: string;
      [key: string]: any;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
    }>;
  };
  error?: string;
}

export interface ParsedPattern {
  id: number;
  title: string;
  type: 'Winning configuration' | 'Losing configuration';
  description: string;
  keyVariables: string[];
  impact: Array<{
    type: 'positive' | 'negative';
    description: string;
  }>;
  confidence?: string;
  businessImplication: string;
}

class GraphRAGPatternService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze patterns using GraphRAG methodology
   */
  async analyzePatterns(request: GraphRAGRequest): Promise<GraphRAGResponse> {
    try {
      console.log('Sending GraphRAG request:', request);
      
      // Use the correct GraphRAG endpoint
      const response = await fetch(`${this.baseUrl}/api/analyze-graphrag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: GraphRAGResponse = await response.json();
      console.log('GraphRAG response:', data);
      return data;
    } catch (error) {
      console.error('Error analyzing patterns with GraphRAG:', error);
      throw error;
    }
  }

  /**
   * Parse the LLM response into structured patterns
   */
  parsePatterns(patternsText: string): ParsedPattern[] {
    const patterns: ParsedPattern[] = [];
    
    try {
      // First try to parse structured format with 🧠 emoji
      const patternBlocks = patternsText.split('🧠').filter(block => block.trim());
      
      if (patternBlocks.length > 1) {
        // Structured format found
        patternBlocks.forEach((block, index) => {
          const lines = block.trim().split('\n').filter(line => line.trim());
          
          if (lines.length === 0) return;
          
          // Extract title and type from first line
          const titleLine = lines[0];
          const titleMatch = titleLine.match(/\*\*Pattern \[?\d+\]? — (.+?)\*\*/);
          const title = titleMatch ? titleMatch[1] : `Pattern ${index + 1}`;
          
          // Find type
          const typeLine = lines.find(line => line.includes('**Type**:'));
          const typeMatch = typeLine?.match(/\*\*Type\*\*:\s*\[(.+?)\]/);
          const type = typeMatch ? typeMatch[1] as 'Winning configuration' | 'Losing configuration' : 'Winning configuration';
          
          // Extract description
          const descStart = lines.findIndex(line => line.includes('**Description**:'));
          const keyVarStart = lines.findIndex(line => line.includes('**Key Variables**:'));
          const description = descStart !== -1 && keyVarStart !== -1 
            ? lines.slice(descStart + 1, keyVarStart).join(' ').trim()
            : '';
          
          // Extract key variables
          const keyVariables: string[] = [];
          if (keyVarStart !== -1) {
            const impactStart = lines.findIndex(line => line.includes('**Impact**:'));
            const varLines = lines.slice(keyVarStart + 1, impactStart !== -1 ? impactStart : lines.length);
            varLines.forEach(line => {
              const cleanLine = line.replace(/[`*]/g, '').trim();
              if (cleanLine && cleanLine.startsWith('-') && !cleanLine.includes('Example:')) {
                keyVariables.push(cleanLine.substring(1).trim()); // Remove the '-' prefix
              }
            });
          }
          
          // Extract impact
          const impact: Array<{ type: 'positive' | 'negative'; description: string }> = [];
          const impactStart = lines.findIndex(line => line.includes('**Impact**:'));
          if (impactStart !== -1) {
            const confStart = lines.findIndex(line => line.includes('**Confidence**:'));
            const bizStart = lines.findIndex(line => line.includes('**Business Implication**:'));
            const impactEnd = confStart !== -1 ? confStart : (bizStart !== -1 ? bizStart : lines.length);
            
            const impactLines = lines.slice(impactStart + 1, impactEnd);
            impactLines.forEach(line => {
              const cleanLine = line.trim();
              if (cleanLine.includes('🟢')) {
                impact.push({
                  type: 'positive',
                  description: cleanLine.replace(/[🟢\-]/g, '').trim()
                });
              } else if (cleanLine.includes('🔴') || cleanLine.includes('❌')) {
                impact.push({
                  type: 'negative',
                  description: cleanLine.replace(/[🔴❌\-]/g, '').trim()
                });
              }
            });
          }
          
          // Extract confidence
          const confLine = lines.find(line => line.includes('**Confidence**:'));
          const confidence = confLine?.replace(/\*\*/g, '').replace('Confidence:', '').trim();
          
          // Extract business implication
          const bizStart = lines.findIndex(line => line.includes('**Business Implication**:'));
          let businessImplication = '';
          if (bizStart !== -1) {
            // Get all lines after Business Implication until end of pattern
            const bizLines = lines.slice(bizStart + 1);
            businessImplication = bizLines.join(' ').replace(/\*\*/g, '').trim();
          }
          
          patterns.push({
            id: index + 1,
            title,
            type,
            description,
            keyVariables,
            impact,
            confidence,
            businessImplication
          });
        });
      } else {
        // Fallback: Parse unstructured text format
        patterns.push(this.parseUnstructuredResponse(patternsText));
      }
    } catch (error) {
      console.error('Error parsing patterns:', error);
      // Final fallback: Create a single pattern from the entire response
      patterns.push({
        id: 1,
        title: 'Analysis Results',
        type: 'Winning configuration',
        description: patternsText.substring(0, 500) + (patternsText.length > 500 ? '...' : ''),
        keyVariables: [],
        impact: [],
        confidence: 'Medium',
        businessImplication: patternsText.length > 500 ? patternsText.substring(500, 1000) + '...' : ''
      });
    }
    
    return patterns;
  }

  /**
   * Parse unstructured response into a pattern
   */
  private parseUnstructuredResponse(text: string): ParsedPattern {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract sections based on headers
    const sections: { [key: string]: string[] } = {
      challenges: [],
      solutions: [],
      recommendations: [],
      patterns: []
    };
    
    let currentSection = 'patterns';
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.includes('Challenge') || cleanLine.includes('Problem')) {
        currentSection = 'challenges';
      } else if (cleanLine.includes('Solution') || cleanLine.includes('Technology')) {
        currentSection = 'solutions';
      } else if (cleanLine.includes('Recommendation') || cleanLine.includes('Pattern')) {
        currentSection = 'recommendations';
      } else if (cleanLine.length > 0 && !cleanLine.startsWith('*')) {
        sections[currentSection].push(cleanLine);
      }
    });
    
    // Extract key points
    const keyVariables = lines
      .filter(line => line.includes('*') && line.length > 10)
      .slice(0, 5)
      .map(line => line.replace(/[*]/g, '').trim());
    
    // Create structured pattern
    return {
      id: 1,
      title: 'Strategic Analysis',
      type: 'Winning configuration',
      description: sections.patterns.slice(0, 3).join(' ') || text.substring(0, 300),
      keyVariables,
      impact: [
        {
          type: 'positive',
          description: sections.solutions.slice(0, 2).join(' ') || 'Strategic insights identified'
        }
      ],
      confidence: 'Medium',
      businessImplication: sections.recommendations.slice(0, 2).join(' ') || text.substring(0, 200)
    };
  }

  /**
   * Prepare data sources from uploaded files
   */
  prepareDataSources(files: File[]): Promise<Array<{ type: string; data: any[] }>> {
    return Promise.all(
      files.map(async (file) => {
        const text = await file.text();
        const lines = text.split('\n');
        
        if (lines.length === 0) return { type: 'unknown', data: [] };
        
        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
        
        // Determine data type from filename or headers
        const filename = file.name.toLowerCase();
        let type = 'unknown';
        
        if (filename.includes('project')) type = 'projects';
        else if (filename.includes('hr') || filename.includes('employee')) type = 'hr';
        else if (filename.includes('tender')) type = 'tenders';
        else if (filename.includes('crm') || filename.includes('client')) type = 'crm';
        else if (filename.includes('financial') || filename.includes('finance')) type = 'financial';
        else if (filename.includes('erp')) type = 'erp';
        else if (filename.includes('assignment')) type = 'assignments';
        
        return { type, data };
      })
    );
  }

  /**
   * Generate default analysis queries based on business context
   */
  getDefaultQueries(): Array<{ label: string; query: string; description: string }> {
    return [
      {
        label: 'SAP System Aging Solutions',
        query: 'I have a new client who is suffering from aging SAP system. What should I do?',
        description: 'Find solutions and patterns for clients with aging SAP systems based on historical case studies'
      },
      {
        label: 'Project Success Factors',
        query: 'Which projects in the Food Industry used SAP and what challenges were resolved?',
        description: 'Analyze SAP implementations in food industry from knowledge graph'
      },
      {
        label: 'High-Performance Teams',
        query: 'Which departments correlate with high productivity scores across projects?',
        description: 'Identify team composition patterns that lead to success'
      },
      {
        label: 'Technology Adoption Patterns',
        query: 'What are the most successful technology combinations for digital transformation projects?',
        description: 'Analyze technology stack patterns from successful projects'
      },
      {
        label: 'Client Industry Insights',
        query: 'What are the common challenges and solutions across different industries?',
        description: 'Cross-industry pattern analysis from case studies'
      },
      {
        label: 'Geographic Success Patterns',
        query: 'How do project outcomes vary by location and what location-specific factors matter?',
        description: 'Analyze geographic patterns and location-based success factors'
      }
    ];
  }

  /**
   * Analyze patterns using existing knowledge graph (no file upload needed)
   */
  async analyzeWithKnowledgeGraph(query: string, config?: Partial<GraphRAGRequest['config']>): Promise<GraphRAGResponse> {
    const request: GraphRAGRequest = {
      config: {
        analysisType: 'graphRAG',
        query,
        hops: config?.hops || 1,
        retrieval_k: config?.retrieval_k || 12,
        max_nodes: config?.max_nodes || 1000,
        ...config
      },
      dataSources: [] // Empty - backend will use existing knowledge graph
    };

    return this.analyzePatterns(request);
  }

  /**
   * Health check for GraphRAG service
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('Attempting health check to:', `${this.baseUrl}/api/health`);
      const response = await fetch(`${this.baseUrl}/api/health`);
      console.log('Health check response status:', response.status);
      
      if (!response.ok) {
        console.error('Health check failed with status:', response.status);
        return false;
      }
      
      const data = await response.json();
      console.log('Health check response data:', data);
      const isHealthy = data.status === 'healthy';
      console.log('Service is healthy:', isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('GraphRAG health check failed:', error);
      return false;
    }
  }

  /**
   * Get service status including GraphRAG capabilities
   */
  async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get service status:', error);
      throw error;
    }
  }
}

export default GraphRAGPatternService;
export { GraphRAGPatternService };
