export interface TemporalPattern {
  id: string;
  title: string;
  description: string;
  pattern: 'seasonal' | 'trend' | 'cyclic' | 'anomaly';
  confidence: number;
  impact: number;
  timeRange: {
    start: string;
    end: string;
    frequency: string;
  };
  variables: string[];
}

export class TemporalPatternMiner {
  /**
   * Détection des patterns temporels
   */
  public detectTemporalPatterns(data: any[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Patterns saisonniers
    patterns.push(...this.detectSeasonalPatterns(data));
    
    // Patterns de tendance
    patterns.push(...this.detectTrendPatterns(data));
    
    // Patterns cycliques
    patterns.push(...this.detectCyclicPatterns(data));
    
    // Anomalies temporelles
    patterns.push(...this.detectTemporalAnomalies(data));
    
    return patterns.filter(p => p.confidence > 0);
  }

  /**
   * Détection des patterns saisonniers
   */
  private detectSeasonalPatterns(data: any[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Analyse par mois
    const monthlyData = this.groupByMonth(data);
    const seasonalMonths = this.findSeasonalMonths(monthlyData);
    
    if (seasonalMonths.length > 0) {
      patterns.push({
        id: 'seasonal_monthly',
        title: 'Monthly Seasonal Pattern',
        description: `Sales show seasonal variations with peaks in ${seasonalMonths.join(', ')}`,
        pattern: 'seasonal',
        confidence: this.calculateSeasonalConfidence(monthlyData),
        impact: this.calculateSeasonalImpact(monthlyData),
        timeRange: {
          start: 'January',
          end: 'December',
          frequency: 'monthly'
        },
        variables: ['month', 'sales_volume', 'revenue']
      });
    }
    
    // Analyse par trimestre
    const quarterlyData = this.groupByQuarter(data);
    const seasonalQuarters = this.findSeasonalQuarters(quarterlyData);
    
    if (seasonalQuarters.length > 0) {
      patterns.push({
        id: 'seasonal_quarterly',
        title: 'Quarterly Seasonal Pattern',
        description: `Performance varies by quarter with strongest performance in Q${seasonalQuarters.join(', Q')}`,
        pattern: 'seasonal',
        confidence: this.calculateSeasonalConfidence(quarterlyData),
        impact: this.calculateSeasonalImpact(quarterlyData),
        timeRange: {
          start: 'Q1',
          end: 'Q4',
          frequency: 'quarterly'
        },
        variables: ['quarter', 'performance_metrics', 'revenue']
      });
    }
    
    return patterns;
  }

  /**
   * Détection des patterns de tendance
   */
  private detectTrendPatterns(data: any[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Tendance des ventes
    const salesTrend = this.calculateSalesTrend(data);
    
    if (Math.abs(salesTrend) > 0.1) {
      patterns.push({
        id: 'sales_trend',
        title: 'Sales Trend Pattern',
        description: `Sales show a ${salesTrend > 0 ? 'positive' : 'negative'} trend of ${Math.abs(salesTrend * 100).toFixed(1)}% per period`,
        pattern: 'trend',
        confidence: this.calculateTrendConfidence(data),
        impact: Math.abs(salesTrend * 100),
        timeRange: {
          start: this.getEarliestDate(data),
          end: this.getLatestDate(data),
          frequency: 'continuous'
        },
        variables: ['time', 'sales_volume', 'revenue']
      });
    }
    
    return patterns;
  }

  /**
   * Détection des patterns cycliques
   */
  private detectCyclicPatterns(data: any[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Cycles hebdomadaires
    const weeklyCycles = this.detectWeeklyCycles(data);
    if (weeklyCycles.length > 0) {
      patterns.push({
        id: 'weekly_cycles',
        title: 'Weekly Performance Cycles',
        description: `Performance varies by day of week with peaks on ${weeklyCycles.join(', ')}`,
        pattern: 'cyclic',
        confidence: this.calculateCyclicConfidence(data),
        impact: this.calculateCyclicImpact(data),
        timeRange: {
          start: 'Monday',
          end: 'Sunday',
          frequency: 'weekly'
        },
        variables: ['day_of_week', 'performance', 'activity_level']
      });
    }
    
    return patterns;
  }

  /**
   * Détection des anomalies temporelles
   */
  private detectTemporalAnomalies(data: any[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    // Anomalies de performance
    const anomalies = this.findPerformanceAnomalies(data);
    
    anomalies.forEach((anomaly, index) => {
      patterns.push({
        id: `anomaly_${index + 1}`,
        title: `Performance Anomaly - ${anomaly.date}`,
        description: `Unusual performance pattern detected on ${anomaly.date} with ${anomaly.deviation}% deviation from normal`,
        pattern: 'anomaly',
        confidence: anomaly.confidence,
        impact: Math.abs(anomaly.deviation),
        timeRange: {
          start: anomaly.date,
          end: anomaly.date,
          frequency: 'single_event'
        },
        variables: ['date', 'performance', 'deviation']
      });
    });
    
    return patterns;
  }

  // Méthodes utilitaires
  private groupByMonth(data: any[]): { [key: string]: any[] } {
    const monthly: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      const date = this.parseDate(record.date || record.created_date || record.submission_date);
      if (date) {
        const month = date.getMonth();
        const monthKey = month.toString();
        if (!monthly[monthKey]) monthly[monthKey] = [];
        monthly[monthKey].push(record);
      }
    });
    
    return monthly;
  }

  private groupByQuarter(data: any[]): { [key: string]: any[] } {
    const quarterly: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      const date = this.parseDate(record.date || record.created_date || record.submission_date);
      if (date) {
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        const quarterKey = `Q${quarter}`;
        if (!quarterly[quarterKey]) quarterly[quarterKey] = [];
        quarterly[quarterKey].push(record);
      }
    });
    
    return quarterly;
  }

  private findSeasonalMonths(monthlyData: { [key: string]: any[] }): string[] {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const averages = Object.entries(monthlyData).map(([month, records]) => ({
      month: monthNames[parseInt(month)],
      average: this.calculateAverageValue(records)
    }));
    
    const overallAverage = averages.reduce((sum, m) => sum + m.average, 0) / averages.length;
    const threshold = overallAverage * 0.2; // 20% au-dessus de la moyenne
    
    return averages
      .filter(m => m.average > overallAverage + threshold)
      .map(m => m.month);
  }

  private findSeasonalQuarters(quarterlyData: { [key: string]: any[] }): string[] {
    const averages = Object.entries(quarterlyData).map(([quarter, records]) => ({
      quarter: quarter.replace('Q', ''),
      average: this.calculateAverageValue(records)
    }));
    
    const overallAverage = averages.reduce((sum, q) => sum + q.average, 0) / averages.length;
    const threshold = overallAverage * 0.15; // 15% au-dessus de la moyenne
    
    return averages
      .filter(q => q.average > overallAverage + threshold)
      .map(q => q.quarter);
  }

  private calculateSalesTrend(data: any[]): number {
    const timeSeriesData = data
      .map(record => ({
        date: this.parseDate(record.date || record.created_date),
        value: record.value || record.amount || record.revenue || 0
      }))
      .filter(d => d.date && d.value > 0)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
    
    if (timeSeriesData.length < 2) return 0;
    
    // Calcul de la tendance linéaire
    const n = timeSeriesData.length;
    const sumX = timeSeriesData.reduce((sum, _, i) => sum + i, 0);
    const sumY = timeSeriesData.reduce((sum, d) => sum + d.value, 0);
    const sumXY = timeSeriesData.reduce((sum, d, i) => sum + (i * d.value), 0);
    const sumX2 = timeSeriesData.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = sumY / n;
    
    return avgValue > 0 ? slope / avgValue : 0;
  }

  private detectWeeklyCycles(data: any[]): string[] {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      const date = this.parseDate(record.date || record.created_date);
      if (date) {
        const day = date.getDay();
        const dayKey = day.toString();
        if (!dailyData[dayKey]) dailyData[dayKey] = [];
        dailyData[dayKey].push(record);
      }
    });
    
