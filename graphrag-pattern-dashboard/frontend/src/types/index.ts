export type BusinessType = 'sales' | 'marketing' | 'both' | null;
export type ActiveSection = 'home' | 'competitors' | 'company-tracker' | 'decision-assistant' | 'sales-dashboard' | 'marketing-dashboard' | 'sales-patterns' | 'marketing-patterns';

export interface Company {
  name: string;
  industry: string;
  businessType: BusinessType;
  competitors?: string[];
}

export interface CompetitorData {
  name: string;
  marketShare: number;
  revenue: string;
  growth: number;
  strengths: string[];
  weaknesses: string[];
  trends: string[];
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface WinningConfiguration {
  id: number;
  offerType: string;
  successRate: number;
  avgValue: number;
  context: {
    sector: string;
    duration: string;
    teamSize: string;
  };
  conditions: {
    priceRange: string;
    period: string;
    clientType: string;
  };
  patterns: string[];
}

export interface SectorPerformance {
  sector: string;
  winRate: number;
  avgDealSize: number;
}

export interface SeasonalPattern {
  quarter: string;
  winRate: number;
  avgDealSize: number;
}

export interface SalesPatterns {
  winningConfigurations: WinningConfiguration[];
  sectorPerformance: SectorPerformance[];
  seasonalPatterns: SeasonalPattern[];
}

export interface CampaignSuccess {
  id: number;
  campaignType: string;
  successRate: number;
  avgROI: number;
  context: {
    channel: string;
    targetAudience: string;
    duration: string;
  };
  conditions: {
    budgetRange: string;
    period: string;
    contentType: string;
  };
  patterns: string[];
}

export interface ChannelPerformance {
  channel: string;
  conversionRate: number;
  avgCPL: number;
}

export interface AudienceInsight {
  segment: string;
  engagement: number;
  conversionRate: number;
}

export interface MarketingPatterns {
  campaignSuccess: CampaignSuccess[];
  channelPerformance: ChannelPerformance[];
  audienceInsights: AudienceInsight[];
}

export interface SidebarSection {
  id: ActiveSection;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
} 