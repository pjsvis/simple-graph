import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createDatabase, type Database } from '../helpers/database'

const SOURCE_DB = 'cda-import-test.db'
const TARGET_DB = 'data/databases/the-loom-v2.db'

describe('ID Refactor Validation Tests', () => {
  let sourceDb: Database
  let targetDb: Database

  beforeAll(async () => {
    // Connect to both databases
    sourceDb = createDatabase({ 
      type: 'file', 
      filename: SOURCE_DB, 
      cleanup: false 
    })
    
    targetDb = createDatabase({
      type: 'file',
      filename: TARGET_DB,
      cleanup: false
    })
  })

  afterAll(async () => {
    if (sourceDb) await sourceDb.close()
    if (targetDb) await targetDb.close()
  })

  describe('Database Integrity', () => {
    it('should preserve node and edge counts', async () => {
      console.log('\n🔍 VALIDATING DATABASE INTEGRITY')
      console.log('=' .repeat(50))

      // Count nodes in both databases
      const sourceNodes = await sourceDb.get('SELECT COUNT(*) as count FROM nodes')
      const targetNodes = await targetDb.get('SELECT COUNT(*) as count FROM nodes')

      console.log(`📊 Source nodes: ${sourceNodes.count}`)
      console.log(`📊 Target nodes: ${targetNodes.count}`)

      expect(targetNodes.count).toBe(sourceNodes.count)

      // Count edges in both databases
      const sourceEdges = await sourceDb.get('SELECT COUNT(*) as count FROM edges')
      const targetEdges = await targetDb.get('SELECT COUNT(*) as count FROM edges')

      console.log(`🔗 Source edges: ${sourceEdges.count}`)
      console.log(`🔗 Target edges: ${targetEdges.count}`)

      // Target should have same or fewer edges (dangling edges may be removed)
      expect(targetEdges.count).toBeLessThanOrEqual(sourceEdges.count)

      // Log if edges were removed
      if (targetEdges.count < sourceEdges.count) {
        const removed = sourceEdges.count - targetEdges.count
        console.log(`📝 Note: ${removed} dangling edges were removed during refactoring`)
      }
    })

    it('should have no dangling edges', async () => {
      console.log('\n🔍 Checking for dangling edges...')

      const danglingEdges = await targetDb.get(`
        SELECT COUNT(*) as count
        FROM edges e 
        WHERE NOT EXISTS (
          SELECT 1 FROM nodes n WHERE json_extract(n.body, '$.id') = e.source
        ) OR NOT EXISTS (
          SELECT 1 FROM nodes n WHERE json_extract(n.body, '$.id') = e.target
        )
      `)

      console.log(`🔗 Dangling edges: ${danglingEdges.count}`)
      expect(danglingEdges.count).toBe(0)
    })
  })

  describe('ID Format Compliance', () => {
    it('should have all directive IDs in new format', async () => {
      console.log('\n🔍 VALIDATING ID FORMAT COMPLIANCE')
      console.log('=' .repeat(50))

      // Check directive ID format
      const directiveIds = await targetDb.all(`
        SELECT json_extract(body, '$.id') as id
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'directive'
      `)

      console.log(`📋 Checking ${directiveIds.length} directive IDs...`)

      let validCount = 0
      let invalidIds: string[] = []

      directiveIds.forEach(row => {
        const id = row.id
        // Should match patterns:
        // - cda-61-xxx-n (standard directive)
        // - cda-61-xxx (directive without number)
        if (/^cda-\d+-[a-z]+-\d+$/.test(id) || /^cda-\d+-[a-z]+$/.test(id)) {
          validCount++
        } else {
          invalidIds.push(id)
        }
      })

      console.log(`✅ Valid directive IDs: ${validCount}/${directiveIds.length}`)
      
      if (invalidIds.length > 0) {
        console.log('❌ Invalid directive IDs:')
        invalidIds.forEach(id => console.log(`   - ${id}`))
      }

      expect(invalidIds.length).toBe(0)
    })

    it('should have CDA metadata IDs unchanged', async () => {
      console.log('\n🔍 Checking CDA metadata IDs...')

      const cdaIds = await targetDb.all(`
        SELECT json_extract(body, '$.id') as id
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'cda'
      `)

      console.log(`📋 Found ${cdaIds.length} CDA metadata nodes`)

      cdaIds.forEach(row => {
        const id = row.id
        console.log(`   CDA ID: ${id}`)
        // Should match pattern: cda-61
        expect(id).toMatch(/^cda-\d+$/)
      })
    })
  })

  describe('Relationship Preservation', () => {
    it('should preserve specific directive relationships', async () => {
      console.log('\n🔍 VALIDATING RELATIONSHIP PRESERVATION')
      console.log('=' .repeat(50))

      // Test specific known relationships
      const testCases = [
        {
          source: 'cda-61-ipr-1',
          target: 'cda-61-opm-8',
          description: 'IPR-1 references OPM-8'
        },
        {
          source: 'cda-61-qpg-2',
          target: 'cda-61-opm-8',
          description: 'QPG-2 references OPM-8'
        }
      ]

      for (const testCase of testCases) {
        const relationship = await targetDb.get(`
          SELECT COUNT(*) as count
          FROM edges 
          WHERE source = ? AND target = ?
        `, [testCase.source, testCase.target])

        console.log(`🔗 ${testCase.description}: ${relationship.count > 0 ? '✅' : '❌'}`)
        expect(relationship.count).toBeGreaterThan(0)
      }
    })

    it('should preserve hub directive connectivity', async () => {
      console.log('\n🔍 Checking hub directive connectivity...')

      // OPM-8 should be the most connected directive
      const hubConnectivity = await targetDb.get(`
        SELECT 
          COUNT(DISTINCT e.source) as incoming_count,
          COUNT(DISTINCT e.target) as outgoing_count
        FROM edges e
        WHERE e.target = 'cda-61-opm-8' OR e.source = 'cda-61-opm-8'
      `)

      console.log(`🎯 OPM-8 connectivity: ${hubConnectivity.incoming_count + hubConnectivity.outgoing_count} total connections`)
      
      // Should have multiple connections (it was the most referenced in original)
      expect(hubConnectivity.incoming_count + hubConnectivity.outgoing_count).toBeGreaterThan(5)
    })
  })

  describe('Graph Traversal', () => {
    it('should support traversal queries with new IDs', async () => {
      console.log('\n🔍 VALIDATING GRAPH TRAVERSAL')
      console.log('=' .repeat(50))

      // Test traversal from a specific directive
      const traversalResult = await targetDb.all(`
        WITH RECURSIVE traverse(node_id, depth) AS (
          SELECT 'cda-61-phi-1', 0
          UNION
          SELECT e.target, t.depth + 1
          FROM edges e
          JOIN traverse t ON e.source = t.node_id
          WHERE t.depth < 2
        )
        SELECT node_id, depth FROM traverse
      `)

      console.log(`🌐 Traversal from cda-61-phi-1: ${traversalResult.length} nodes reached`)
      
      traversalResult.forEach(row => {
        console.log(`   Depth ${row.depth}: ${row.node_id}`)
      })

      expect(traversalResult.length).toBeGreaterThan(1)
    })

    it('should support category-based queries', async () => {
      console.log('\n🔍 Testing category-based queries...')

      // Find all PHI directives
      const phiDirectives = await targetDb.all(`
        SELECT json_extract(body, '$.id') as id
        FROM nodes 
        WHERE json_extract(body, '$.id') LIKE 'cda-61-phi-%'
      `)

      console.log(`📋 PHI directives found: ${phiDirectives.length}`)
      
      phiDirectives.slice(0, 3).forEach(row => {
        console.log(`   ${row.id}`)
      })

      expect(phiDirectives.length).toBeGreaterThan(0)

      // Find all COG directives
      const cogDirectives = await targetDb.all(`
        SELECT json_extract(body, '$.id') as id
        FROM nodes 
        WHERE json_extract(body, '$.id') LIKE 'cda-61-cog-%'
      `)

      console.log(`🧠 COG directives found: ${cogDirectives.length}`)
      expect(cogDirectives.length).toBeGreaterThan(0)
    })
  })

  describe('Source Database Preservation', () => {
    it('should leave source database completely unchanged', async () => {
      console.log('\n🔍 VALIDATING SOURCE PRESERVATION')
      console.log('=' .repeat(50))

      // Check that source still has original ID format
      const sourceDirectiveIds = await sourceDb.all(`
        SELECT json_extract(body, '$.id') as id
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'directive'
        LIMIT 5
      `)

      console.log('📋 Source database directive IDs (should be unchanged):')
      sourceDirectiveIds.forEach(row => {
        console.log(`   ${row.id}`)
        // Should NOT have cda-61- prefix
        expect(row.id).not.toMatch(/^cda-\d+-/)
      })

      // Verify source has original format
      expect(sourceDirectiveIds[0].id).toMatch(/^[a-z]+-\d+$/)
    })
  })
})
