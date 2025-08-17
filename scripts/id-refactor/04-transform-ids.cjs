#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const { IDMapper } = require('./03-id-mapper.cjs')

/**
 * Step 4: Execute ID transformation on the database
 */
class IDTransformer {
  constructor() {
    this.targetDb = 'data/databases/the-loom-v2.db'
    this.mapper = new IDMapper()
    this.transformationMap = new Map()
  }

  /**
   * Execute complete ID transformation
   */
  async transformDatabase() {
    console.log('🔄 STEP 4: ID TRANSFORMATION')
    console.log('=' .repeat(50))

    try {
      // Load data and create transformation map
      const { nodes, edges } = await this.loadDatabaseData()
      this.transformationMap = this.mapper.createTransformationMap(nodes)
      
      // Show examples
      this.mapper.showTransformationExamples(this.transformationMap)
      
      // Validate completeness
      this.mapper.validateTransformationCompleteness(this.transformationMap, edges)

      // Clean up dangling edges before transformation
      await this.cleanupDanglingEdges()

      // Execute transformations
      await this.updateNodeIDs()
      await this.updateEdgeReferences()

      // Verify integrity
      await this.verifyTransformation()

      console.log('✅ ID transformation completed successfully')
      return true

    } catch (error) {
      console.error('❌ Transformation failed:', error.message)
      throw error
    }
  }

