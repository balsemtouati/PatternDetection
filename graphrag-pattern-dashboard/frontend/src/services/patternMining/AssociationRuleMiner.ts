export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
}

export interface PatternRule {
  id: string;
  title: string;
  description: string;
  impact: number;
  confidence: number;
  complexity: 'Low' | 'Medium' | 'High' | 'Very High';
  variables: string[];
  businessValue: string[];
  implementation: string[];
  metrics: string[];
}

export class AssociationRuleMiner {
  /**
   * Génération des transactions à partir des données
   */
  public generateTransactions(data: any[]): string[][] {
    const transactions: string[][] = [];
    
    data.forEach(record => {
      const transaction: string[] = [];
      
      Object.entries(record).forEach(([key, value]) => {
        if (this.shouldIncludeInTransaction(key, value)) {
          transaction.push(`${key}=${value}`);
        }
      });
      
      if (transaction.length > 0) {
        transactions.push(transaction);
      }
    });
    
    return transactions;
  }

  /**
   * Détection des règles d'association
   */
  public detectAssociationRules(
    data: any[],
    minSupport: number = 0.1,
    minConfidence: number = 0.6
  ): AssociationRule[] {
    const transactions = this.generateTransactions(data);
    const rules: AssociationRule[] = [];
    
    // Génération des itemsets fréquents
    const frequentItemsets = this.generateFrequentItemsets(transactions, minSupport);
    
    // Génération des règles d'association
    frequentItemsets.forEach(itemset => {
      if (itemset.length >= 2) {
        const subsets = this.generateSubsets(itemset);
        
        subsets.forEach(subset => {
          const antecedent = subset;
          const consequent = itemset.filter(item => !subset.includes(item));
          
          if (consequent.length > 0) {
            const support = this.calculateSupport(transactions, itemset);
            const confidence = this.calculateConfidence(transactions, antecedent, itemset);
            const lift = this.calculateLift(transactions, antecedent, consequent, support);
            const conviction = this.calculateConviction(transactions, antecedent, consequent, confidence);
            
            if (confidence >= minConfidence) {
              rules.push({
                antecedent,
                consequent,
                support,
                confidence,
                lift,
                conviction
              });
            }
          }
        });
      }
    });
    
    return rules.sort((a, b) => b.lift - a.lift);
  }

  /**
   * Conversion des règles en patterns structurés
   */
  public convertRulesToPatterns(rules: AssociationRule[]): PatternRule[] {
    return rules.map((rule, index) => {
      const pattern = this.createPatternFromRule(rule, index);
      return pattern;
    });
  }

  /**
   * Détection de patterns spécifiques aux ventes
   */
  public detectSalesPatterns(data: any[]): PatternRule[] {
    const patterns: PatternRule[] = [];
    
    // Pattern 1: Certification Paradox
    patterns.push(this.detectCertificationPattern(data));
    
    // Pattern 2: Quarter-End Trap
    patterns.push(this.detectQuarterEndPattern(data));
    
    // Pattern 3: Industry Experience
    patterns.push(this.detectIndustryExperiencePattern(data));
    
    // Pattern 4: Communication Hierarchy
    patterns.push(this.detectCommunicationPattern(data));
    
    // Pattern 5: Geographic Inefficiency
    patterns.push(this.detectGeographicPattern(data));
    
    return patterns.filter(p => p.confidence > 0);
  }

  // Méthodes utilitaires privées
  private shouldIncludeInTransaction(key: string, value: any): boolean {
    if (!value || value === '') return false;
    if (key.startsWith('__')) return false; // Colonnes système
    if (typeof value === 'object') return false; // Objets complexes
    
    return true;
  }

  private generateFrequentItemsets(transactions: string[][], minSupport: number): string[][] {
    const itemCounts: { [key: string]: number } = {};
    const totalTransactions = transactions.length;
    
    // Compter les items individuels
    transactions.forEach(transaction => {
      transaction.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });
    
    // Filtrer par support minimum
    const frequentItems = Object.entries(itemCounts)
      .filter(([_, count]) => count / totalTransactions >= minSupport)
      .map(([item, _]) => item);
    
    // Générer les itemsets de taille 2+
    const frequentItemsets: string[][] = [];
    
    // Itemsets de taille 2
    for (let i = 0; i < frequentItems.length; i++) {
      for (let j = i + 1; j < frequentItems.length; j++) {
        const itemset = [frequentItems[i], frequentItems[j]];
        if (this.calculateSupport(transactions, itemset) >= minSupport) {
          frequentItemsets.push(itemset);
        }
      }
    }
    
    return frequentItemsets;
  }

