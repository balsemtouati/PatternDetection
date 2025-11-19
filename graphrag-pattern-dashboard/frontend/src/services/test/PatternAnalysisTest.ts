import PatternAnalysisAPI from '../api/PatternAnalysisAPI';
import { DataSource } from '../dataProcessing/DataMerger';

/**
 * Test de l'architecture de détection de patterns
 */
export class PatternAnalysisTest {
  private api: PatternAnalysisAPI;

  constructor() {
    this.api = new PatternAnalysisAPI();
  }

  /**
   * Test complet de l'analyse de patterns
   */
  public async runFullTest(): Promise<void> {
    console.log('🧪 Starting Pattern Analysis Test...\n');

    try {
      // 1. Préparation des données de test
      const testData = this.generateTestData();
      console.log('✅ Test data generated successfully');

      // 2. Configuration de test
      const config = {
        maxPatterns: 6,
        minConfidence: 0.5,
        minSupport: 0.1,
        complexityLevel: 'high' as const,
        focusAreas: ['profitability', 'efficiency']
      };
      console.log('✅ Test configuration set');

      // 3. Exécution de l'analyse
      console.log('🔄 Running pattern analysis...');
      const result = await this.api.analyzePatterns(testData, config);
      console.log('✅ Pattern analysis completed successfully');

      // 4. Affichage des résultats
      this.displayResults(result);

      // 5. Test d'export
      const jsonExport = this.api.exportPatternsToJSON(result.patterns);
      console.log('✅ JSON export successful');
      console.log(`📄 Export size: ${jsonExport.length} characters`);

      // 6. Test de rapport
      const report = this.api.generateAnalysisReport(result);
      console.log('✅ Analysis report generated');
      console.log(`📊 Report summary: ${report.summary}`);

      console.log('\n🎉 All tests passed successfully!');

    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  /**
   * Génération de données de test réalistes
   */
  private generateTestData(): DataSource[] {
    const crmData = Array.from({ length: 500 }, (_, i) => ({
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
    }));

    const erpData = Array.from({ length: 300 }, (_, i) => ({
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
    }));

    const financialData = Array.from({ length: 200 }, (_, i) => ({
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
    }));

    return [
      {
        name: 'CRM Data',
        type: 'crm',
        data: crmData
      },
      {
        name: 'ERP Data',
        type: 'erp',
        data: erpData
      },
      {
        name: 'Financial Data',
        type: 'financial',
        data: financialData
      }
    ];
  }

  /**
   * Affichage des résultats de test
   */
  private displayResults(result: any): void {
    console.log('\n📊 Analysis Results:');
    console.log('===================');
    console.log(`Total Records: ${result.analysisMetadata.totalRecords}`);
    console.log(`Data Sources: ${result.analysisMetadata.dataSources}`);
    console.log(`Patterns Detected: ${result.patterns.length}`);
    console.log(`Overall Confidence: ${result.analysisMetadata.confidence}%`);
    console.log(`Processing Time: ${(result.analysisMetadata.processingTime / 1000).toFixed(2)}s`);

    console.log('\n🔍 Detected Patterns:');
    console.log('====================');
    result.patterns.forEach((pattern: any, index: number) => {
      console.log(`${index + 1}. ${pattern.title}`);
      console.log(`   Impact: ${pattern.impact.toFixed(1)}%`);
      console.log(`   Confidence: ${pattern.confidence.toFixed(1)}%`);
      console.log(`   Complexity: ${pattern.complexity}`);
      console.log(`   Variables: ${pattern.variables.length}`);
      console.log('');
    });

    console.log('📈 Statistics:');
    console.log('==============');
    console.log(`Score Distribution:`);
    console.log(`  Excellent: ${result.statistics.scoring.scoreDistribution.excellent}`);
    console.log(`  Good: ${result.statistics.scoring.scoreDistribution.good}`);
    console.log(`  Fair: ${result.statistics.scoring.scoreDistribution.fair}`);
    console.log(`  Poor: ${result.statistics.scoring.scoreDistribution.poor}`);

    console.log(`\nComplexity Distribution:`);
    console.log(`  Very High: ${result.statistics.scoring.complexityDistribution.veryHigh}`);
    console.log(`  High: ${result.statistics.scoring.complexityDistribution.high}`);
    console.log(`  Medium: ${result.statistics.scoring.complexityDistribution.medium}`);
    console.log(`  Low: ${result.statistics.scoring.complexityDistribution.low}`);
  }

  /**
   * Test de performance
   */
  public async runPerformanceTest(): Promise<void> {
    console.log('\n⚡ Running Performance Test...');

    const startTime = Date.now();
    const testData = this.generateTestData();
    const config = {
      maxPatterns: 10,
      minConfidence: 0.6,
      minSupport: 0.1,
      complexityLevel: 'high' as const,
      focusAreas: ['profitability', 'efficiency', 'risk', 'quality']
    };

    const result = await this.api.analyzePatterns(testData, config);
    const endTime = Date.now();

    console.log(`✅ Performance test completed in ${endTime - startTime}ms`);
    console.log(`📊 Processed ${result.analysisMetadata.totalRecords} records`);
    console.log(`🧠 Detected ${result.patterns.length} patterns`);
    console.log(`⚡ Average time per record: ${((endTime - startTime) / result.analysisMetadata.totalRecords).toFixed(2)}ms`);
  }

  /**
   * Test de validation des patterns
   */
  public async runValidationTest(): Promise<void> {
    console.log('\n🔍 Running Validation Test...');

    const testData = this.generateTestData();
    const config = {
      maxPatterns: 8,
      minConfidence: 0.5,
      minSupport: 0.1,
      complexityLevel: 'high' as const,
      focusAreas: ['profitability', 'efficiency']
    };

    const result = await this.api.analyzePatterns(testData, config);
    
    // Validation des patterns
    const validPatterns = result.patterns.filter((p: any) => 
      p.id && p.title && p.description && p.impact >= 0 && p.confidence >= 0
    );

    console.log(`✅ Validation test completed`);
    console.log(`📊 Total patterns: ${result.patterns.length}`);
    console.log(`✅ Valid patterns: ${validPatterns.length}`);
    console.log(`❌ Invalid patterns: ${result.patterns.length - validPatterns.length}`);

    if (validPatterns.length === result.patterns.length) {
      console.log('🎉 All patterns are valid!');
    } else {
      console.log('⚠️ Some patterns failed validation');
    }
  }
}

// Fonction d'exécution des tests
export async function runAllTests(): Promise<void> {
  const tester = new PatternAnalysisTest();
  
  try {
    await tester.runFullTest();
    await tester.runPerformanceTest();
    await tester.runValidationTest();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    throw error;
  }
}

export default PatternAnalysisTest; 