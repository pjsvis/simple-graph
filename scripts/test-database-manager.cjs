#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

/**
 * Test Database Manager - Implements safe, copy-on-write testing workflow
 * 
 * This script ensures:
 * 1. Reference databases remain untouched during testing
 * 2. Each test run uses a fresh copy of the database
 * 3. Previous test databases are archived with timestamps
 * 4. High-concurrency settings are applied to all test databases
 */
class TestDatabaseManager {
  constructor() {
    this.config = {
      // Reference databases (READ-ONLY during tests)
      referenceDatabases: {
        theLoomV2: 'data/databases/the-loom-v2.db',
        conceptualLexicon: 'data/databases/conceptual-lexicon.db'
      },
      
      // Test databases (WRITE during tests)
      testDatabases: {
        testRun: 'data/databases/test-run.db',
        cdaImportTest: 'cda-import-test.db'
      },
      
      // Archive directory
      archivePath: 'data/databases/archive/',
      
      // High-concurrency PRAGMA settings
      pragmas: [
        'PRAGMA journal_mode=WAL;',
        'PRAGMA busy_timeout = 5000;',
        'PRAGMA synchronous = NORMAL;',
        'PRAGMA foreign_keys = ON;'
      ]
    }
  }

  /**
   * Initialize the test environment
   */
  async initializeTestEnvironment() {
    console.log('🏗️  INITIALIZING SAFE TEST ENVIRONMENT')
    console.log('=' .repeat(60))

    try {
      // Step 1: Create archive directory
      await this.createArchiveDirectory()
      
      // Step 2: Archive previous test databases
      await this.archivePreviousTestDatabases()
      
      // Step 3: Create fresh test copies
      await this.createFreshTestCopies()
      
      // Step 4: Configure high-concurrency settings
      await this.configureTestDatabases()
      
      console.log('\n✅ Test environment initialized successfully')
      console.log('🔒 Reference databases are protected')
      console.log('🧪 Test databases are ready for concurrent access')
      
      return true

    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error.message)
      throw error
    }
  }

  /**
   * Create archive directory if it doesn't exist
   */
  async createArchiveDirectory() {
    console.log('\n📁 Creating archive directory...')
    
    if (!fs.existsSync(this.config.archivePath)) {
      fs.mkdirSync(this.config.archivePath, { recursive: true })
      console.log(`   Created: ${this.config.archivePath}`)
    } else {
      console.log(`   Exists: ${this.config.archivePath}`)
    }
  }

  /**
   * Archive previous test databases with timestamps
   */
  async archivePreviousTestDatabases() {
    console.log('\n📦 Archiving previous test databases...')
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    let archivedCount = 0

    for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
      if (fs.existsSync(dbPath)) {
        const archiveName = `${name}-${timestamp}.db`
        const archivePath = path.join(this.config.archivePath, archiveName)
        
        fs.copyFileSync(dbPath, archivePath)
        fs.unlinkSync(dbPath)
        
        console.log(`   Archived: ${dbPath} → ${archivePath}`)
        archivedCount++
      }
    }

    if (archivedCount === 0) {
      console.log('   No previous test databases to archive')
    } else {
      console.log(`   Archived ${archivedCount} test databases`)
    }
  }

  /**
   * Create fresh copies of reference databases for testing
   */
  async createFreshTestCopies() {
    console.log('\n📋 Creating fresh test database copies...')
    
    // Copy The Loom v2 to test-run.db if it exists
    const theLoomV2Path = this.config.referenceDatabases.theLoomV2
    const testRunPath = this.config.testDatabases.testRun
    
    if (fs.existsSync(theLoomV2Path)) {
      fs.copyFileSync(theLoomV2Path, testRunPath)
      console.log(`   Copied: ${theLoomV2Path} → ${testRunPath}`)
      
      // Verify copy integrity
      const originalStats = fs.statSync(theLoomV2Path)
      const copyStats = fs.statSync(testRunPath)
      
      if (originalStats.size === copyStats.size) {
        console.log(`   ✅ Copy verified: ${copyStats.size} bytes`)
      } else {
        throw new Error(`Copy verification failed: size mismatch`)
      }
    } else {
      console.log(`   ⚠️  Reference database not found: ${theLoomV2Path}`)
      console.log('   This is expected if running tests before database creation')
    }
  }

  /**
   * Configure high-concurrency settings on test databases
   */
  async configureTestDatabases() {
    console.log('\n⚙️  Configuring high-concurrency settings...')
    
    for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
      if (fs.existsSync(dbPath)) {
        await this.applyHighConcurrencySettings(dbPath)
        console.log(`   Configured: ${dbPath}`)
      }
    }
  }

  /**
   * Apply high-concurrency PRAGMA settings to a database
   */
  async applyHighConcurrencySettings(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err)
          return
        }

        db.serialize(() => {
          this.config.pragmas.forEach(pragma => {
            db.run(pragma, (err) => {
              if (err) {
                console.warn(`   Warning: Failed to execute ${pragma}: ${err.message}`)
              }
            })
          })
        })

        db.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    })
  }

  /**
   * Clean up test environment after tests complete
   */
  async cleanupTestEnvironment(keepTestDatabases = true) {
    console.log('\n🧹 CLEANING UP TEST ENVIRONMENT')
    console.log('=' .repeat(40))

    if (keepTestDatabases) {
      console.log('📁 Keeping test databases for inspection')
      for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
        if (fs.existsSync(dbPath)) {
          console.log(`   Available: ${dbPath}`)
        }
      }
    } else {
      console.log('🗑️  Removing test databases...')
      for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath)
          console.log(`   Removed: ${dbPath}`)
        }
      }
    }

    console.log('✅ Cleanup complete')
  }

  /**
   * Verify reference database integrity
   */
  async verifyReferenceDatabaseIntegrity() {
    console.log('\n🔍 VERIFYING REFERENCE DATABASE INTEGRITY')
    console.log('=' .repeat(50))

    for (const [name, dbPath] of Object.entries(this.config.referenceDatabases)) {
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath)
        console.log(`✅ ${name}: ${dbPath} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`)
      } else {
        console.log(`⚠️  ${name}: ${dbPath} (not found)`)
      }
    }
  }

  /**
   * Get test database configuration for tests
   */
  getTestDatabaseConfig() {
    return {
      testRun: this.config.testDatabases.testRun,
      cdaImportTest: this.config.testDatabases.cdaImportTest,
      archivePath: this.config.archivePath
    }
  }
}

// CLI interface
if (require.main === module) {
  const manager = new TestDatabaseManager()
  
  const command = process.argv[2] || 'init'
  
  switch (command) {
    case 'init':
      manager.initializeTestEnvironment().catch(console.error)
      break
      
    case 'cleanup':
      const keep = process.argv[3] !== '--remove'
      manager.cleanupTestEnvironment(keep).catch(console.error)
      break
      
    case 'verify':
      manager.verifyReferenceDatabaseIntegrity().catch(console.error)
      break
      
    default:
      console.log('Usage: node test-database-manager.cjs [init|cleanup|verify]')
      console.log('  init    - Initialize test environment (default)')
      console.log('  cleanup - Clean up test environment (--remove to delete test DBs)')
      console.log('  verify  - Verify reference database integrity')
  }
}

module.exports = { TestDatabaseManager }