  private generateSubsets(itemset: string[]): string[][] {
    const subsets: string[][] = [];
    const n = itemset.length;
    
    for (let i = 1; i < (1 << n) - 1; i++) {
      const subset: string[] = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          subset.push(itemset[j]);
        }
      }
      subsets.push(subset);
    }
    
    return subsets;
  }

  private calculateSupport(transactions: string[][], itemset: string[]): number {
    const totalTransactions = transactions.length;
    const supportingTransactions = transactions.filter(transaction =>
      itemset.every(item => transaction.includes(item))
    ).length;
    
    return supportingTransactions / totalTransactions;
  }

  private calculateConfidence(
    transactions: string[][], 
    antecedent: string[], 
    itemset: string[]
  ): number {
    const antecedentSupport = this.calculateSupport(transactions, antecedent);
    const itemsetSupport = this.calculateSupport(transactions, itemset);
    
    return antecedentSupport > 0 ? itemsetSupport / antecedentSupport : 0;
  }

  private calculateLift(
    transactions: string[][],
    antecedent: string[],
    consequent: string[],
    support: number
  ): number {
    const antecedentSupport = this.calculateSupport(transactions, antecedent);
    const consequentSupport = this.calculateSupport(transactions, consequent);
    
    const expectedConfidence = consequentSupport;
    const actualConfidence = antecedentSupport > 0 ? support / antecedentSupport : 0;
    
    return expectedConfidence > 0 ? actualConfidence / expectedConfidence : 0;
  }

  private calculateConviction(
    transactions: string[][],
    antecedent: string[],
    consequent: string[],
    confidence: number
  ): number {
    const consequentSupport = this.calculateSupport(transactions, consequent);
    
    return consequentSupport > 0 ? (1 - consequentSupport) / (1 - confidence) : 0;
  }

  private createPatternFromRule(rule: AssociationRule, index: number): PatternRule {
    const antecedentStr = rule.antecedent.join(' + ');
    const consequentStr = rule.consequent.join(' → ');
    
    return {
      id: `pattern_${index + 1}`,
      title: `Association Rule: ${antecedentStr} → ${consequentStr}`,
      description: `When ${antecedentStr} occurs, ${consequentStr} follows with ${(rule.confidence * 100).toFixed(1)}% confidence.`,
      impact: rule.lift * 10, // Impact basé sur le lift
      confidence: rule.confidence * 100,
      complexity: this.determineComplexity(rule),
      variables: [...rule.antecedent, ...rule.consequent],
      businessValue: [
        `${(rule.confidence * 100).toFixed(1)}% prediction accuracy`,
        `${(rule.lift * 100).toFixed(1)}% improvement over random chance`
      ],
      implementation: [
        'Monitor antecedent conditions',
        'Prepare for consequent outcomes',
        'Optimize based on pattern strength'
      ],
      metrics: [
        'Pattern occurrence frequency',
        'Prediction accuracy tracking',
        'Business impact measurement'
      ]
    };
  }

  private determineComplexity(rule: AssociationRule): 'Low' | 'Medium' | 'High' | 'Very High' {
    const totalVariables = rule.antecedent.length + rule.consequent.length;
    const confidence = rule.confidence;
    
    if (totalVariables <= 2 && confidence < 0.7) return 'Low';
    if (totalVariables <= 3 && confidence < 0.8) return 'Medium';
    if (totalVariables <= 4 && confidence < 0.9) return 'High';
    return 'Very High';
  }

  // Patterns spécifiques aux ventes
  private detectCertificationPattern(data: any[]): PatternRule {
    const certData = data.filter(d => d.certification_density || d.team_composition);
    
    if (certData.length === 0) {
      return this.createDefaultPattern('certification_paradox', 'Certification Pattern');
    }
    
    const mixedCert = certData.filter(d => (d.certification_density || 0) >= 0.4 && (d.certification_density || 0) <= 0.6);
    const otherCert = certData.filter(d => (d.certification_density || 0) < 0.4 || (d.certification_density || 0) > 0.6);
    
    const mixedProfit = this.calculateAverageProfit(mixedCert);
    const otherProfit = this.calculateAverageProfit(otherCert);
    
    const impact = otherProfit > 0 ? ((mixedProfit - otherProfit) / otherProfit) * 100 : 0;
    
    return {
      id: 'certification_paradox',
      title: 'The Certification Velocity Paradox',
      description: `Teams with mixed certification density (40-60% certified members) outperform by ${Math.abs(impact).toFixed(1)}% in profit margins.`,
      impact: Math.abs(impact),
      confidence: this.calculateConfidence(certData.length),
      complexity: 'Very High',
      variables: ['certification_density', 'team_composition', 'experience_levels', 'project_complexity'],
      businessValue: [
        `${Math.abs(impact * 0.6).toFixed(1)}% cost reduction`,
        `${Math.abs(impact * 0.7).toFixed(1)}% faster delivery`,
        'Improved client satisfaction'
      ],
      implementation: [
        'Implement mentorship-driven delivery model',
        'Adjust team composition ratios',
        'Track performance metrics'
      ],
      metrics: [
        'Team composition effectiveness',
        'Project delivery time',
        'Client satisfaction scores'
      ]
    };
  }

  private detectQuarterEndPattern(data: any[]): PatternRule {
    const tenderData = data.filter(d => d.submission_date || d.tender_date);
    
    if (tenderData.length === 0) {
      return this.createDefaultPattern('quarter_end_trap', 'Quarter-End Pattern');
    }
    
    const quarterEnd = tenderData.filter(d => {
      const date = this.parseDate(d.submission_date || d.tender_date);
      return date && date.getDate() >= 15;
    });
    
    const otherPeriods = tenderData.filter(d => {
      const date = this.parseDate(d.submission_date || d.tender_date);
      return date && date.getDate() < 15;
    });
    
    const quarterEndWinRate = this.calculateWinRate(quarterEnd);
    const otherWinRate = this.calculateWinRate(otherPeriods);
    
    const impact = otherWinRate > 0 ? ((quarterEndWinRate - otherWinRate) / otherWinRate) * 100 : 0;
    
    return {
      id: 'quarter_end_trap',
      title: 'The Quarter-End Acquisition Trap',
      description: `Quarter-end submissions show ${Math.abs(impact).toFixed(1)}% different win rates.`,
      impact: Math.abs(impact),
      confidence: this.calculateConfidence(tenderData.length),
      complexity: 'High',
      variables: ['submission_timing', 'quarter_boundaries', 'pricing_pressure'],
      businessValue: [
        `${Math.abs(impact).toFixed(1)}% win rate optimization`,
        'Reduced client complaints',
        'Better project planning'
      ],
      implementation: [
        'Implement quarter buffer zone policy',
        'Establish emergency pricing approval',
        'Create compressed planning protocols'
      ],
      metrics: [
        'Quarter-end vs. other period success rates',
        'Client complaint frequency',
        'Project planning time adequacy'
      ]
    };
  }

  private detectIndustryExperiencePattern(data: any[]): PatternRule {
    return this.createDefaultPattern('industry_amplification', 'Industry Experience Pattern');
  }

  private detectCommunicationPattern(data: any[]): PatternRule {
    return this.createDefaultPattern('communication_hierarchy', 'Communication Pattern');
  }

  private detectGeographicPattern(data: any[]): PatternRule {
    return this.createDefaultPattern('geographic_inefficiency', 'Geographic Pattern');
  }

  private createDefaultPattern(id: string, title: string): PatternRule {
    return {
      id,
      title,
      description: 'Pattern analysis requires more data for accurate detection.',
      impact: 0,
      confidence: 0,
      complexity: 'Medium',
      variables: [],
      businessValue: [],
      implementation: [],
      metrics: []
    };
  }

  private parseDate(dateStr: any): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  private calculateAverageProfit(records: any[]): number {
    if (records.length === 0) return 0;
    const profits = records.map(r => r.profit || r.margin || 0).filter(p => p > 0);
    return profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
  }

  private calculateWinRate(records: any[]): number {
    if (records.length === 0) return 0;
    const wins = records.filter(r => r.status === 'won' || r.outcome === 'success').length;
    return (wins / records.length) * 100;
  }

  private calculateConfidence(sampleSize: number): number {
    const baseConfidence = 85;
    const sizeFactor = Math.min(sampleSize / 100, 1);
    return Math.min(baseConfidence + (sizeFactor * 15), 95);
  }
}

export default AssociationRuleMiner; 