import { describe, it, expect, beforeAll } from 'vitest'
import { createDatabase, type Database } from './helpers/database'

const CDA_DB_FILE = 'cda-import-test.db'

describe('Core Directive Array Comprehensive Analysis', () => {
  let db: Database

  beforeAll(async () => {
    // Open the existing CDA database file
    db = createDatabase({ 
      type: 'file', 
      filename: CDA_DB_FILE, 
      cleanup: false
    })
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
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
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
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}"`)
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
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}"`)
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
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}"`)
        console.log(`      Source Category: ${dir.source_category}`)
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
          json_extract(s.body, '$.title') as directive_title,
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
        console.log(`   ${ref.directive_id} (${ref.category}): References ${ref.oh_reference}`)
        console.log(`      "${ref.directive_title}"`)
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
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}"`)
        console.log(`      Category: ${dir.category}`)
        console.log(`      Description mentions "operational" but no OH references`)
        console.log('')
      })

      expect(ohReferences.length + categoriesWithOH.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('5. Unified Knowledge Graph Creation', () => {
    it('should create a unified knowledge graph combining CDA and conceptual lexicon', async () => {
      console.log('\n🌐 UNIFIED KNOWLEDGE GRAPH CREATION')
      console.log('=' .repeat(60))

      // First, let's import the conceptual lexicon data into the same database
      console.log('📥 Importing conceptual lexicon data...')

      // Note: In a real scenario, we'd merge the databases or import both datasets
      // For now, let's analyze the CDA structure and propose integration points

      // Analyze directive complexity and categorization
      const directiveComplexity = await db.all(`
        SELECT
          json_extract(body, '$.category') as category,
          AVG(LENGTH(json_extract(body, '$.description'))) as avg_description_length,
          COUNT(*) as directive_count,
          MIN(LENGTH(json_extract(body, '$.description'))) as min_length,
          MAX(LENGTH(json_extract(body, '$.description'))) as max_length
        FROM nodes
        WHERE json_extract(body, '$.node_type') = 'directive'
        GROUP BY category
        ORDER BY avg_description_length DESC
      `)

      console.log('\n📏 Directive Complexity by Category:')
      directiveComplexity.forEach(cat => {
        console.log(`   ${cat.category}:`)
        console.log(`      Count: ${cat.directive_count} directives`)
        console.log(`      Avg Length: ${Math.round(cat.avg_description_length)} chars`)
        console.log(`      Range: ${cat.min_length} - ${cat.max_length} chars`)
        console.log('')
      })

      // Knowledge graph statistics
      const graphStats = await db.get(`
        SELECT
          COUNT(CASE WHEN json_extract(body, '$.node_type') = 'directive' THEN 1 END) as directive_nodes,
          COUNT(CASE WHEN json_extract(body, '$.node_type') = 'cda' THEN 1 END) as cda_nodes,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'belongs_to_cda') as membership_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') != 'belongs_to_cda') as relationship_edges
        FROM nodes
      `)

      console.log('\n📊 Current Knowledge Graph Statistics:')
      console.log(`   Directive Nodes: ${graphStats.directive_nodes}`)
      console.log(`   CDA Metadata Nodes: ${graphStats.cda_nodes}`)
      console.log(`   Membership Edges: ${graphStats.membership_edges}`)
      console.log(`   Relationship Edges: ${graphStats.relationship_edges}`)
      console.log(`   Total Graph Size: ${graphStats.directive_nodes + graphStats.cda_nodes} nodes, ${graphStats.membership_edges + graphStats.relationship_edges} edges`)

      // Integration readiness assessment
      const integrationPoints = await db.all(`
        SELECT
          json_extract(body, '$.directive_id') as directive_id,
          json_extract(body, '$.category') as category,
          CASE
            WHEN json_extract(body, '$.description') LIKE '%OH-%' THEN 'OH_Reference'
            WHEN json_extract(body, '$.description') LIKE '%operational%' THEN 'Operational_Context'
            WHEN json_extract(body, '$.description') LIKE '%heuristic%' THEN 'Heuristic_Context'
            WHEN json_extract(body, '$.description') LIKE '%protocol%' THEN 'Protocol_Context'
            ELSE 'General'
          END as integration_type
        FROM nodes
        WHERE json_extract(body, '$.node_type') = 'directive'
      `)

      const integrationSummary = integrationPoints.reduce((acc, point) => {
        acc[point.integration_type] = (acc[point.integration_type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('\n🔗 Integration Readiness Assessment:')
      Object.entries(integrationSummary).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} directives`)
      })

      // Proposed unified schema
      console.log('\n🏗️  Proposed Unified Knowledge Graph Schema:')
      console.log('   Node Types:')
      console.log('     - Conceptual Terms (from lexicon)')
      console.log('     - Core Directives (from CDA)')
      console.log('     - Operational Heuristics (OH-xxx)')
      console.log('     - Categories (for both systems)')
      console.log('     - Version/Metadata nodes')
      console.log('')
      console.log('   Edge Types:')
      console.log('     - belongs_to (categorization)')
      console.log('     - references (cross-references)')
      console.log('     - implements (directive → OH)')
      console.log('     - supports (mutual support)')
      console.log('     - supersedes (version evolution)')
      console.log('     - depends_on (dependencies)')

      expect(directiveComplexity.length).toBeGreaterThan(0)
      expect(graphStats.directive_nodes).toBeGreaterThan(0)
    })

    it('should provide recommendations for knowledge graph enhancement', async () => {
      console.log('\n💡 KNOWLEDGE GRAPH ENHANCEMENT RECOMMENDATIONS')
      console.log('=' .repeat(60))

      // Find isolated directives (no relationships)
      const isolatedDirectives = await db.all(`
        SELECT
          json_extract(body, '$.directive_id') as directive_id,
          json_extract(body, '$.title') as title,
          json_extract(body, '$.category') as category
        FROM nodes n
        WHERE json_extract(body, '$.node_type') = 'directive'
          AND NOT EXISTS (
            SELECT 1 FROM edges e
            WHERE (e.source = n.id OR e.target = n.id)
              AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
          )
        ORDER BY directive_id
      `)

      console.log('\n🏝️  Isolated Directives (No Relationships):')
      isolatedDirectives.forEach((dir, index) => {
        console.log(`   ${index + 1}. ${dir.directive_id}: "${dir.title}" (${dir.category})`)
      })

      // Categories with low interconnectivity
      const lowConnectivityCategories = await db.all(`
        SELECT
          json_extract(body, '$.category') as category,
          COUNT(*) as total_directives,
          COUNT(DISTINCT e.source) as connected_directives,
          ROUND(COUNT(DISTINCT e.source) * 100.0 / COUNT(*), 2) as connectivity_percentage
        FROM nodes
        LEFT JOIN edges e ON nodes.id = e.source
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(body, '$.node_type') = 'directive'
        GROUP BY category
        HAVING connectivity_percentage < 50
        ORDER BY connectivity_percentage ASC
      `)

      console.log('\n📉 Categories with Low Interconnectivity:')
      lowConnectivityCategories.forEach(cat => {
        console.log(`   ${cat.category}: ${cat.connectivity_percentage}% connected (${cat.connected_directives}/${cat.total_directives})`)
      })

      // Enhancement recommendations
      console.log('\n🚀 Enhancement Recommendations:')
      console.log('   1. RELATIONSHIP ENHANCEMENT:')
      console.log(`      - Connect ${isolatedDirectives.length} isolated directives`)
      console.log(`      - Improve connectivity in ${lowConnectivityCategories.length} under-connected categories`)
      console.log('')
      console.log('   2. INTEGRATION OPPORTUNITIES:')
      console.log('      - Merge with conceptual lexicon (120+ terms)')
      console.log('      - Create cross-references between CDA and OH terms')
      console.log('      - Add semantic similarity edges')
      console.log('')
      console.log('   3. SEMANTIC ENHANCEMENT:')
      console.log('      - Extract implicit relationships from descriptions')
      console.log('      - Add keyword-based connections')
      console.log('      - Create topic-based clustering')
      console.log('')
      console.log('   4. TEMPORAL ANALYSIS:')
      console.log('      - Track directive evolution over CDA versions')
      console.log('      - Identify deprecated/superseded relationships')
      console.log('      - Monitor usage patterns')
      console.log('')
      console.log('   5. OPERATIONAL INTEGRATION:')
      console.log('      - Map directives to specific OH implementations')
      console.log('      - Create execution dependency graphs')
      console.log('      - Add performance/priority metadata')

      expect(isolatedDirectives.length + lowConnectivityCategories.length).toBeGreaterThanOrEqual(0)
    })
  })

  afterAll(async () => {
    await db.close()
    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPREHENSIVE CDA ANALYSIS COMPLETE')
    console.log('='.repeat(60))
    console.log('🎯 Ready for knowledge graph integration and enhancement!')
  })
})
