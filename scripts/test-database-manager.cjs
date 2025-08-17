#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TestDatabaseManager {
  constructor() {
    this.config = {
      referenceDatabases: {
        theLoomV2: 'data/databases/the-loom-v2.db',
        conceptualLexicon: 'data/databases/conceptual-lexicon.db'
      },
      testDatabases: {
        testRun: 'data/databases/test-run.db',
        cdaImportTest: 'cda-import-test.db'
      },
      archivePath: 'data/databases/archive/'
    };
  }

  async initializeTestEnvironment() {
    console.log('🏗️  INITIALIZING SAFE TEST ENVIRONMENT');
    console.log('=' .repeat(60));

    try {
      await this.createArchiveDirectory();
      await this.archivePreviousTestDatabases();
      await this.createFreshTestCopies();
      await this.configureTestDatabases();
      
      console.log('\n✅ Test environment initialized successfully');
      console.log('🔒 Reference databases are protected');
      console.log('🧪 Test databases are ready for concurrent access');
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error.message);
      throw error;
    }
  }

  async createArchiveDirectory() {
    console.log('\n📁 Creating archive directory...');
    
    if (!fs.existsSync(this.config.archivePath)) {
      fs.mkdirSync(this.config.archivePath, { recursive: true });
      console.log(`   Created: ${this.config.archivePath}`);
    } else {
      console.log(`   Exists: ${this.config.archivePath}`);
    }
  }

  async archivePreviousTestDatabases() {
    console.log('\n📦 Archiving previous test databases...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let archivedCount = 0;

    for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
      if (fs.existsSync(dbPath)) {
        const archiveName = `${name}-${timestamp}.db`;
        const archivePath = path.join(this.config.archivePath, archiveName);
        
        fs.copyFileSync(dbPath, archivePath);
        fs.unlinkSync(dbPath);
        
        console.log(`   Archived: ${dbPath} → ${archivePath}`);
        archivedCount++;
      }
    }

    if (archivedCount === 0) {
      console.log('   No previous test databases to archive');
    } else {
      console.log(`   Archived ${archivedCount} test databases`);
    }
  }

  async createFreshTestCopies() {
    console.log('\n📋 Creating fresh test database copies...');
    
    const theLoomV2Path = this.config.referenceDatabases.theLoomV2;
    const testRunPath = this.config.testDatabases.testRun;
    
    if (fs.existsSync(theLoomV2Path)) {
      fs.copyFileSync(theLoomV2Path, testRunPath);
      console.log(`   Copied: ${theLoomV2Path} → ${testRunPath}`);
      
      const originalStats = fs.statSync(theLoomV2Path);
      const copyStats = fs.statSync(testRunPath);
      
      if (originalStats.size === copyStats.size) {
        console.log(`   ✅ Copy verified: ${copyStats.size} bytes`);
      } else {
        throw new Error(`Copy verification failed: size mismatch`);
      }
    } else {
      console.log(`   ⚠️  Reference database not found: ${theLoomV2Path}`);
      console.log('   This is expected if running tests before database creation');
    }
  }

  async configureTestDatabases() {
    console.log('\n⚙️  Configuring high-concurrency settings...');
    
    for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
      if (fs.existsSync(dbPath)) {
        await this.applyHighConcurrencySettings(dbPath);
        console.log(`   Configured: ${dbPath}`);
      }
    }
  }

  async applyHighConcurrencySettings(dbPath) {
    const { SimpleGraph } = await import('../src/SimpleGraph.js');
    const graph = await SimpleGraph.connect({ path: dbPath });
    await graph.close();
  }

  async cleanupTestEnvironment(keepTestDatabases = true) {
    console.log('\n🧹 CLEANING UP TEST ENVIRONMENT');
    console.log('=' .repeat(40));

    if (keepTestDatabases) {
      console.log('📁 Keeping test databases for inspection');
      for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
        if (fs.existsSync(dbPath)) {
          console.log(`   Available: ${dbPath}`);
        }
      }
    } else {
      console.log('🗑️  Removing test databases...');
      for (const [name, dbPath] of Object.entries(this.config.testDatabases)) {
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
          console.log(`   Removed: ${dbPath}`);
        }
      }
    }

    console.log('✅ Cleanup complete');
  }

  async verifyReferenceDatabaseIntegrity() {
    console.log('\n🔍 VERIFYING REFERENCE DATABASE INTEGRITY');
    console.log('=' .repeat(50));

    for (const [name, dbPath] of Object.entries(this.config.referenceDatabases)) {
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log(`✅ ${name}: ${dbPath} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
      } else {
        console.log(`⚠️  ${name}: ${dbPath} (not found)`);
      }
    }
  }

  getTestDatabaseConfig() {
    return {
      testRun: this.config.testDatabases.testRun,
      cdaImportTest: this.config.testDatabases.cdaImportTest,
      archivePath: this.config.archivePath
    };
  }
}

if (require.main === module) {
  const manager = new TestDatabaseManager();
  
  const command = process.argv[2] || 'init';
  
  switch (command) {
    case 'init':
      manager.initializeTestEnvironment().catch(console.error);
      break;
      
    case 'cleanup':
      const keep = process.argv[3] !== '--remove';
      manager.cleanupTestEnvironment(keep).catch(console.error);
      break;
      
    case 'verify':
      manager.verifyReferenceDatabaseIntegrity().catch(console.error);
      break;
      
    default:
      console.log('Usage: node test-database-manager.cjs [init|cleanup|verify]');
      console.log('  init    - Initialize test environment (default)');
      console.log('  cleanup - Clean up test environment (--remove to delete test DBs)');
      console.log('  verify  - Verify reference database integrity');
  }
}

module.exports = { TestDatabaseManager };
