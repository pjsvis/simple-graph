#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()

/**
 * Step 2: Analyze current ID patterns and create transformation mapping
 */
class IDAnalyzer {
  constructor() {
    this.sourceDb = 'cda-import-test.db'
    this.idPatterns = new Map()
    this.transformationMap = new Map()
  }

  /**
   * Analyze all IDs in the database
   */
  async analyzeIDs() {
    console.log('🔍 STEP 2: ID PATTERN ANALYSIS')
    console.log('=' .repeat(50))

    try {
      const nodes = await this.getAllNodes()
      const edges = await this.getAllEdges()

      console.log(`📊 Found ${nodes.length} nodes and ${edges.length} edges`)

      // Analyze node ID patterns
      this.analyzeNodePatterns(nodes)
      
      // Create transformation mapping
      this.createTransformationMap(nodes)

      // Analyze edge references
      this.analyzeEdgeReferences(edges)

      // Generate report
      this.generateReport()

      return {
        nodes: nodes.length,
        edges: edges.length,
        patterns: Object.fromEntries(this.idPatterns),
        transformations: Object.fromEntries(this.transformationMap)
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error.message)
      throw error
    }
  }

  /**
   * Get all nodes from database
   */
  async getAllNodes() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.sourceDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        db.all(`
          SELECT 
            json_extract(body, '$.id') as id,
            json_extract(body, '$.node_type') as node_type,
            json_extract(body, '$.category') as category,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.cda_version') as cda_version
          FROM nodes
        `, [], (err, rows) => {
          db.close()
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
    })
  }

  /**
   * Get all edges from database
   */
  async getAllEdges() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.sourceDb, (err) => {
        if (err) {
          reject(err)
          return
        }

        db.all(`
          SELECT source, target, json_extract(properties, '$.type') as edge_type
          FROM edges
        `, [], (err, rows) => {
          db.close()
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
    })
  }

  /**
   * Analyze node ID patterns
   */
  analyzeNodePatterns(nodes) {
    console.log('\n📋 Analyzing node ID patterns...')

    const patterns = {}
    
    nodes.forEach(node => {
      const { id, node_type, category } = node
      
      if (!patterns[node_type]) {
        patterns[node_type] = {
          count: 0,
          examples: [],
          categories: new Set()
        }
      }
      
      patterns[node_type].count++
      if (patterns[node_type].examples.length < 3) {
        patterns[node_type].examples.push(id)
      }
      if (category) {
        patterns[node_type].categories.add(category)
      }
    })

    // Convert sets to arrays for storage
    Object.keys(patterns).forEach(type => {
      patterns[type].categories = Array.from(patterns[type].categories)
    })

    this.idPatterns = new Map(Object.entries(patterns))

    console.log('📊 ID Patterns found:')
    this.idPatterns.forEach((pattern, type) => {
      console.log(`   ${type}: ${pattern.count} nodes`)
      console.log(`     Examples: ${pattern.examples.join(', ')}`)
      if (pattern.categories.length > 0) {
        console.log(`     Categories: ${pattern.categories.join(', ')}`)
      }
    })
  }

  /**
   * Create transformation mapping
   */
  createTransformationMap(nodes) {
    console.log('\n🔄 Creating transformation mapping...')

    nodes.forEach(node => {
      const { id, node_type, category, cda_version } = node
      let newId

      if (node_type === 'cda') {
        // CDA metadata nodes keep their current format
        newId = id
      } else if (node_type === 'directive') {
        // Transform directive IDs: cip-1 → cda-61-cip-1
        const version = cda_version || '61' // Default to 61 if not specified
        newId = `cda-${version}-${id}`
      } else {
        // Other node types (future expansion)
        newId = id
      }

      this.transformationMap.set(id, newId)
    })

    console.log(`📝 Created ${this.transformationMap.size} ID transformations`)
    
    // Show sample transformations
    console.log('📋 Sample transformations:')
    let count = 0
    for (const [oldId, newId] of this.transformationMap) {
      if (count < 5 && oldId !== newId) {
        console.log(`   ${oldId} → ${newId}`)
        count++
      }
    }
  }

  /**
   * Analyze edge references
   */
  analyzeEdgeReferences(edges) {
    console.log('\n🔗 Analyzing edge references...')

    const edgeTypes = {}
    const referencedNodes = new Set()

    edges.forEach(edge => {
      const { source, target, edge_type } = edge
      
      referencedNodes.add(source)
      referencedNodes.add(target)
      
      if (!edgeTypes[edge_type]) {
        edgeTypes[edge_type] = 0
      }
      edgeTypes[edge_type]++
    })

    console.log('📊 Edge type distribution:')
    Object.entries(edgeTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} edges`)
    })

    console.log(`🔗 Total unique nodes referenced in edges: ${referencedNodes.size}`)
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    console.log('\n📋 ANALYSIS SUMMARY')
    console.log('=' .repeat(30))

    console.log('\n🎯 Transformation Strategy:')
    console.log('   • CDA metadata nodes: Keep current format (cda-61)')
    console.log('   • Directive nodes: Add cda-61- prefix (cip-1 → cda-61-cip-1)')
    console.log('   • All edge references: Update to new IDs')

    console.log('\n✅ Ready for transformation phase')
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new IDAnalyzer()
  analyzer.analyzeIDs().catch(console.error)
}

module.exports = { IDAnalyzer }
