/**
 * Competitor Intelligence Chat Service
 * Integrates with MURAG backend for competitor analysis
 */

const API_BASE_URL = 'http://localhost:5000';

export interface CompetitorChatRequest {
  query: string;
}

export interface CompetitorChatResponse {
  success: boolean;
  answer?: string;
  error?: string;
  timestamp?: string;
  query?: string;
}

export class CompetitorChatService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a competitor intelligence query
   */
  async askCompetitor(query: string): Promise<CompetitorChatResponse> {
    try {
      console.log('Sending competitor query:', query);
      
      const response = await fetch(`${this.baseUrl}/api/competitor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: CompetitorChatResponse = await response.json();
      console.log('Competitor chat response:', data);
      return data;
    } catch (error) {
      console.error('Error in competitor chat:', error);
      throw error;
    }
  }

  /**
   * Health check for competitor intelligence service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.services?.competitor_intelligence === 'available';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get example queries for competitor intelligence
   */
  getExampleQueries(): Array<{label: string, query: string, description: string}> {
    return [
      {
        label: "Market Positioning",
        query: "How do our competitors position themselves in the market and what are their key differentiators?",
        description: "Analyze competitor market positioning strategies"
      },
      {
        label: "Technology Stack",
        query: "What technologies and platforms are our competitors using for their digital transformation?",
        description: "Understand competitor technology choices"
      },
      {
        label: "Pricing Strategy", 
        query: "What pricing models and strategies are competitors using in our industry?",
        description: "Analyze competitor pricing approaches"
      },
      {
        label: "Partnership Strategy",
        query: "Which strategic partnerships and alliances have competitors formed recently?",
        description: "Review competitor partnership strategies"
      },
      {
        label: "Innovation Focus",
        query: "What are the main innovation areas and R&D investments of our competitors?",
        description: "Understand competitor innovation priorities"
      },
      {
        label: "Customer Segments",
        query: "Which customer segments are competitors targeting and how are they approaching them?",
        description: "Analyze competitor customer targeting"
      }
    ];
  }
}

export default CompetitorChatService;
