#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()

/**
 * Step 1: Create safe backup of source database
 */
class DatabaseBackup {
  constructor() {
    this.sourceDb = 'cda-import-test.db'
    this.targetDb = 'data/databases/the-loom-v2.db'
  }

  /**
   * Create backup copy of source database
   */
  async createBackup() {
    console.log('🔄 STEP 1: DATABASE BACKUP')
    console.log('=' .repeat(50))
    
    try {
      // Verify source exists
      if (!fs.existsSync(this.sourceDb)) {
        throw new Error(`Source database not found: ${this.sourceDb}`)
      }

      // Ensure target directory exists
      const targetDir = path.dirname(this.targetDb)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
        console.log(`📁 Created directory: ${targetDir}`)
      }

      // Remove existing target if it exists
      if (fs.existsSync(this.targetDb)) {
        fs.unlinkSync(this.targetDb)
        console.log(`🗑️  Removed existing: ${this.targetDb}`)
      }

      // Copy source to target
      fs.copyFileSync(this.sourceDb, this.targetDb)
      console.log(`📋 Copied: ${this.sourceDb} → ${this.targetDb}`)

      // Verify backup integrity
      await this.verifyBackup()
      
      console.log('✅ Database backup completed successfully')
      return true

    } catch (error) {
      console.error('❌ Backup failed:', error.message)
      throw error
    }
  }

  /**
   * Verify backup integrity by comparing counts
   */
  async verifyBackup() {
    console.log('\n🔍 Verifying backup integrity...')

    const sourceStats = await this.getDatabaseStats(this.sourceDb)
    const targetStats = await this.getDatabaseStats(this.targetDb)

    console.log(`📊 Source: ${sourceStats.nodes} nodes, ${sourceStats.edges} edges`)
    console.log(`📊 Target: ${targetStats.nodes} nodes, ${targetStats.edges} edges`)

    if (sourceStats.nodes !== targetStats.nodes) {
      throw new Error(`Node count mismatch: ${sourceStats.nodes} vs ${targetStats.nodes}`)
    }

    if (sourceStats.edges !== targetStats.edges) {
      throw new Error(`Edge count mismatch: ${sourceStats.edges} vs ${targetStats.edges}`)
    }

    console.log('✅ Backup integrity verified')
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err)
          return
        }

        db.get("SELECT COUNT(*) as nodes FROM nodes", [], (err, nodeResult) => {
          if (err) {
            reject(err)
            return
          }

          db.get("SELECT COUNT(*) as edges FROM edges", [], (err, edgeResult) => {
            if (err) {
              reject(err)
              return
            }

            db.close()
            resolve({
              nodes: nodeResult.nodes,
              edges: edgeResult.edges
            })
          })
        })
      })
    })
  }

  /**
   * Get file information
   */
  getFileInfo(filePath) {
    const stats = fs.statSync(filePath)
    return {
      size: stats.size,
      modified: stats.mtime.toISOString()
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const backup = new DatabaseBackup()
  backup.createBackup().catch(console.error)
}

module.exports = { DatabaseBackup }
