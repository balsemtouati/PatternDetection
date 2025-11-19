export interface PatternScore {
  patternId: string;
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  impact: number;
  complexity: number;
  overallScore: number;
}

export interface ScoredPattern {
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
  scores: PatternScore;
}

export class PatternScorer {
  /**
   * Score et filtre les patterns
   */
  public scoreAndFilterPatterns(
    patterns: any[],
    maxPatterns: number = 10,
    minConfidence: number = 0.6,
    minSupport: number = 0.1
  ): ScoredPattern[] {
    const scoredPatterns = patterns.map(pattern => ({
      ...pattern,
      scores: this.calculatePatternScores(pattern)
    }));
    
    // Filtrer par seuils minimum
    const filteredPatterns = scoredPatterns.filter(pattern => 
      pattern.scores.confidence >= minConfidence &&
      pattern.scores.support >= minSupport
    );
    
    // Trier par score global
    const sortedPatterns = filteredPatterns.sort((a, b) => 
      b.scores.overallScore - a.scores.overallScore
    );
    
    // Retourner le top N
    return sortedPatterns.slice(0, maxPatterns);
  }

  /**
   * Calcul des scores pour un pattern
   */
  private calculatePatternScores(pattern: any): PatternScore {
    const support = this.calculateSupport(pattern);
    const confidence = this.calculateConfidence(pattern);
    const lift = this.calculateLift(pattern);
    const conviction = this.calculateConviction(pattern);
    const impact = this.calculateImpact(pattern);
    const complexity = this.calculateComplexity(pattern);
    
    const overallScore = this.calculateOverallScore({
      support,
      confidence,
      lift,
      conviction,
      impact,
      complexity
    });
    
    return {
      patternId: pattern.id,
      support,
      confidence,
      lift,
      conviction,
      impact,
      complexity,
      overallScore
    };
  }

  /**
   * Calcul du support (fréquence d'apparition)
   */
  private calculateSupport(pattern: any): number {
    // Basé sur la complexité et la spécificité du pattern
    const baseSupport = 0.3;
    const complexityFactor = this.getComplexityFactor(pattern.complexity);
    const variableFactor = Math.max(0.1, 1 - (pattern.variables.length * 0.1));
    
    return Math.min(1, baseSupport * complexityFactor * variableFactor);
  }

  /**
   * Calcul de la confiance
   */
  private calculateConfidence(pattern: any): number {
    // Utiliser la confiance fournie ou calculer
    if (pattern.confidence) {
      return pattern.confidence / 100; // Convertir de pourcentage
    }
    
    // Calcul basé sur l'impact et la complexité
    const baseConfidence = 0.7;
    const impactFactor = Math.min(1, pattern.impact / 100);
    const complexityFactor = this.getComplexityFactor(pattern.complexity);
    
    return Math.min(1, baseConfidence * impactFactor * complexityFactor);
  }

  /**
   * Calcul du lift (amélioration par rapport au hasard)
   */
  private calculateLift(pattern: any): number {
    const confidence = this.calculateConfidence(pattern);
    const support = this.calculateSupport(pattern);
    
    // Lift = confidence / support (si support > 0)
    return support > 0 ? confidence / support : 1;
  }

  /**
   * Calcul de la conviction
   */
  private calculateConviction(pattern: any): number {
    const confidence = this.calculateConfidence(pattern);
    const support = this.calculateSupport(pattern);
    
    // Conviction = (1 - support) / (1 - confidence)
    return confidence < 1 ? (1 - support) / (1 - confidence) : 1;
  }

  /**
   * Calcul de l'impact
   */
  private calculateImpact(pattern: any): number {
    // Utiliser l'impact fourni ou calculer
    if (pattern.impact) {
      return pattern.impact / 100; // Convertir de pourcentage
    }
    
    // Calcul basé sur les variables et la complexité
    const baseImpact = 0.5;
    const variableFactor = Math.min(1, pattern.variables.length / 5);
    const complexityFactor = this.getComplexityFactor(pattern.complexity);
    
    return Math.min(1, baseImpact * variableFactor * complexityFactor);
  }

  /**
   * Calcul de la complexité
   */
  private calculateComplexity(pattern: any): number {
    const complexityMap = {
      'Low': 0.2,
      'Medium': 0.5,
      'High': 0.8,
      'Very High': 1.0
    };
    
    return complexityMap[pattern.complexity] || 0.5;
  }

