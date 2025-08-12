#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')

/**
 * Generate comprehensive ID mapping report
 */
class IDMappingReporter {
  constructor() {
    this.sourceDb = 'cda-import-test.db'
    this.targetDb = 'data/databases/the-loom-v2.db'
  }

  /**
   * Generate complete ID mapping report
   */
  async generateReport() {
    console.log('📋 GENERATING ID MAPPING REPORT')
    console.log('=' .repeat(50))

    try {
      const sourceNodes = await this.getNodes(this.sourceDb)
      const targetNodes = await this.getNodes(this.targetDb)

      // Create mapping
      const mapping = this.createMapping(sourceNodes, targetNodes)
      
      // Generate reports
      this.generateConsoleReport(mapping)
      this.generateMarkdownReport(mapping)
      this.generateCSVReport(mapping)

      console.log('\n✅ ID mapping reports generated successfully')

    } catch (error) {
      console.error('❌ Report generation failed:', error.message)
      throw error
    }
  }

  /**
   * Get all nodes from a database
   */
  async getNodes(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
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
            json_extract(body, '$.title') as title
          FROM nodes
          ORDER BY 
            CASE json_extract(body, '$.node_type')
              WHEN 'cda' THEN 1
              WHEN 'directive' THEN 2
              ELSE 3
            END,
            json_extract(body, '$.category'),
            json_extract(body, '$.id')
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
   * Create ID mapping between source and target
   */
  createMapping(sourceNodes, targetNodes) {
    const mapping = []
    
    // Create lookup map for target nodes
    const targetMap = new Map()
    targetNodes.forEach(node => {
      // Try to match by removing cda-61- prefix
      const originalId = node.id.replace(/^cda-61-/, '')
      targetMap.set(originalId, node)
      targetMap.set(node.id, node) // Also map by full ID
    })

    sourceNodes.forEach(sourceNode => {
      const targetNode = targetMap.get(sourceNode.id) || targetMap.get(`cda-61-${sourceNode.id}`)
      
      if (targetNode) {
        mapping.push({
          originalId: sourceNode.id,
          revisedId: targetNode.id,
          nodeType: sourceNode.node_type,
          category: sourceNode.category,
          title: sourceNode.title,
          changed: sourceNode.id !== targetNode.id
        })
      } else {
        mapping.push({
          originalId: sourceNode.id,
          revisedId: 'NOT_FOUND',
          nodeType: sourceNode.node_type,
          category: sourceNode.category,
          title: sourceNode.title,
          changed: true
        })
      }
    })

    return mapping
  }

  /**
   * Generate console report
   */
  generateConsoleReport(mapping) {
    console.log('\n📊 ID MAPPING SUMMARY')
    console.log('=' .repeat(30))

    const stats = {
      total: mapping.length,
      changed: mapping.filter(m => m.changed).length,
      unchanged: mapping.filter(m => !m.changed).length,
      notFound: mapping.filter(m => m.revisedId === 'NOT_FOUND').length
    }

    console.log(`📊 Total nodes: ${stats.total}`)
    console.log(`🔄 Changed IDs: ${stats.changed}`)
    console.log(`✅ Unchanged IDs: ${stats.unchanged}`)
    console.log(`❌ Not found: ${stats.notFound}`)

    // Show by category
    console.log('\n📂 Changes by Category:')
    const categories = [...new Set(mapping.map(m => m.category).filter(c => c))]
    categories.sort().forEach(category => {
      const categoryMappings = mapping.filter(m => m.category === category)
      const changed = categoryMappings.filter(m => m.changed).length
      console.log(`   ${category}: ${changed}/${categoryMappings.length} changed`)
    })

    // Show sample transformations
    console.log('\n📋 Sample Transformations:')
    mapping.filter(m => m.changed && m.revisedId !== 'NOT_FOUND')
           .slice(0, 10)
           .forEach(m => {
             console.log(`   ${m.originalId} → ${m.revisedId}`)
           })
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(mapping) {
    let markdown = `# ID Mapping Report: Original → Revised

Generated: ${new Date().toISOString()}

## Summary

| Metric | Count |
|--------|-------|
| Total Nodes | ${mapping.length} |
| Changed IDs | ${mapping.filter(m => m.changed).length} |
| Unchanged IDs | ${mapping.filter(m => !m.changed).length} |
| Not Found | ${mapping.filter(m => m.revisedId === 'NOT_FOUND').length} |

## Complete ID Mapping

| Original ID | Revised ID | Type | Category | Title | Changed |
|-------------|------------|------|----------|-------|---------|
`

    mapping.forEach(m => {
      const changed = m.changed ? '✅' : '❌'
      const title = (m.title || '').substring(0, 50) + (m.title && m.title.length > 50 ? '...' : '')
      markdown += `| ${m.originalId} | ${m.revisedId} | ${m.nodeType} | ${m.category || ''} | ${title} | ${changed} |\n`
    })

    markdown += `\n## Transformation Patterns

### CDA Metadata
- **Pattern**: Unchanged
- **Example**: \`cda-61\` → \`cda-61\`

### Directives
- **Pattern**: Add \`cda-61-\` prefix
- **Examples**: 
  - \`phi-1\` → \`cda-61-phi-1\`
  - \`opm-8\` → \`cda-61-opm-8\`
  - \`adv\` → \`cda-61-adv\`

### Benefits
1. **Enhanced Clarity**: Immediate source and version identification
2. **Namespace Safety**: Prevents ID collisions across data sources
3. **Query Efficiency**: Category-based filtering with LIKE patterns
4. **Future-Proof**: Ready for multiple CDA versions and data sources
`

    fs.writeFileSync('id-mapping-report.md', markdown)
    console.log('\n📄 Generated: id-mapping-report.md')
  }

  /**
   * Generate CSV report
   */
  generateCSVReport(mapping) {
    let csv = 'Original ID,Revised ID,Node Type,Category,Title,Changed\n'
    
    mapping.forEach(m => {
      const title = (m.title || '').replace(/"/g, '""') // Escape quotes
      csv += `"${m.originalId}","${m.revisedId}","${m.nodeType}","${m.category || ''}","${title}","${m.changed}"\n`
    })

    fs.writeFileSync('id-mapping-report.csv', csv)
    console.log('📊 Generated: id-mapping-report.csv')
  }
}

// Run report generation if called directly
if (require.main === module) {
  const reporter = new IDMappingReporter()
  reporter.generateReport().catch(console.error)
}

module.exports = { IDMappingReporter }
