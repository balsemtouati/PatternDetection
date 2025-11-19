import { CompetitorData, SalesPatterns, MarketingPatterns } from '../types';

/**
 * Données mock pour les concurrents
 */
export const mockCompetitors: { [key: string]: CompetitorData[] } = {
  'Technology': [
    {
      name: 'TechCorp Solutions',
      marketShare: 25.5,
      revenue: '€850M',
      growth: 12.3,
      strengths: ['Innovation', 'Market Presence', 'Technical Expertise'],
      weaknesses: ['High Costs', 'Complex Solutions'],
      trends: ['Cloud Migration', 'AI Integration']
    },
    {
      name: 'InnovateTech Systems',
      marketShare: 18.2,
      revenue: '€620M',
      growth: 15.7,
      strengths: ['Agile Development', 'Customer Focus', 'Cost Efficiency'],
      weaknesses: ['Limited Scale', 'Brand Recognition'],
      trends: ['SaaS Expansion', 'Partnerships']
    }
  ],
  'Finance': [
    {
      name: 'FinServe Pro',
      marketShare: 22.8,
      revenue: '€1.2B',
      growth: 8.9,
      strengths: ['Regulatory Compliance', 'Security', 'Industry Experience'],
      weaknesses: ['Slow Innovation', 'High Fees'],
      trends: ['Digital Banking', 'RegTech']
    }
  ],
  'Healthcare': [
    {
      name: 'HealthTech Solutions',
      marketShare: 15.6,
      revenue: '€450M',
      growth: 20.1,
      strengths: ['Medical Expertise', 'Compliance', 'Patient Focus'],
      weaknesses: ['High Development Costs', 'Long Sales Cycles'],
      trends: ['Telemedicine', 'AI Diagnostics']
    }
  ]
};

/**
 * Patterns de vente mock
 */
export const mockSalesPatterns: SalesPatterns = {
  winningConfigurations: [
    {
      id: 1,
      offerType: 'High-Tech Enterprise Package',
      successRate: 78.5,
      avgValue: 850000,
      context: {
        sector: 'Technology',
        duration: '6-12 months',
        teamSize: '8-15 consultants'
      },
      conditions: {
        priceRange: '€600k-1.2M',
        period: 'Q1-Q4',
        clientType: 'Enterprise'
      },
      patterns: ['Technical Expertise', 'Enterprise Support', 'Customization']
    },
    {
      id: 2,
      offerType: 'SaaS Quick Start',
      successRate: 85.2,
      avgValue: 125000,
      context: {
        sector: 'Technology',
        duration: '2-4 months',
        teamSize: '3-6 consultants'
      },
      conditions: {
        priceRange: '€80k-200k',
        period: 'Q2-Q3',
        clientType: 'Mid-Market'
      },
      patterns: ['Ease of Use', 'Quick ROI', 'Cloud Native']
    }
  ],
  sectorPerformance: [
    {
      sector: 'Technology',
      winRate: 72.3,
      avgDealSize: 450000
    },
    {
      sector: 'Finance',
      winRate: 68.7,
      avgDealSize: 680000
    },
    {
      sector: 'Healthcare',
      winRate: 75.1,
      avgDealSize: 320000
    }
  ],
  seasonalPatterns: [
    {
      quarter: 'Q4',
      winRate: 82.1,
      avgDealSize: 520000
    },
    {
      quarter: 'Q1',
      winRate: 58.3,
      avgDealSize: 280000
    }
  ]
};

/**
 * Patterns marketing mock
 */