    const averages = Object.entries(dailyData).map(([day, records]) => ({
      day: dayNames[parseInt(day)],
      average: this.calculateAverageValue(records)
    }));
    
    const overallAverage = averages.reduce((sum, d) => sum + d.average, 0) / averages.length;
    const threshold = overallAverage * 0.1; // 10% au-dessus de la moyenne
    
    return averages
      .filter(d => d.average > overallAverage + threshold)
      .map(d => d.day);
  }

  private findPerformanceAnomalies(data: any[]): Array<{
    date: string;
    deviation: number;
    confidence: number;
  }> {
    const timeSeriesData = data
      .map(record => ({
        date: this.parseDate(record.date || record.created_date),
        value: record.value || record.amount || record.revenue || 0
      }))
      .filter(d => d.date && d.value > 0)
      .sort((a, b) => a.date!.getTime() - b.date!.getTime());
    
    if (timeSeriesData.length < 10) return [];
    
    const values = timeSeriesData.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const threshold = 2 * stdDev; // 2 écarts-types
    
    const anomalies: Array<{
      date: string;
      deviation: number;
      confidence: number;
    }> = [];
    
    timeSeriesData.forEach((d, i) => {
      const deviation = Math.abs(d.value - mean);
      if (deviation > threshold) {
        anomalies.push({
          date: d.date!.toISOString().split('T')[0],
          deviation: ((d.value - mean) / mean) * 100,
          confidence: Math.min(95, 85 + (deviation / threshold) * 10)
        });
      }
    });
    
    return anomalies;
  }

  // Méthodes de calcul
  private calculateSeasonalConfidence(data: { [key: string]: any[] }): number {
    const periods = Object.keys(data).length;
    const baseConfidence = 70;
    const periodFactor = Math.min(periods / 4, 1) * 20;
    return Math.min(baseConfidence + periodFactor, 95);
  }

  private calculateSeasonalImpact(data: { [key: string]: any[] }): number {
    const averages = Object.values(data).map(records => this.calculateAverageValue(records));
    if (averages.length === 0) return 0;
    
    const maxAvg = Math.max(...averages);
    const minAvg = Math.min(...averages);
    const overallAvg = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
    
    return overallAvg > 0 ? ((maxAvg - minAvg) / overallAvg) * 100 : 0;
  }

  private calculateTrendConfidence(data: any[]): number {
    const timeSeriesData = data.filter(d => d.date || d.created_date);
    const baseConfidence = 75;
    const dataFactor = Math.min(timeSeriesData.length / 50, 1) * 20;
    return Math.min(baseConfidence + dataFactor, 95);
  }

  private calculateCyclicConfidence(data: any[]): number {
    const weeklyData = data.filter(d => {
      const date = this.parseDate(d.date || d.created_date);
      return date && date.getDay() !== undefined;
    });
    
    const baseConfidence = 80;
    const dataFactor = Math.min(weeklyData.length / 100, 1) * 15;
    return Math.min(baseConfidence + dataFactor, 95);
  }

  private calculateCyclicImpact(data: any[]): number {
    const dailyData: { [key: string]: any[] } = {};
    
    data.forEach(record => {
      const date = this.parseDate(record.date || record.created_date);
      if (date) {
        const day = date.getDay().toString();
        if (!dailyData[day]) dailyData[day] = [];
        dailyData[day].push(record);
      }
    });
    
    const averages = Object.values(dailyData).map(records => this.calculateAverageValue(records));
    if (averages.length === 0) return 0;
    
    const maxAvg = Math.max(...averages);
    const minAvg = Math.min(...averages);
    const overallAvg = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
    
    return overallAvg > 0 ? ((maxAvg - minAvg) / overallAvg) * 100 : 0;
  }

  private calculateAverageValue(records: any[]): number {
    if (records.length === 0) return 0;
    const values = records.map(r => r.value || r.amount || r.revenue || 0).filter(v => v > 0);
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  private parseDate(dateStr: any): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  private getEarliestDate(data: any[]): string {
    const dates = data
      .map(record => this.parseDate(record.date || record.created_date))
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());
    
    return dates.length > 0 ? dates[0]!.toISOString().split('T')[0] : 'Unknown';
  }

  private getLatestDate(data: any[]): string {
    const dates = data
      .map(record => this.parseDate(record.date || record.created_date))
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());
    
    return dates.length > 0 ? dates[dates.length - 1]!.toISOString().split('T')[0] : 'Unknown';
  }
}

export default TemporalPatternMiner; 