  /**
   * Clean up dangling edges before transformation
   */
  async cleanupDanglingEdges() {
    console.log('\n🧹 Cleaning up dangling edges...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        // Find and remove dangling edges
        db.run(`
          DELETE FROM edges
          WHERE source NOT IN (SELECT json_extract(body, '$.id') FROM nodes)
             OR target NOT IN (SELECT json_extract(body, '$.id') FROM nodes)
        `, [], function(err) {
          if (err) {
            reject(err)
            return
          }

          if (this.changes > 0) {
            console.log(`   Removed ${this.changes} dangling edges`)
          } else {
            console.log('   No dangling edges found')
          }

          db.close()
          resolve()
        })
      })
    })
  }

  /**
   * Load all data from target database
   */
  async loadDatabaseData() {
    console.log('\n📥 Loading database data...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        // Load nodes
        db.all(`
          SELECT 
            json_extract(body, '$.id') as id,
            json_extract(body, '$.node_type') as node_type,
            json_extract(body, '$.category') as category,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.cda_version') as cda_version,
            json_extract(body, '$.lexicon_version') as lexicon_version,
            body
          FROM nodes
        `, [], (err, nodes) => {
          if (err) {
            reject(err)
            return
          }

          // Load edges
          db.all(`
            SELECT source, target, properties,
                   json_extract(properties, '$.type') as edge_type
            FROM edges
          `, [], (err, edges) => {
            db.close()
            if (err) {
              reject(err)
            } else {
              console.log(`📊 Loaded ${nodes.length} nodes and ${edges.length} edges`)
              resolve({ nodes, edges })
            }
          })
        })
      })
    })
  }

  /**
   * Update node IDs in the database
   */
  async updateNodeIDs() {
    console.log('\n📝 Updating node IDs...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        let updateCount = 0
        let totalUpdates = 0

        // Count transformations needed
        for (const [oldId, newId] of this.transformationMap) {
          if (oldId !== newId) {
            totalUpdates++
          }
        }

        if (totalUpdates === 0) {
          console.log('   No node ID updates needed')
          db.close()
          resolve()
          return
        }

        console.log(`   Updating ${totalUpdates} node IDs...`)

        // Begin transaction
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(err)
            return
          }

          // Update each node that needs transformation
          for (const [oldId, newId] of this.transformationMap) {
            if (oldId !== newId) {
              db.run(`
                UPDATE nodes 
                SET body = json_set(body, '$.id', ?) 
                WHERE json_extract(body, '$.id') = ?
              `, [newId, oldId], function(err) {
                if (err) {
                  db.run('ROLLBACK')
                  reject(err)
                  return
                }

                updateCount++
                if (updateCount % 10 === 0) {
                  console.log(`   Updated ${updateCount}/${totalUpdates} nodes...`)
                }

                if (updateCount === totalUpdates) {
                  // Commit transaction
                  db.run('COMMIT', (err) => {
                    if (err) {
                      reject(err)
                    } else {
                      console.log(`✅ Updated ${updateCount} node IDs`)
                      db.close()
                      resolve()
                    }
                  })
                }
              })
            }
          }
        })
      })
    })
  }

  /**
   * Update edge references to use new IDs
   */
  async updateEdgeReferences() {
    console.log('\n🔗 Updating edge references...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        let updateCount = 0
        let totalUpdates = 0

        // Count edge updates needed
        db.all('SELECT source, target FROM edges', [], (err, edges) => {
          if (err) {
            reject(err)
            return
          }

          // Count how many edges need updates
          edges.forEach(edge => {
            const sourceNeedsUpdate = this.transformationMap.has(edge.source) && 
                                    this.transformationMap.get(edge.source) !== edge.source
            const targetNeedsUpdate = this.transformationMap.has(edge.target) && 
                                    this.transformationMap.get(edge.target) !== edge.target
            
            if (sourceNeedsUpdate || targetNeedsUpdate) {
              totalUpdates++
            }
          })

          if (totalUpdates === 0) {
            console.log('   No edge reference updates needed')
            db.close()
            resolve()
            return
          }

          console.log(`   Updating ${totalUpdates} edge references...`)

          // Begin transaction
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err)
              return
            }

            // Update each edge that needs transformation
            edges.forEach(edge => {
              const newSource = this.transformationMap.get(edge.source) || edge.source
              const newTarget = this.transformationMap.get(edge.target) || edge.target
              
              if (newSource !== edge.source || newTarget !== edge.target) {
                db.run(`
                  UPDATE edges 
                  SET source = ?, target = ? 
                  WHERE source = ? AND target = ?
                `, [newSource, newTarget, edge.source, edge.target], function(err) {
                  if (err) {
                    db.run('ROLLBACK')
                    reject(err)
                    return
                  }

                  updateCount++
                  if (updateCount % 10 === 0) {
                    console.log(`   Updated ${updateCount}/${totalUpdates} edges...`)
                  }

                  if (updateCount === totalUpdates) {
                    // Commit transaction
                    db.run('COMMIT', (err) => {
                      if (err) {
                        reject(err)
                      } else {
                        console.log(`✅ Updated ${updateCount} edge references`)
                        db.close()
                        resolve()
                      }
                    })
                  }
                })
              }
            })
          })
        })
      })
    })
  }

  /**
   * Verify transformation integrity
   */
  async verifyTransformation() {
    console.log('\n🔍 Verifying transformation integrity...')

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.targetDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        // Check for dangling edges
        db.get(`
          SELECT COUNT(*) as dangling_count
          FROM edges e 
          WHERE NOT EXISTS (
            SELECT 1 FROM nodes n WHERE json_extract(n.body, '$.id') = e.source
          ) OR NOT EXISTS (
            SELECT 1 FROM nodes n WHERE json_extract(n.body, '$.id') = e.target
          )
        `, [], (err, result) => {
          if (err) {
            reject(err)
            return
          }

          if (result.dangling_count > 0) {
            reject(new Error(`Found ${result.dangling_count} dangling edges`))
            return
          }

          // Check ID format compliance
          db.all(`
            SELECT json_extract(body, '$.id') as id, 
                   json_extract(body, '$.node_type') as node_type
            FROM nodes
          `, [], (err, nodes) => {
            db.close()
            if (err) {
              reject(err)
              return
            }

            let invalidIds = 0
            nodes.forEach(node => {
              if (!this.mapper.validateNewId(node.id)) {
                console.warn(`⚠️  Invalid ID format: ${node.id} (${node.node_type})`)
                invalidIds++
              }
            })

            if (invalidIds > 0) {
              reject(new Error(`Found ${invalidIds} nodes with invalid ID format`))
              return
            }

            console.log('✅ No dangling edges found')
            console.log('✅ All IDs follow correct format')
            console.log('✅ Transformation integrity verified')
            resolve()
          })
        })
      })
    })
  }
}

// Run transformation if called directly
if (require.main === module) {
  const transformer = new IDTransformer()
  transformer.transformDatabase().catch(console.error)
}

module.exports = { IDTransformer }