export const mockMarketingPatterns: MarketingPatterns = {
  campaignSuccess: [
    {
      id: 1,
      campaignType: 'Digital Transformation Campaign',
      successRate: 91,
      avgROI: 420,
      context: {
        channel: 'LinkedIn',
        targetAudience: 'C-Level Executives',
        duration: '4-8 months'
      },
      conditions: {
        budgetRange: '€80k-150k',
        period: 'Q1-Q4',
        contentType: 'Thought Leadership'
      },
      patterns: ['Whitepaper 15 pages', 'Webinar 45 min', 'Case study 3 pages']
    },
    {
      id: 2,
      campaignType: 'SaaS Solution Launch',
      successRate: 88,
      avgROI: 380,
      context: {
        channel: 'Email Marketing',
        targetAudience: 'IT Managers',
        duration: '2-4 months'
      },
      conditions: {
        budgetRange: '€30k-60k',
        period: 'Q2-Q3',
        contentType: 'Product Marketing'
      },
      patterns: ['Email sequence 5 emails', 'Product demo 30 min', 'Free trial 14 days']
    }
  ],
  channelPerformance: [
    {
      channel: 'LinkedIn',
      conversionRate: 12.5,
      avgCPL: 180
    },
    {
      channel: 'Email Marketing',
      conversionRate: 8.8,
      avgCPL: 75
    },
    {
      channel: 'Content Marketing',
      conversionRate: 15.3,
      avgCPL: 95
    }
  ],
  audienceInsights: [
    {
      segment: 'Enterprise Decision Makers',
      engagement: 94,
      conversionRate: 18.5
    },
    {
      segment: 'Mid-Market IT Managers',
      engagement: 89,
      conversionRate: 14.2
    }
  ]
};

/**
 * Données de test pour l'analyse de patterns
 */
export const mockTestData = {
  crm: Array.from({ length: 500 }, (_, i) => ({
    id: i,
    client_name: `Client ${i}`,
    deal_value: Math.random() * 1000000 + 50000,
    status: ['won', 'lost', 'pending'][Math.floor(Math.random() * 3)],
    submission_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    team_size: Math.floor(Math.random() * 10) + 1,
    certification_density: Math.random(),
    sector: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][Math.floor(Math.random() * 5)],
    quarter: `Q${Math.floor(Math.random() * 4) + 1}`,
    profit_margin: Math.random() * 0.4 + 0.1,
    client_satisfaction: Math.random() * 5 + 1,
    project_duration: Math.floor(Math.random() * 24) + 1,
    team_composition: ['senior', 'mixed', 'junior'][Math.floor(Math.random() * 3)],
    location: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nantes'][Math.floor(Math.random() * 5)],
    acquisition_channel: ['LinkedIn', 'RFP', 'Referral', 'Website', 'Event'][Math.floor(Math.random() * 5)]
  })),
  
  erp: Array.from({ length: 300 }, (_, i) => ({
    id: i,
    project_id: `PROJ-${i}`,
    budget: Math.random() * 500000 + 100000,
    actual_cost: Math.random() * 450000 + 80000,
    completion_rate: Math.random() * 100,
    start_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    end_date: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
    team_size: Math.floor(Math.random() * 15) + 2,
    project_type: ['Development', 'Consulting', 'Integration', 'Migration', 'Support'][Math.floor(Math.random() * 5)],
    client_industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][Math.floor(Math.random() * 5)],
    risk_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    quality_score: Math.random() * 10 + 1
  })),
  
  financial: Array.from({ length: 200 }, (_, i) => ({
    id: i,
    revenue: Math.random() * 2000000 + 500000,
    costs: Math.random() * 1500000 + 300000,
    profit: Math.random() * 500000 + 100000,
    month: Math.floor(Math.random() * 12) + 1,
    year: 2023,
    department: ['Sales', 'Marketing', 'Development', 'Support', 'Consulting'][Math.floor(Math.random() * 5)],
    region: ['North', 'South', 'East', 'West', 'Central'][Math.floor(Math.random() * 5)],
    employee_count: Math.floor(Math.random() * 50) + 10,
    efficiency_score: Math.random() * 100
  }))
};

export default {
  mockCompetitors,
  mockSalesPatterns,
  mockMarketingPatterns,
  mockTestData
}; 