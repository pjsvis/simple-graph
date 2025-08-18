import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDatabase, type Database } from '../helpers/database'
import { SimpleGraph } from '../../src/SimpleGraph'
import { importCda } from '../../src/parsers/cda-parser'

describe('Core Directive Array Comprehensive Analysis', () => {
  let db: Database
  let graph: SimpleGraph
  let testDbFile: string

  beforeEach(async () => {
    testDbFile = `cda-analysis-test-${Date.now()}.db`
    db = createDatabase({
      type: 'file',
      filename: testDbFile,
      cleanup: true
    })
    graph = await SimpleGraph.connect({ path: testDbFile })
    await importCda(graph, 'data/source/core-directive-array.md')
  })

  afterEach(async () => {
    if (graph) {
      await graph.close()
    }
    if (db) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for file release
      db.close()
    }
  })

  describe('1. Directive Patterns and Relationships Analysis', () => {
    it('should analyze directive patterns and relationship structures', async () => {
      console.log('\n🔍 DIRECTIVE PATTERNS & RELATIONSHIPS ANALYSIS')
      console.log('=' .repeat(60))

      // Overall relationship statistics
      const relationshipStats = await db.all(`
        SELECT 
          json_extract(properties, '$.type') as relationship_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM edges 
            WHERE json_extract(properties, '$.type') NOT IN ('belongs_to_cda')
          ), 2) as percentage
        FROM edges 
        WHERE json_extract(properties, '$.type') NOT IN ('belongs_to_cda')
        GROUP BY json_extract(properties, '$.type')
        ORDER BY count DESC
      `)

      console.log('\n📊 Relationship Type Distribution:')
      relationshipStats.forEach(rel => {
        console.log(`   ${rel.relationship_type}: ${rel.count} (${rel.percentage}%)`)
      })

      // Directive connectivity analysis
      const connectivityStats = await db.all(`
        SELECT 
          json_extract(n.body, '$.directive_id') as directive_id,
          json_extract(n.body, '$.category') as category,
          COUNT(DISTINCT e_out.target) as outgoing_refs,
          COUNT(DISTINCT e_in.source) as incoming_refs,
          COUNT(DISTINCT e_out.target) + COUNT(DISTINCT e_in.source) as total_connections
        FROM nodes n
        LEFT JOIN edges e_out ON n.id = e_out.source 
          AND json_extract(e_out.properties, '$.type') NOT IN ('belongs_to_cda')
        LEFT JOIN edges e_in ON n.id = e_in.target 
          AND json_extract(e_in.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY n.id
        ORDER BY total_connections DESC
        LIMIT 15
      `)

      console.log('\n🌟 Most Connected Directives:')
      connectivityStats.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.directive_id} (${dir.category}): ${dir.total_connections} connections (${dir.outgoing_refs} out, ${dir.incoming_refs} in)`)
      })

      // Category interconnectivity
      const categoryConnections = await db.all(`
        SELECT 
          json_extract(s.body, '$.category') as source_category,
          json_extract(t.body, '$.category') as target_category,
          COUNT(*) as connection_count
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.node_type') = 'directive'
          AND json_extract(s.body, '$.category') = json_extract(t.body, '$.category')
        GROUP BY source_category, target_category
        ORDER BY connection_count DESC
      `)

      console.log('\n🔗 Inter-Category Connections:')
      categoryConnections.forEach(conn => {
        console.log(`   ${conn.source_category} → ${conn.target_category}: ${conn.connection_count} connections`)
      })

      expect(relationshipStats.length).toBeGreaterThan(0)
      expect(connectivityStats.length).toBeGreaterThan(0)
    })

    it('should identify directive reference patterns', async () => {
      console.log('\n📋 DIRECTIVE REFERENCE PATTERNS')
      console.log('=' .repeat(60))

      // Find directives that reference external systems (OH, etc.)
      const externalRefs = await db.all(`
        SELECT 
          json_extract(s.body, '$.directive_id') as directive_id,
          json_extract(s.body, '$.title') as title,
          json_extract(t.body, '$.directive_id') as referenced_id,
          json_extract(e.properties, '$.context') as context
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.directive_id') LIKE 'OH-%'
        ORDER BY directive_id
      `)

      console.log('\n🔗 External System References (OH):')
      externalRefs.forEach(ref => {
        console.log(`   ${ref.directive_id}: References ${ref.referenced_id}`)
        console.log(`      Context: ${ref.context}`)
      })

      // Self-referential patterns within categories
      const selfRefs = await db.all(`
        SELECT 
          json_extract(s.body, '$.category') as category,
          COUNT(*) as internal_refs
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.node_type') = 'directive'
          AND json_extract(s.body, '$.category') = json_extract(t.body, '$.category')
        GROUP BY category
        ORDER BY internal_refs DESC
      `)

      console.log('\n🔄 Internal Category References:')
      selfRefs.forEach(ref => {
        console.log(`   ${ref.category}: ${ref.internal_refs} internal references`)
      })

      expect(externalRefs.length + selfRefs.length).toBeGreaterThan(0)
    })
  })

  describe('2. Central/Critical Directives Analysis', () => {
    it('should identify central and critical directives', async () => {
      console.log('\n⭐ CENTRAL & CRITICAL DIRECTIVES ANALYSIS')
      console.log('=' .repeat(60))

      // Hub directives (most referenced)
      const hubDirectives = await db.all(`
        SELECT 
          json_extract(n.body, '$.directive_id') as directive_id,
          json_extract(n.body, '$.title') as title,
          json_extract(n.body, '$.category') as category,
          COUNT(e.source) as incoming_references,
          LENGTH(json_extract(n.body, '$.description')) as description_length
        FROM nodes n
        LEFT JOIN edges e ON n.id = e.target 
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY n.id
        HAVING incoming_references > 0
        ORDER BY incoming_references DESC, description_length DESC
        LIMIT 10
      `)

      console.log('\n🎯 Hub Directives (Most Referenced):')
      hubDirectives.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}" `)
        console.log(`      Category: ${dir.category}`)
        console.log(`      Incoming References: ${dir.incoming_references}`)
        console.log(`      Description Length: ${dir.description_length} chars`)
        console.log('')
      })

      // Authority directives (reference many others)
      const authorityDirectives = await db.all(`
        SELECT 
          json_extract(n.body, '$.directive_id') as directive_id,
          json_extract(n.body, '$.title') as title,
          json_extract(n.body, '$.category') as category,
          COUNT(e.target) as outgoing_references
        FROM nodes n
        LEFT JOIN edges e ON n.id = e.source 
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY n.id
        HAVING outgoing_references > 0
        ORDER BY outgoing_references DESC
        LIMIT 10
      `)

      console.log('\n📡 Authority Directives (Reference Many Others):')
      authorityDirectives.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}" `)
        console.log(`      Category: ${dir.category}`)
        console.log(`      Outgoing References: ${dir.outgoing_references}`)
        console.log('')
      })

      // Critical path analysis (directives that bridge categories)
      const bridgeDirectives = await db.all(`
        SELECT 
          json_extract(s.body, '$.directive_id') as directive_id,
          json_extract(s.body, '$.title') as title,
          json_extract(s.body, '$.category') as source_category,
          COUNT(DISTINCT json_extract(t.body, '$.category')) as categories_referenced
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.node_type') = 'directive'
          AND json_extract(s.body, '$.category') != json_extract(t.body, '$.category')
        GROUP BY s.id
        ORDER BY categories_referenced DESC
        LIMIT 10
      `)

      console.log('\n🌉 Bridge Directives (Cross-Category Connectors):')
      bridgeDirectives.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}" `)
        console.log(`      Source Category: ${dir.category}`)
        console.log(`      Categories Referenced: ${dir.categories_referenced}`)
        console.log('')
      })

      expect(hubDirectives.length + authorityDirectives.length + bridgeDirectives.length).toBeGreaterThan(0)
    })
  })

  describe('3. Directive Clusters and Dependencies', () => {
    it('should identify directive clusters and dependency patterns', async () => {
      console.log('\n🔗 DIRECTIVE CLUSTERS & DEPENDENCIES')
      console.log('=' .repeat(60))

      // Category cohesion analysis
      const categoryCohesion = await db.all(`
        SELECT 
          json_extract(n.body, '$.category') as category,
          json_extract(n.body, '$.category_title') as category_title,
          COUNT(n.id) as total_directives,
          COUNT(DISTINCT e_internal.source) as internally_connected,
          ROUND(COUNT(DISTINCT e_internal.source) * 100.0 / COUNT(n.id), 2) as cohesion_percentage
        FROM nodes n
        LEFT JOIN edges e_internal ON n.id = e_internal.source
          AND EXISTS (
            SELECT 1 FROM nodes t 
            WHERE t.id = e_internal.target 
              AND json_extract(t.body, '$.category') = json_extract(n.body, '$.category')
              AND json_extract(e_internal.properties, '$.type') NOT IN ('belongs_to_cda')
          )
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY category
        ORDER BY cohesion_percentage DESC, total_directives DESC
      `)

      console.log('\n📊 Category Cohesion Analysis:')
      categoryCohesion.forEach(cat => {
        console.log(`   ${cat.category} (${cat.category_title}):`)
        console.log(`      Total Directives: ${cat.total_directives}`)
        console.log(`      Internally Connected: ${cat.internally_connected}`)
        console.log(`      Cohesion: ${cat.cohesion_percentage}%`)
        console.log('')
      })

      // Simplified dependency analysis (avoiding complex recursive CTE)
      const dependencyChains = await db.all(`
        SELECT
          json_extract(s.body, '$.directive_id') as source_directive,
          json_extract(t.body, '$.directive_id') as target_directive,
          json_extract(s.body, '$.category') as source_category,
          json_extract(t.body, '$.category') as target_category,
          json_extract(e.properties, '$.type') as relationship_type
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.node_type') = 'directive'
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
        ORDER BY source_directive, target_directive
        LIMIT 10
      `)

      console.log('\n⛓️  Direct Dependencies:')
      dependencyChains.forEach((dep, index) => {
        console.log(`   ${index + 1}. ${dep.source_directive} (${dep.source_category}) → ${dep.target_directive} (${dep.target_category})`)
        console.log(`      Relationship: ${dep.relationship_type}`)
      })

      expect(categoryCohesion.length).toBeGreaterThan(0)
    })
  })

  describe('4. Cross-Reference with Existing OH Terms', () => {
    it('should analyze integration with operational heuristics', async () => {
      console.log('\n🔄 CROSS-REFERENCE WITH OH TERMS')
      console.log('=' .repeat(60))

      // Find all OH references in directive descriptions
      const ohReferences = await db.all(`
        SELECT
          json_extract(s.body, '$.directive_id') as directive_id,
          json_extract(s.body, '$.title') as title,
          json_extract(s.body, '$.category') as category,
          json_extract(t.body, '$.directive_id') as oh_reference,
          json_extract(e.properties, '$.context') as context
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.directive_id') LIKE 'OH-%'
        ORDER BY directive_id, oh_reference
      `)

      console.log('\n🔗 Directive → OH References:')
      ohReferences.forEach(ref => {
        console.log(`   ${ref.directive_id}: References ${ref.oh_reference}`)
        console.log(`      "${ref.title}" `)
        console.log(`      Context: ${ref.context}`)
        console.log('')
      })

      // Categories that reference OH terms
      const categoriesWithOH = await db.all(`
        SELECT
          json_extract(s.body, '$.category') as category,
          COUNT(DISTINCT json_extract(t.body, '$.directive_id')) as oh_references,
          COUNT(DISTINCT s.id) as directives_with_oh_refs
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.directive_id') LIKE 'OH-%'
        GROUP BY category
        ORDER BY oh_references DESC
      `)

      console.log('\n📊 Categories with OH Integration:')
      categoriesWithOH.forEach(cat => {
        console.log(`   ${cat.category}: ${cat.oh_references} OH references from ${cat.directives_with_oh_refs} directives`)
      })

      // Potential missing integrations (directives that could reference OH but don't)
      const potentialIntegrations = await db.all(`
        SELECT
          json_extract(body, '$.directive_id') as directive_id,
          json_extract(body, '$.title') as title,
          json_extract(body, '$.category') as category,
          LENGTH(json_extract(body, '$.description')) as description_length
        FROM nodes
        WHERE json_extract(body, '$.node_type') = 'directive'
          AND json_extract(body, '$.description') LIKE '%operational%'
          AND NOT EXISTS (
            SELECT 1 FROM edges e
            JOIN nodes t ON e.target = t.id
            WHERE e.source = nodes.id
              AND json_extract(t.body, '$.directive_id') LIKE 'OH-%'
          )
        ORDER BY description_length DESC
        LIMIT 10
      `)

      console.log('\n💡 Potential OH Integration Opportunities:')
      potentialIntegrations.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}" `)
        console.log(`      Category: ${dir.category}`)
        console.log(`      Description mentions`);
        console.log('')
      })

      expect(ohReferences.length + categoriesWithOH.length + potentialIntegrations.length).toBeGreaterThan(0)
    })
  })
})

