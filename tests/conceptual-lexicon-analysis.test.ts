import { describe, it, expect, beforeAll } from 'vitest'
import { createDatabase, type Database } from './helpers/database'

const DB_FILE = 'conceptual-lexicon-full.db'

describe('Conceptual Lexicon Analysis', () => {
  let db: Database

  beforeAll(async () => {
    // Open the existing database file
    db = createDatabase({ 
      type: 'file', 
      filename: DB_FILE, 
      cleanup: false
    })
  })

  describe('Structural Analysis', () => {
    it('should analyze the overall structure and distribution', async () => {
      console.log('\n🏗️  STRUCTURAL ANALYSIS')
      console.log('=' .repeat(50))

      // Overall counts
      const totalNodes = await db.get('SELECT COUNT(*) as count FROM nodes')
      const totalEdges = await db.get('SELECT COUNT(*) as count FROM edges')
      
      console.log(`📊 Total Nodes: ${totalNodes.count}`)
      console.log(`📊 Total Edges: ${totalEdges.count}`)
      console.log(`📊 Graph Density: ${(totalEdges.count / (totalNodes.count * (totalNodes.count - 1))).toFixed(4)}`)

      // Node type distribution
      const nodeTypes = await db.all(`
        SELECT 
          json_extract(body, '$.node_type') as node_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / ${totalNodes.count}, 2) as percentage
        FROM nodes 
        GROUP BY json_extract(body, '$.node_type')
        ORDER BY count DESC
      `)

      console.log('\n📈 Node Type Distribution:')
      nodeTypes.forEach(type => {
        console.log(`   ${type.node_type}: ${type.count} (${type.percentage}%)`)
      })

      expect(nodeTypes.length).toBeGreaterThan(0)
    })

    it('should analyze category hierarchy and complexity', async () => {
      console.log('\n📂 CATEGORY ANALYSIS')
      console.log('=' .repeat(50))

      // Category distribution with term counts
      const categoryStats = await db.all(`
        SELECT 
          json_extract(c.body, '$.name') as category,
          COUNT(t.id) as term_count,
          ROUND(COUNT(t.id) * 100.0 / (
            SELECT COUNT(*) FROM nodes WHERE json_extract(body, '$.node_type') = 'term'
          ), 2) as percentage
        FROM nodes c
        LEFT JOIN edges e ON c.id = e.target AND json_extract(e.properties, '$.type') = 'belongs_to'
        LEFT JOIN nodes t ON e.source = t.id AND json_extract(t.body, '$.node_type') = 'term'
        WHERE json_extract(c.body, '$.node_type') = 'category'
        GROUP BY json_extract(c.body, '$.name')
        ORDER BY term_count DESC
        LIMIT 15
      `)

      console.log('\n🏆 Top 15 Categories by Term Count:')
      categoryStats.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.category}: ${cat.term_count} terms (${cat.percentage}%)`)
      })

      // Category complexity analysis
      const categoryComplexity = await db.all(`
        SELECT 
          LENGTH(json_extract(body, '$.name')) as name_length,
          COUNT(*) as count
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'category'
        GROUP BY LENGTH(json_extract(body, '$.name'))
        ORDER BY name_length
      `)

      console.log('\n📏 Category Name Length Distribution:')
      categoryComplexity.forEach(comp => {
        console.log(`   ${comp.name_length} chars: ${comp.count} categories`)
      })

      expect(categoryStats.length).toBeGreaterThan(0)
    })
  })

  describe('Content Analysis', () => {
    it('should analyze term characteristics and patterns', async () => {
      console.log('\n📝 TERM CONTENT ANALYSIS')
      console.log('=' .repeat(50))

      // Status distribution
      const statusDist = await db.all(`
        SELECT 
          json_extract(body, '$.status') as status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM nodes WHERE json_extract(body, '$.node_type') = 'term'
          ), 2) as percentage
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
        GROUP BY json_extract(body, '$.status')
        ORDER BY count DESC
      `)

      console.log('\n📊 Term Status Distribution:')
      statusDist.forEach(status => {
        console.log(`   ${status.status}: ${status.count} (${status.percentage}%)`)
      })

      // Definition length analysis
      const defLengthStats = await db.get(`
        SELECT 
          AVG(LENGTH(json_extract(body, '$.definition'))) as avg_length,
          MIN(LENGTH(json_extract(body, '$.definition'))) as min_length,
          MAX(LENGTH(json_extract(body, '$.definition'))) as max_length
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
      `)

      console.log('\n📏 Definition Length Statistics:')
      console.log(`   Average: ${Math.round(defLengthStats.avg_length)} characters`)
      console.log(`   Range: ${defLengthStats.min_length} - ${defLengthStats.max_length} characters`)

      // Find terms with longest and shortest definitions
      const extremeTerms = await db.all(`
        SELECT 
          json_extract(body, '$.term') as term,
          LENGTH(json_extract(body, '$.definition')) as def_length,
          CASE 
            WHEN LENGTH(json_extract(body, '$.definition')) = (
              SELECT MAX(LENGTH(json_extract(body, '$.definition'))) 
              FROM nodes WHERE json_extract(body, '$.node_type') = 'term'
            ) THEN 'longest'
            WHEN LENGTH(json_extract(body, '$.definition')) = (
              SELECT MIN(LENGTH(json_extract(body, '$.definition'))) 
              FROM nodes WHERE json_extract(body, '$.node_type') = 'term'
            ) THEN 'shortest'
          END as type
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND type IS NOT NULL
      `)

      console.log('\n🔍 Definition Length Extremes:')
      extremeTerms.forEach(term => {
        console.log(`   ${term.type}: "${term.term}" (${term.def_length} chars)`)
      })

      expect(statusDist.length).toBeGreaterThan(0)
    })

    it('should analyze operational heuristics patterns', async () => {
      console.log('\n⚙️  OPERATIONAL HEURISTICS ANALYSIS')
      console.log('=' .repeat(50))

      // Count OH terms
      const ohTerms = await db.all(`
        SELECT 
          json_extract(body, '$.term') as term,
          json_extract(body, '$.category') as category,
          json_extract(body, '$.status') as status
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND json_extract(body, '$.term') LIKE '%OH-%'
        ORDER BY json_extract(body, '$.term')
      `)

      console.log(`\n📊 Found ${ohTerms.length} Operational Heuristics`)

      // Extract OH numbers and analyze sequence
      const ohNumbers = ohTerms
        .map(term => {
          const match = term.term.match(/OH-(\d+)/)
          return match ? parseInt(match[1]) : null
        })
        .filter(num => num !== null)
        .sort((a, b) => a - b)

      if (ohNumbers.length > 0) {
        console.log(`\n🔢 OH Number Range: OH-${Math.min(...ohNumbers)} to OH-${Math.max(...ohNumbers)}`)
        
        // Find gaps in sequence
        const gaps = []
        for (let i = Math.min(...ohNumbers); i <= Math.max(...ohNumbers); i++) {
          if (!ohNumbers.includes(i)) {
            gaps.push(i)
          }
        }
        
        if (gaps.length > 0) {
          console.log(`\n❌ Missing OH Numbers: ${gaps.slice(0, 10).map(n => `OH-${n.toString().padStart(3, '0')}`).join(', ')}${gaps.length > 10 ? '...' : ''}`)
        }
      }

      // OH category distribution
      const ohCategories = await db.all(`
        SELECT 
          json_extract(body, '$.category') as category,
          COUNT(*) as count
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND json_extract(body, '$.term') LIKE '%OH-%'
        GROUP BY json_extract(body, '$.category')
        ORDER BY count DESC
      `)

      console.log('\n📂 OH Category Distribution:')
      ohCategories.forEach(cat => {
        console.log(`   ${cat.count}x: ${cat.category}`)
      })

      expect(ohTerms.length).toBeGreaterThan(0)
    })
  })

  describe('Relationship Analysis', () => {
    it('should analyze term relationships and connectivity', async () => {
      console.log('\n🔗 RELATIONSHIP ANALYSIS')
      console.log('=' .repeat(50))

      // Edge type distribution
      const edgeTypes = await db.all(`
        SELECT 
          json_extract(properties, '$.type') as edge_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM edges), 2) as percentage
        FROM edges 
        GROUP BY json_extract(properties, '$.type')
        ORDER BY count DESC
      `)

      console.log('\n📊 Edge Type Distribution:')
      edgeTypes.forEach(type => {
        console.log(`   ${type.edge_type}: ${type.count} (${type.percentage}%)`)
      })

      // Term-to-term relationships only
      const termRelationships = await db.all(`
        SELECT 
          json_extract(s.body, '$.term') as source_term,
          json_extract(t.body, '$.term') as target_term,
          json_extract(e.properties, '$.type') as relationship_type,
          json_extract(e.properties, '$.context') as context
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'term'
          AND json_extract(t.body, '$.node_type') = 'term'
        ORDER BY json_extract(e.properties, '$.type')
      `)

      console.log(`\n🔗 Term-to-Term Relationships Found: ${termRelationships.length}`)
      if (termRelationships.length > 0) {
        console.log('\n📋 Relationship Details:')
        termRelationships.forEach(rel => {
          console.log(`   "${rel.source_term}" --[${rel.relationship_type}]--> "${rel.target_term}"`)
          if (rel.context) {
            console.log(`      Context: ${rel.context}`)
          }
        })
      }

      // Find most connected terms
      const connectivity = await db.all(`
        SELECT 
          json_extract(n.body, '$.term') as term,
          COUNT(e.source) as outgoing_connections,
          (SELECT COUNT(*) FROM edges e2 WHERE e2.target = n.id) as incoming_connections,
          COUNT(e.source) + (SELECT COUNT(*) FROM edges e2 WHERE e2.target = n.id) as total_connections
        FROM nodes n
        LEFT JOIN edges e ON n.id = e.source
        WHERE json_extract(n.body, '$.node_type') = 'term'
        GROUP BY n.id, json_extract(n.body, '$.term')
        ORDER BY total_connections DESC
        LIMIT 10
      `)

      console.log('\n🌟 Most Connected Terms:')
      connectivity.forEach((term, index) => {
        console.log(`   ${index + 1}. "${term.term}": ${term.total_connections} connections (${term.outgoing_connections} out, ${term.incoming_connections} in)`)
      })

      expect(edgeTypes.length).toBeGreaterThan(0)
    })
  })

  describe('Temporal Analysis', () => {
    it('should analyze temporal patterns in term creation', async () => {
      console.log('\n⏰ TEMPORAL ANALYSIS')
      console.log('=' .repeat(50))

      // Extract dates and analyze creation patterns
      const temporalData = await db.all(`
        SELECT 
          json_extract(body, '$.timestamp_added') as timestamp,
          json_extract(body, '$.term') as term,
          DATE(json_extract(body, '$.timestamp_added')) as date,
          strftime('%Y-%m', json_extract(body, '$.timestamp_added')) as year_month
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND json_extract(body, '$.timestamp_added') IS NOT NULL
        ORDER BY json_extract(body, '$.timestamp_added')
      `)

      if (temporalData.length > 0) {
        // Monthly creation distribution
        const monthlyStats = await db.all(`
          SELECT 
            strftime('%Y-%m', json_extract(body, '$.timestamp_added')) as year_month,
            COUNT(*) as count
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'term'
            AND json_extract(body, '$.timestamp_added') IS NOT NULL
          GROUP BY strftime('%Y-%m', json_extract(body, '$.timestamp_added'))
          ORDER BY year_month
        `)

        console.log('\n📅 Monthly Term Creation:')
        monthlyStats.forEach(month => {
          console.log(`   ${month.year_month}: ${month.count} terms`)
        })

        // Find creation timeline extremes
        const firstTerm = temporalData[0]
        const lastTerm = temporalData[temporalData.length - 1]
        
        console.log('\n🕐 Timeline:')
        console.log(`   First term: "${firstTerm.term}" (${firstTerm.date})`)
        console.log(`   Latest term: "${lastTerm.term}" (${lastTerm.date})`)
        console.log(`   Development span: ${temporalData.length} terms over ${monthlyStats.length} months`)
      }

      expect(temporalData.length).toBeGreaterThan(0)
    })
  })

  describe('Semantic Analysis', () => {
    it('should analyze semantic patterns and keywords', async () => {
      console.log('\n🧠 SEMANTIC ANALYSIS')
      console.log('=' .repeat(50))

      // Find common keywords in definitions
      const definitions = await db.all(`
        SELECT 
          json_extract(body, '$.term') as term,
          json_extract(body, '$.definition') as definition
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND json_extract(body, '$.definition') IS NOT NULL
      `)

      // Simple keyword extraction (words that appear frequently)
      const wordCounts = new Map<string, number>()
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'])

      definitions.forEach(def => {
        const words = def.definition
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3 && !stopWords.has(word))
        
        words.forEach(word => {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        })
      })

      const topWords = Array.from(wordCounts.entries())
        .filter(([word, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)

      console.log('\n🔤 Most Common Keywords in Definitions:')
      topWords.forEach(([word, count], index) => {
        console.log(`   ${index + 1}. "${word}": ${count} occurrences`)
      })

      // Find terms with context references
      const termsWithRefs = await db.get(`
        SELECT COUNT(*) as count
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND json_extract(body, '$.context_reference') IS NOT NULL
          AND json_extract(body, '$.context_reference') != ''
      `)

      console.log(`\n🔗 Terms with Context References: ${termsWithRefs.count}`)

      expect(topWords.length).toBeGreaterThan(0)
    })
  })

  afterAll(async () => {
    await db.close()
    console.log('\n' + '='.repeat(50))
    console.log('📊 ANALYSIS COMPLETE')
    console.log('='.repeat(50))
  })
})
