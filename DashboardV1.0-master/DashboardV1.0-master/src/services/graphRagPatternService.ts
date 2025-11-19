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
   * Parse patterns from GraphRAG response - adapted for notebook format
   */
  parsePatterns(patternsText: string): ParsedPattern[] {
    if (!patternsText || patternsText.trim().length === 0) {
      return [];
    }

    const patterns: ParsedPattern[] = [];
    
    // The notebook returns unstructured text, so we'll create a comprehensive pattern
    // This matches the notebook's approach of providing analytical insights
    const lines = patternsText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }

    // Extract key insights from the notebook response
    const sections: Record<string, string[]> = {
      challenges: [],
      solutions: [],
      recommendations: [],
      patterns: []
    };

    let currentSection: keyof typeof sections = 'patterns';
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (cleanLine.includes('Challenge') || cleanLine.includes('Problem') || cleanLine.includes('Issue')) {
        currentSection = 'challenges';
        sections[currentSection].push(cleanLine);
      } else if (cleanLine.includes('Solution') || cleanLine.includes('Technology') || cleanLine.includes('Implementation')) {
        currentSection = 'solutions';
        sections[currentSection].push(cleanLine);
      } else if (cleanLine.includes('Recommendation') || cleanLine.includes('Suggest') || cleanLine.includes('Should')) {
        currentSection = 'recommendations';
        sections[currentSection].push(cleanLine);
      } else if (cleanLine.includes('Pattern') || cleanLine.includes('Trend') || cleanLine.includes('Analysis')) {
        currentSection = 'patterns';
        sections[currentSection].push(cleanLine);
      } else if (cleanLine.length > 20 && !cleanLine.startsWith('*')) {
        sections[currentSection].push(cleanLine);
      }
    });

    // Create structured pattern from notebook response
    const pattern: ParsedPattern = {
      id: 1,
      title: 'Strategic Analysis from Knowledge Graph',
      type: 'Winning configuration',
      description: sections.patterns.slice(0, 3).join(' ') || patternsText.substring(0, 300) + '...',
      keyVariables: this.extractKeyVariables(patternsText),
      impact: this.extractImpact(sections),
      confidence: this.determineConfidence(patternsText),
      businessImplication: sections.recommendations.slice(0, 2).join(' ') || 
                          sections.solutions.slice(0, 2).join(' ') || 
                          'Strategic insights identified from knowledge graph analysis.'
    };

    patterns.push(pattern);
    return patterns;
  }

  private extractKeyVariables(text: string): string[] {
    const variables: string[] = [];
    const lines = text.split('\n');
    
    // Look for structured data, bullet points, or key-value patterns
    lines.forEach(line => {
      if (line.includes(':') && line.length < 100) {
        variables.push(line.trim());
      } else if (line.includes('•') || line.includes('-') && line.length < 80) {
        variables.push(line.replace(/[•\-]/g, '').trim());
      }
    });

    // If no structured variables found, extract key phrases
    if (variables.length === 0) {
      const keyPhrases = text.match(/\b(SAP|BTP|Cloud|Digital|ERP|CRM|AI|ML|Data|Security|Integration|Migration|Upgrade|Support|Training|Implementation)\b/gi);
      if (keyPhrases) {
        variables.push(...[...new Set(keyPhrases)].slice(0, 5));
      }
    }

    return variables.slice(0, 5);
  }

  private extractImpact(sections: any): Array<{type: 'positive' | 'negative'; description: string}> {
    const impact: Array<{type: 'positive' | 'negative'; description: string}> = [];
    
    // Positive impacts from solutions
    sections.solutions.forEach((solution: string) => {
      if (solution.trim().length > 10) {
        impact.push({
          type: 'positive',
          description: solution.trim()
        });
      }
    });

    // Challenges as negative impacts
    sections.challenges.forEach((challenge: string) => {
      if (challenge.trim().length > 10) {
        impact.push({
          type: 'negative',
          description: challenge.trim()
        });
      }
    });

    // Default impacts if none found
    if (impact.length === 0) {
      impact.push({
        type: 'positive',
        description: 'Strategic insights and recommendations provided based on historical data analysis'
      });
    }

    return impact.slice(0, 4);
  }

  private determineConfidence(text: string): string {
    const confidenceKeywords = {
      high: ['proven', 'successful', 'effective', 'demonstrated', 'validated'],
      medium: ['likely', 'potential', 'suggests', 'indicates', 'appears'],
      low: ['uncertain', 'unclear', 'limited', 'insufficient', 'unknown']
    };

    const lowerText = text.toLowerCase();
    
    for (const [level, keywords] of Object.entries(confidenceKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return level.charAt(0).toUpperCase() + level.slice(1);
      }
    }

    return 'Medium';
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
        hops: config?.hops || 4,
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
