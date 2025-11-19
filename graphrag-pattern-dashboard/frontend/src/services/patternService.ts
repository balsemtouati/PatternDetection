// Service pour communiquer avec l'API PatternAI
const API_BASE_URL = 'http://localhost:8000';

export interface PatternRequest {
  business_type: 'sales' | 'marketing' | 'both';
  data_type: 'csv' | 'excel' | 'json';
  data_content: string;
}

export interface PatternResponse {
  success: boolean;
  patterns: {
    sales?: any;
    marketing?: any;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
    color: string;
  }>;
  message: string;
}

export interface SampleDataResponse {
  success: boolean;
  sample_data: {
    columns: string[];
    data: any[][];
  };
  message: string;
}

class PatternService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Vérifie la santé de l'API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Erreur lors de la vérification de santé:', error);
      return false;
    }
  }

  /**
   * Analyse des patterns à partir de données
   */
  async analyzePatterns(request: PatternRequest): Promise<PatternResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'analyse des patterns:', error);
      throw error;
    }
  }

  /**
   * Upload et analyse d'un fichier
   */
  async uploadAndAnalyzeFile(
    file: File, 
    businessType: 'sales' | 'marketing' | 'both' = 'both'
  ): Promise<PatternResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('business_type', businessType);

      const response = await fetch(`${this.baseUrl}/api/upload-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'upload et analyse:', error);
      throw error;
    }
  }

  /**
   * Récupère des données d'exemple
   */
  async getSampleData(businessType: 'sales' | 'marketing'): Promise<SampleDataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sample-data/${businessType}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'exemple:', error);
      throw error;
    }
  }

  /**
   * Convertit des données CSV en format attendu par l'API
   */
  csvToApiFormat(csvContent: string): PatternRequest {
    return {
      business_type: 'both', // Par défaut, peut être modifié
      data_type: 'csv',
      data_content: csvContent
    };
  }

  /**
   * Convertit des données JSON en format attendu par l'API
   */
  jsonToApiFormat(jsonData: any): PatternRequest {
    return {
      business_type: 'both', // Par défaut, peut être modifié
      data_type: 'json',
      data_content: JSON.stringify(jsonData)
    };
  }

  /**
   * Génère des données synthétiques pour les tests
   */
  generateSyntheticData(businessType: 'sales' | 'marketing', count: number = 100): any[] {
    if (businessType === 'sales') {
      return this.generateSyntheticSalesData(count);
    } else {
      return this.generateSyntheticMarketingData(count);
    }
  }

  private generateSyntheticSalesData(count: number): any[] {
    const sectors = ['Banque/Assurance', 'Industrie', 'E-commerce', 'Santé'];
    const clientTypes = ['Grande Entreprise', 'ETI', 'PME'];
    const durations = ['3-6 mois', '6-12 mois', '12+ mois'];
    const teamSizes = ['2-4', '4-8', '8-15'];

    const data = [];
    for (let i = 1; i <= count; i++) {
      const amount = Math.floor(Math.random() * 900000) + 100000; // 100k à 1M
      const success = Math.random() > 0.3; // 70% de succès
      
      data.push({
        deal_id: i,
        amount: amount,
        sector: sectors[Math.floor(Math.random() * sectors.length)],
        client_type: clientTypes[Math.floor(Math.random() * clientTypes.length)],
        duration: durations[Math.floor(Math.random() * durations.length)],
        team_size: teamSizes[Math.floor(Math.random() * teamSizes.length)],
        success: success,
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        quarter: Math.floor(Math.random() * 4) + 1
      });
    }

    return data;
  }

  private generateSyntheticMarketingData(count: number): any[] {
    const campaignTypes = ['Content Marketing B2B', 'Événements & Salons', 'Email Marketing', 'SEO/Inbound'];
    const channels = ['LinkedIn', 'Événements', 'Email', 'SEO'];
    const audiences = ['Directeurs IT', 'Chefs de Projet', 'Architectes', 'Développeurs'];

    const data = [];
    for (let i = 1; i <= count; i++) {
      const budget = Math.floor(Math.random() * 200000) + 20000; // 20k à 220k
      const roi = Math.floor(Math.random() * 400) + 200; // 200% à 600%
      const conversionRate = Math.random() * 20; // 0% à 20%
      
      data.push({
        campaign_id: i,
        campaign_type: campaignTypes[Math.floor(Math.random() * campaignTypes.length)],
        channel: channels[Math.floor(Math.random() * channels.length)],
        target_audience: audiences[Math.floor(Math.random() * audiences.length)],
        budget: budget,
        roi: roi,
        conversion_rate: conversionRate,
        date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        quarter: Math.floor(Math.random() * 4) + 1
      });
    }

    return data;
  }

  /**
   * Transforme les patterns de l'API en format compatible avec le dashboard
   */
  transformPatternsForDashboard(apiPatterns: any, businessType: 'sales' | 'marketing' | 'both'): any {
    if (businessType === 'sales' || businessType === 'both') {
      return this.transformSalesPatterns(apiPatterns.sales);
    } else if (businessType === 'marketing' || businessType === 'both') {
      return this.transformMarketingPatterns(apiPatterns.marketing);
    }
    
    return {};
  }

  private transformSalesPatterns(salesPatterns: any): any {
    if (!salesPatterns) return {};

    return {
      winningConfigurations: salesPatterns.winning_configurations || [],
      sectorPerformance: salesPatterns.sector_performance || [],
      seasonalPatterns: salesPatterns.seasonal_patterns || []
    };
  }

  private transformMarketingPatterns(marketingPatterns: any): any {
    if (!marketingPatterns) return {};

    return {
      campaignSuccess: marketingPatterns.campaign_success || [],
      channelPerformance: marketingPatterns.channel_performance || [],
      audienceInsights: marketingPatterns.audience_insights || []
    };
  }
}

// Instance singleton du service
export const patternService = new PatternService();

// Export par défaut
export default patternService; 