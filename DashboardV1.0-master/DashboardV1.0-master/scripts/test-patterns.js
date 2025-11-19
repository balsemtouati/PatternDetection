#!/usr/bin/env node

/**
 * Script de test pour l'analyse de patterns
 * Usage: node scripts/test-patterns.js
 */

const { runAllTests } = require('../src/services/test/PatternAnalysisTest');

async function main() {
  console.log('🧪 Pattern Analysis Test Suite');
  console.log('================================\n');
  
  try {
    await runAllTests();
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = { main }; 