  /**
   * Calcul du score global
   */
  private calculateOverallScore(scores: Omit<PatternScore, 'patternId' | 'overallScore'>): number {
    // Pondération des différents scores
    const weights = {
      support: 0.15,
      confidence: 0.25,
      lift: 0.20,
      conviction: 0.10,
      impact: 0.25,
      complexity: 0.05
    };
    
    const weightedScore = 
      scores.support * weights.support +
      scores.confidence * weights.confidence +
      Math.min(scores.lift, 5) / 5 * weights.lift + // Normaliser le lift
      Math.min(scores.conviction, 10) / 10 * weights.conviction + // Normaliser la conviction
      scores.impact * weights.impact +
      (1 - scores.complexity) * weights.complexity; // Inverser la complexité (moins = mieux)
    
    return Math.min(1, weightedScore);
  }

  /**
   * Facteur de complexité
   */
  private getComplexityFactor(complexity: string): number {
    const factors = {
      'Low': 1.2,
      'Medium': 1.0,
      'High': 0.8,
      'Very High': 0.6
    };
    
    return factors[complexity] || 1.0;
  }

  /**
   * Validation des patterns
   */
  public validatePatterns(patterns: ScoredPattern[]): {
    valid: ScoredPattern[];
    invalid: Array<{ pattern: ScoredPattern; reason: string }>;
  } {
    const valid: ScoredPattern[] = [];
    const invalid: Array<{ pattern: ScoredPattern; reason: string }> = [];
    
    patterns.forEach(pattern => {
      const validation = this.validatePattern(pattern);
      if (validation.isValid) {
        valid.push(pattern);
      } else {
        invalid.push({ pattern, reason: validation.reason });
      }
    });
    
    return { valid, invalid };
  }

  /**
   * Validation d'un pattern individuel
   */
  private validatePattern(pattern: ScoredPattern): { isValid: boolean; reason?: string } {
    // Vérifier les champs requis
    if (!pattern.id || !pattern.title || !pattern.description) {
      return { isValid: false, reason: 'Missing required fields' };
    }
    
    // Vérifier les scores
    if (pattern.scores.confidence < 0.1) {
      return { isValid: false, reason: 'Confidence too low' };
    }
    
    if (pattern.scores.support < 0.05) {
      return { isValid: false, reason: 'Support too low' };
    }
    
    if (pattern.scores.overallScore < 0.3) {
      return { isValid: false, reason: 'Overall score too low' };
    }
    
    // Vérifier la cohérence
    if (pattern.scores.lift < 1 && pattern.scores.confidence > 0.8) {
      return { isValid: false, reason: 'Inconsistent lift and confidence' };
    }
    
    return { isValid: true };
  }

  /**
   * Génération de statistiques de scoring
   */
  public generateScoringStatistics(patterns: ScoredPattern[]): {
    totalPatterns: number;
    averageScores: {
      support: number;
      confidence: number;
      lift: number;
      conviction: number;
      impact: number;
      overall: number;
    };
    scoreDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    complexityDistribution: {
      low: number;
      medium: number;
      high: number;
      veryHigh: number;
    };
  } {
    if (patterns.length === 0) {
      return {
        totalPatterns: 0,
        averageScores: {
          support: 0,
          confidence: 0,
          lift: 0,
          conviction: 0,
          impact: 0,
          overall: 0
        },
        scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        complexityDistribution: { low: 0, medium: 0, high: 0, veryHigh: 0 }
      };
    }
    
    // Calcul des moyennes
    const averageScores = {
      support: patterns.reduce((sum, p) => sum + p.scores.support, 0) / patterns.length,
      confidence: patterns.reduce((sum, p) => sum + p.scores.confidence, 0) / patterns.length,
      lift: patterns.reduce((sum, p) => sum + p.scores.lift, 0) / patterns.length,
      conviction: patterns.reduce((sum, p) => sum + p.scores.conviction, 0) / patterns.length,
      impact: patterns.reduce((sum, p) => sum + p.scores.impact, 0) / patterns.length,
      overall: patterns.reduce((sum, p) => sum + p.scores.overallScore, 0) / patterns.length
    };
    
    // Distribution des scores
    const scoreDistribution = {
      excellent: patterns.filter(p => p.scores.overallScore >= 0.8).length,
      good: patterns.filter(p => p.scores.overallScore >= 0.6 && p.scores.overallScore < 0.8).length,
      fair: patterns.filter(p => p.scores.overallScore >= 0.4 && p.scores.overallScore < 0.6).length,
      poor: patterns.filter(p => p.scores.overallScore < 0.4).length
    };
    
    // Distribution de la complexité
    const complexityDistribution = {
      low: patterns.filter(p => p.complexity === 'Low').length,
      medium: patterns.filter(p => p.complexity === 'Medium').length,
      high: patterns.filter(p => p.complexity === 'High').length,
      veryHigh: patterns.filter(p => p.complexity === 'Very High').length
    };
    
    return {
      totalPatterns: patterns.length,
      averageScores,
      scoreDistribution,
      complexityDistribution
    };
  }
}

export default PatternScorer; 