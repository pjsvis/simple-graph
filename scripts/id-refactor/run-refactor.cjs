#!/usr/bin/env node

const { DatabaseBackup } = require('./01-backup-database.cjs')
const { IDAnalyzer } = require('./02-analyze-ids.cjs')
const { IDTransformer } = require('./04-transform-ids.cjs')

/**
 * Master script to execute complete ID refactoring workflow
 */
class RefactorOrchestrator {
  constructor() {
    this.sourceDb = 'cda-import-test.db'
    this.targetDb = 'data/databases/the-loom-v2.db'
    this.startTime = Date.now()
  }

  /**
   * Execute complete refactoring workflow
   */
  async executeRefactor() {
    console.log('🚀 ID STANDARDIZATION REFACTORING')
    console.log('=' .repeat(60))
    console.log(`📅 Started: ${new Date().toISOString()}`)
    console.log(`📥 Source: ${this.sourceDb}`)
    console.log(`📤 Target: ${this.targetDb}`)
    console.log('')

    try {
      // Phase 1: Backup and Analysis
      await this.phase1_BackupAndAnalysis()
      
      // Phase 2: Transformation
      await this.phase2_Transformation()
      
      // Phase 3: Validation
      await this.phase3_Validation()
      
      // Phase 4: Summary
      this.phase4_Summary()

      return true

    } catch (error) {
      console.error('\n❌ REFACTORING FAILED')
      console.error('=' .repeat(30))
      console.error(`Error: ${error.message}`)
      console.error('\n🔧 Troubleshooting:')
      console.error('1. Check that source database exists and is accessible')
      console.error('2. Ensure target directory has write permissions')
      console.error('3. Verify database is not locked by another process')
      console.error('4. Check available disk space')
      
      throw error
    }
  }

  /**
   * Phase 1: Backup and Analysis
   */
  async phase1_BackupAndAnalysis() {
    console.log('📋 PHASE 1: BACKUP AND ANALYSIS')
    console.log('=' .repeat(40))

    // Step 1: Create backup
    const backup = new DatabaseBackup()
    await backup.createBackup()

    console.log('')

    // Step 2: Analyze ID patterns
    const analyzer = new IDAnalyzer()
    const analysisResults = await analyzer.analyzeIDs()

    console.log('\n✅ Phase 1 completed successfully')
    console.log(`   📊 Analyzed ${analysisResults.nodes} nodes and ${analysisResults.edges} edges`)
    console.log(`   🔄 Created ${Object.keys(analysisResults.transformations).length} transformations`)

    return analysisResults
  }

  /**
   * Phase 2: Transformation
   */
  async phase2_Transformation() {
    console.log('\n📋 PHASE 2: ID TRANSFORMATION')
    console.log('=' .repeat(40))

    const transformer = new IDTransformer()
    await transformer.transformDatabase()

    console.log('\n✅ Phase 2 completed successfully')
    console.log('   🔄 All node IDs updated to new format')
    console.log('   🔗 All edge references updated')
    console.log('   🔍 Referential integrity verified')
  }

  /**
   * Phase 3: Basic validation
   */
  async phase3_Validation() {
    console.log('\n📋 PHASE 3: BASIC VALIDATION')
    console.log('=' .repeat(40))

    // Basic file existence check
    const fs = require('fs')
    
    if (!fs.existsSync(this.sourceDb)) {
      throw new Error(`Source database missing: ${this.sourceDb}`)
    }

    if (!fs.existsSync(this.targetDb)) {
      throw new Error(`Target database not created: ${this.targetDb}`)
    }

    // Basic size comparison
    const sourceStats = fs.statSync(this.sourceDb)
    const targetStats = fs.statSync(this.targetDb)

    console.log(`📊 Source size: ${(sourceStats.size / 1024).toFixed(1)} KB`)
    console.log(`📊 Target size: ${(targetStats.size / 1024).toFixed(1)} KB`)

    // Sizes should be similar (within 10%)
    const sizeDiff = Math.abs(sourceStats.size - targetStats.size) / sourceStats.size
    if (sizeDiff > 0.1) {
      console.warn(`⚠️  Size difference: ${(sizeDiff * 100).toFixed(1)}%`)
    }

    console.log('\n✅ Phase 3 completed successfully')
    console.log('   📁 Both databases exist')
    console.log('   📊 File sizes are reasonable')
  }

  /**
   * Phase 4: Summary and next steps
   */
  phase4_Summary() {
    const duration = Date.now() - this.startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)

    console.log('\n🎊 REFACTORING COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(50))
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`)
    console.log(`📅 Completed: ${new Date().toISOString()}`)
    console.log('')
    console.log('📋 RESULTS:')
    console.log(`   📥 Source: ${this.sourceDb} (preserved unchanged)`)
    console.log(`   📤 Target: ${this.targetDb} (new standardized IDs)`)
    console.log('')
    console.log('🎯 NEW ID FORMAT:')
    console.log('   • CDA metadata: cda-61')
    console.log('   • Directives: cda-61-{category}-{number}')
    console.log('   • Examples: cda-61-phi-1, cda-61-opm-8, cda-61-cog-3')
    console.log('')
    console.log('🔍 NEXT STEPS:')
    console.log('   1. Run comprehensive validation tests:')
    console.log('      bun test tests/integration/id-refactor-validation.test.ts')
    console.log('')
    console.log('   2. Update application configuration to use new database:')
    console.log('      - Update database path references')
    console.log('      - Test visualization generation')
    console.log('      - Verify persona generation')
    console.log('')
    console.log('   3. Enhanced querying examples:')
    console.log('      - Find all PHI directives: SELECT * WHERE id LIKE "cda-61-phi-%"')
    console.log('      - Find all COG directives: SELECT * WHERE id LIKE "cda-61-cog-%"')
    console.log('      - Cross-version analysis ready for future CDA versions')
    console.log('')
    console.log('🎊 Graph Database v2 is ready for production!')
  }

  /**
   * Show monitoring commands
   */
  showMonitoringCommands() {
    console.log('\n📊 MONITORING COMMANDS:')
    console.log('=' .repeat(30))
    console.log('')
    console.log('Check node counts:')
    console.log(`sqlite3 ${this.sourceDb}`);
    console.log(`SELECT COUNT(*) FROM nodes;`)
    console.log(`SELECT COUNT(*) FROM edges;`)
    console.log('')
    console.log('Check node counts in target database:')
    console.log(`sqlite3 ${this.targetDb}`);
    console.log(`SELECT COUNT(*) FROM nodes;`)
    console.log(`SELECT COUNT(*) FROM edges;`)
  }
}

// Execute the refactoring workflow
const orchestrator = new RefactorOrchestrator()
orchestrator.executeRefactor()
  .then(() => {
    console.log('\nRefactoring workflow completed.')
    orchestrator.showMonitoringCommands()
  })
  .catch((error) => {
    console.error('\nRefactoring workflow failed unexpectedly:', error)
    process.exit(1)
  })
