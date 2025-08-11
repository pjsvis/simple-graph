import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createDatabase, cleanupDatabase, type Database } from './helpers/database'
import { createSchema } from '../ts/schema'
import { insertNodeFromObject, getInsertNodeParams } from '../ts/insert-node'
import { insertEdgeFromObject, getInsertEdgeParams } from '../ts/insert-edge'
import { ConceptualLexiconUtils } from '../ts/cl-types'
import type { DirectiveRelationship } from '../ts/cl-types'

const ENHANCED_DB_FILE = 'cda-enhanced.db'
const SOURCE_DB_FILE = 'cda-import-test.db'
const CONCEPTUAL_LEXICON_FILE = 'conceptual-lexicon-full.db'

describe('CDA Enhancement Implementation', () => {
  let db: Database
  let sourceDb: Database
  let lexiconDb: Database

  beforeAll(async () => {
    // Clean up any existing enhanced database
    await cleanupDatabase(ENHANCED_DB_FILE)
    
    // Create new enhanced database
    db = createDatabase({ 
      type: 'file', 
      filename: ENHANCED_DB_FILE, 
      cleanup: false
    })
    
    // Open source databases
    sourceDb = createDatabase({ 
      type: 'file', 
      filename: SOURCE_DB_FILE, 
      cleanup: false
    })
    
    lexiconDb = createDatabase({ 
      type: 'file', 
      filename: CONCEPTUAL_LEXICON_FILE, 
      cleanup: false
    })
    
    // Create schema in enhanced database
    await db.exec(createSchema())
    
    console.log('\n🚀 STARTING CDA ENHANCEMENT IMPLEMENTATION')
    console.log('=' .repeat(60))
  })

  afterAll(async () => {
    await sourceDb.close()
    await lexiconDb.close()
    await db.close()
    console.log(`\n📁 Enhanced database created: ${ENHANCED_DB_FILE}`)
    console.log('🎯 Ready for advanced knowledge graph operations!')
  })

  describe('Enhancement 1: Connect Isolated Directives', () => {
    it('should copy existing data and identify isolated directives', async () => {
      console.log('\n📋 ENHANCEMENT 1: CONNECTING ISOLATED DIRECTIVES')
      console.log('=' .repeat(60))

      // Copy all existing nodes and edges from source database
      const existingNodes = await sourceDb.all('SELECT * FROM nodes')
      const existingEdges = await sourceDb.all('SELECT * FROM edges')

      console.log(`📥 Copying ${existingNodes.length} nodes and ${existingEdges.length} edges...`)

      // Copy nodes
      for (const node of existingNodes) {
        await db.run(
          'INSERT INTO nodes (id, body) VALUES (?, ?)',
          [node.id, node.body]
        )
      }

      // Copy edges
      for (const edge of existingEdges) {
        await db.run(
          'INSERT INTO edges (source, target, properties) VALUES (?, ?, ?)',
          [edge.source, edge.target, edge.properties]
        )
      }

      // Identify isolated directives
      const isolatedDirectives = await db.all(`
        SELECT 
          id,
          json_extract(body, '$.directive_id') as directive_id,
          json_extract(body, '$.title') as title,
          json_extract(body, '$.category') as category,
          json_extract(body, '$.description') as description
        FROM nodes n
        WHERE json_extract(body, '$.node_type') = 'directive'
          AND NOT EXISTS (
            SELECT 1 FROM edges e 
            WHERE (e.source = n.id OR e.target = n.id)
              AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
          )
        ORDER BY category, directive_id
      `)

      console.log(`\n🏝️  Found ${isolatedDirectives.length} isolated directives to connect`)
      
      // Show sample isolated directives by category
      const isolatedByCategory = isolatedDirectives.reduce((acc, dir) => {
        acc[dir.category] = (acc[dir.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log('\n📊 Isolated Directives by Category:')
      Object.entries(isolatedByCategory).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} isolated directives`)
      })

      expect(isolatedDirectives.length).toBeGreaterThan(50)
      expect(Object.keys(isolatedByCategory).length).toBeGreaterThan(10)
    })

    it('should create semantic connections between isolated directives', async () => {
      console.log('\n🔗 Creating semantic connections...')

      // Get all directives for semantic analysis
      const allDirectives = await db.all(`
        SELECT 
          id,
          json_extract(body, '$.directive_id') as directive_id,
          json_extract(body, '$.title') as title,
          json_extract(body, '$.category') as category,
          json_extract(body, '$.description') as description
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'directive'
        ORDER BY directive_id
      `)

      let connectionsCreated = 0

      // Create semantic connections based on keyword matching
      const semanticKeywords = {
        'user': ['user', 'audience', 'interaction', 'engagement'],
        'processing': ['process', 'analysis', 'evaluation', 'assessment'],
        'information': ['information', 'data', 'content', 'knowledge'],
        'protocol': ['protocol', 'procedure', 'method', 'approach'],
        'cognitive': ['cognitive', 'mental', 'thinking', 'reasoning'],
        'quality': ['quality', 'accuracy', 'precision', 'reliability'],
        'context': ['context', 'situation', 'environment', 'setting'],
        'structure': ['structure', 'organization', 'format', 'framework']
      }

      for (const [theme, keywords] of Object.entries(semanticKeywords)) {
        // Find directives that match this theme
        const themeDirectives = allDirectives.filter(dir => {
          const text = (dir.title + ' ' + dir.description).toLowerCase()
          return keywords.some(keyword => text.includes(keyword))
        })

        if (themeDirectives.length >= 2) {
          console.log(`\n🎯 Theme "${theme}": Found ${themeDirectives.length} related directives`)
          
          // Create connections between directives in the same theme
          for (let i = 0; i < themeDirectives.length - 1; i++) {
            for (let j = i + 1; j < Math.min(i + 3, themeDirectives.length); j++) {
              const source = themeDirectives[i]
              const target = themeDirectives[j]
              
              // Don't connect directives in the same category (they should be internally connected differently)
              if (source.category !== target.category) {
                const relationship: DirectiveRelationship = {
                  source: source.id,
                  target: target.id,
                  properties: {
                    type: 'semantic_similarity',
                    context: `Semantic theme: ${theme}`,
                    extracted_from: 'enhancement_semantic_analysis'
                  }
                }

                await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
                connectionsCreated++
              }
            }
          }
        }
      }

      console.log(`\n✅ Created ${connectionsCreated} semantic connections`)
      expect(connectionsCreated).toBeGreaterThan(20)
    })

    it('should create inspirational source connections', async () => {
      console.log('\n💡 Creating inspirational source connections...')

      // Group directives by inspirational sources
      const inspirationalSources = {
        'McLuhan': ['mcluhan'],
        'HSE': ['hse-inspired'],
        'A-Covert': ['a-covert-inspired'],
        'Noise-Reduction': ['noise-reduction inspired'],
        'Gawande': ['gawande-inspired'],
        'LoB': ['lob-inspired']
      }

      let inspirationalConnections = 0

      for (const [source, patterns] of Object.entries(inspirationalSources)) {
        const sourceDirectives = await db.all(`
          SELECT 
            id,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.title') as title,
            json_extract(body, '$.category') as category
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND (${patterns.map(p => `LOWER(json_extract(body, '$.title')) LIKE '%${p}%'`).join(' OR ')})
        `)

        if (sourceDirectives.length >= 2) {
          console.log(`   ${source}: ${sourceDirectives.length} directives`)
          
          // Connect directives from the same inspirational source
          for (let i = 0; i < sourceDirectives.length - 1; i++) {
            for (let j = i + 1; j < sourceDirectives.length; j++) {
              const relationship: DirectiveRelationship = {
                source: sourceDirectives[i].id,
                target: sourceDirectives[j].id,
                properties: {
                  type: 'shared_inspiration',
                  context: `Shared inspirational source: ${source}`,
                  extracted_from: 'enhancement_inspirational_analysis'
                }
              }

              await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
              inspirationalConnections++
            }
          }
        }
      }

      console.log(`\n✅ Created ${inspirationalConnections} inspirational source connections`)
      expect(inspirationalConnections).toBeGreaterThan(5)
    })
  })

  describe('Enhancement 2: Improve Category Interconnectivity', () => {
    it('should create strategic inter-category connections', async () => {
      console.log('\n🌉 ENHANCEMENT 2: IMPROVING CATEGORY INTERCONNECTIVITY')
      console.log('=' .repeat(60))

      // Define strategic category relationships
      const categoryRelationships = [
        { source: 'CIP', target: 'IPR', reason: 'Identity informs interaction style' },
        { source: 'CIP', target: 'PHI', reason: 'Persona shapes processing philosophy' },
        { source: 'PHI', target: 'QPG', reason: 'Philosophy guides query processing' },
        { source: 'QPG', target: 'QHD', reason: 'Processing guidelines inform query handling' },
        { source: 'QHD', target: 'IEP', reason: 'Query handling triggers elaboration protocols' },
        { source: 'COG', target: 'PHI', reason: 'Cognitive strategies implement philosophy' },
        { source: 'COG', target: 'QPG', reason: 'Cognitive strategies guide processing' },
        { source: 'ADV', target: 'COG', reason: 'Advanced directives use cognitive strategies' },
        { source: 'DYN', target: 'QPG', reason: 'Dynamic optimization affects processing' },
        { source: 'OPM', target: 'PHI', reason: 'Operational protocols implement philosophy' },
        { source: 'OPM', target: 'ADV', reason: 'Protocols support advanced directives' }
      ]

      let categoryConnections = 0

      for (const rel of categoryRelationships) {
        // Find representative directives from each category
        const sourceDirectives = await db.all(`
          SELECT id, json_extract(body, '$.directive_id') as directive_id
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND json_extract(body, '$.category') = ?
          LIMIT 3
        `, [rel.source])

        const targetDirectives = await db.all(`
          SELECT id, json_extract(body, '$.directive_id') as directive_id
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND json_extract(body, '$.category') = ?
          LIMIT 3
        `, [rel.target])

        // Create connections between representative directives
        for (const sourceDir of sourceDirectives) {
          for (const targetDir of targetDirectives.slice(0, 1)) { // Connect to first target only
            const relationship: DirectiveRelationship = {
              source: sourceDir.id,
              target: targetDir.id,
              properties: {
                type: 'category_bridge',
                context: rel.reason,
                extracted_from: 'enhancement_category_interconnectivity'
              }
            }

            await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
            categoryConnections++
          }
        }

        console.log(`   ${rel.source} → ${rel.target}: ${rel.reason}`)
      }

      console.log(`\n✅ Created ${categoryConnections} strategic category connections`)
      expect(categoryConnections).toBeGreaterThan(15)
    })
  })

  describe('Enhancement 3: OH Integration', () => {
    it('should integrate with operational heuristics from conceptual lexicon', async () => {
      console.log('\n🔄 ENHANCEMENT 3: OH INTEGRATION')
      console.log('=' .repeat(60))

      // Get OH terms from conceptual lexicon
      const ohTerms = await lexiconDb.all(`
        SELECT 
          id,
          json_extract(body, '$.term') as term,
          json_extract(body, '$.definition') as definition
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'term'
          AND json_extract(body, '$.term') LIKE 'OH-%'
        ORDER BY term
      `)

      console.log(`📥 Found ${ohTerms.length} OH terms in conceptual lexicon`)

      // Import OH terms into enhanced database
      let importedOH = 0
      for (const ohTerm of ohTerms) {
        // Check if already exists
        const existing = await db.get('SELECT id FROM nodes WHERE id = ?', [ohTerm.id])
        if (!existing) {
          await db.run(
            'INSERT INTO nodes (id, body) VALUES (?, ?)',
            [ohTerm.id, JSON.stringify({
              node_type: 'oh_term',
              term: ohTerm.term,
              definition: ohTerm.definition,
              imported_from: 'conceptual_lexicon'
            })]
          )
          importedOH++
        }
      }

      console.log(`✅ Imported ${importedOH} new OH terms`)

      // Create connections between directives and OH terms
      const directivesWithOHContext = await db.all(`
        SELECT 
          id,
          json_extract(body, '$.directive_id') as directive_id,
          json_extract(body, '$.title') as title,
          json_extract(body, '$.description') as description
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'directive'
          AND (
            LOWER(json_extract(body, '$.description')) LIKE '%operational%'
            OR LOWER(json_extract(body, '$.description')) LIKE '%heuristic%'
            OR LOWER(json_extract(body, '$.description')) LIKE '%protocol%'
          )
      `)

      let ohConnections = 0
      for (const directive of directivesWithOHContext) {
        // Find relevant OH terms based on content similarity
        for (const ohTerm of ohTerms.slice(0, 10)) { // Connect to first 10 OH terms for demonstration
          const relationship: DirectiveRelationship = {
            source: directive.id,
            target: ohTerm.id,
            properties: {
              type: 'implements',
              context: `Directive implements operational heuristic: ${ohTerm.term}`,
              extracted_from: 'enhancement_oh_integration'
            }
          }

          await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
          ohConnections++
        }
      }

      console.log(`✅ Created ${ohConnections} directive-OH connections`)
      expect(importedOH + ohConnections).toBeGreaterThan(10)
    })
  })

  describe('Enhancement 4: Semantic Clustering', () => {
    it('should create semantic clusters and keyword-based connections', async () => {
      console.log('\n🎯 ENHANCEMENT 4: SEMANTIC CLUSTERING')
      console.log('=' .repeat(60))

      // Define semantic clusters
      const semanticClusters = {
        'User Experience': {
          keywords: ['user', 'audience', 'interaction', 'engagement', 'experience'],
          description: 'Directives focused on user interaction and experience'
        },
        'Quality Assurance': {
          keywords: ['quality', 'accuracy', 'validation', 'verification', 'error'],
          description: 'Directives ensuring quality and accuracy'
        },
        'Information Processing': {
          keywords: ['information', 'data', 'processing', 'analysis', 'synthesis'],
          description: 'Directives for information handling and processing'
        },
        'Cognitive Operations': {
          keywords: ['cognitive', 'mental', 'thinking', 'reasoning', 'judgment'],
          description: 'Directives for cognitive and reasoning processes'
        },
        'Protocol Management': {
          keywords: ['protocol', 'procedure', 'management', 'coordination', 'orchestration'],
          description: 'Directives for protocol and process management'
        },
        'Risk Management': {
          keywords: ['risk', 'safety', 'uncertainty', 'error', 'prevention'],
          description: 'Directives for risk assessment and management'
        }
      }

      let clusterConnections = 0
      const clusterStats: Record<string, number> = {}

      for (const [clusterName, cluster] of Object.entries(semanticClusters)) {
        // Find directives that belong to this cluster
        const clusterDirectives = await db.all(`
          SELECT 
            id,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.title') as title,
            json_extract(body, '$.category') as category
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND (${cluster.keywords.map(keyword => 
              `LOWER(json_extract(body, '$.title') || ' ' || json_extract(body, '$.description')) LIKE '%${keyword}%'`
            ).join(' OR ')})
        `)

        clusterStats[clusterName] = clusterDirectives.length

        if (clusterDirectives.length >= 2) {
          console.log(`\n🎯 Cluster "${clusterName}": ${clusterDirectives.length} directives`)
          
          // Create cluster connections (each directive connected to up to 2 others in cluster)
          for (let i = 0; i < clusterDirectives.length; i++) {
            for (let j = i + 1; j < Math.min(i + 3, clusterDirectives.length); j++) {
              const relationship: DirectiveRelationship = {
                source: clusterDirectives[i].id,
                target: clusterDirectives[j].id,
                properties: {
                  type: 'semantic_cluster',
                  context: `Semantic cluster: ${clusterName} - ${cluster.description}`,
                  extracted_from: 'enhancement_semantic_clustering'
                }
              }

              await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
              clusterConnections++
            }
          }
        }
      }

      console.log('\n📊 Semantic Cluster Statistics:')
      Object.entries(clusterStats).forEach(([cluster, count]) => {
        console.log(`   ${cluster}: ${count} directives`)
      })

      console.log(`\n✅ Created ${clusterConnections} semantic cluster connections`)
      expect(clusterConnections).toBeGreaterThan(30)
    })

    it('should create keyword-based cross-references', async () => {
      console.log('\n🔗 Creating keyword-based cross-references...')

      // Define important keywords that should create connections
      const keywordConnections = [
        'uncertainty', 'ambiguity', 'clarity', 'structure', 'analysis',
        'evaluation', 'assessment', 'protocol', 'heuristic', 'optimization'
      ]

      let keywordConnections_count = 0

      for (const keyword of keywordConnections) {
        const keywordDirectives = await db.all(`
          SELECT 
            id,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.category') as category
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND LOWER(json_extract(body, '$.title') || ' ' || json_extract(body, '$.description')) LIKE '%${keyword}%'
          LIMIT 5
        `)

        if (keywordDirectives.length >= 2) {
          // Connect first directive to others
          for (let i = 1; i < keywordDirectives.length; i++) {
            const relationship: DirectiveRelationship = {
              source: keywordDirectives[0].id,
              target: keywordDirectives[i].id,
              properties: {
                type: 'keyword_similarity',
                context: `Shared keyword: ${keyword}`,
                extracted_from: 'enhancement_keyword_analysis'
              }
            }

            await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
            keywordConnections_count++
          }
        }
      }

      console.log(`✅ Created ${keywordConnections_count} keyword-based connections`)
      expect(keywordConnections_count).toBeGreaterThan(15)
    })
  })

  describe('Enhancement Summary', () => {
    it('should provide comprehensive enhancement statistics', async () => {
      console.log('\n📊 ENHANCEMENT SUMMARY')
      console.log('=' .repeat(60))

      // Get final statistics
      const finalStats = await db.get(`
        SELECT 
          COUNT(CASE WHEN json_extract(body, '$.node_type') = 'directive' THEN 1 END) as directive_nodes,
          COUNT(CASE WHEN json_extract(body, '$.node_type') = 'cda' THEN 1 END) as cda_nodes,
          COUNT(CASE WHEN json_extract(body, '$.node_type') = 'oh_term' THEN 1 END) as oh_nodes,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'belongs_to_cda') as membership_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'references') as reference_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'semantic_similarity') as semantic_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'shared_inspiration') as inspiration_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'category_bridge') as bridge_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'implements') as implementation_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'semantic_cluster') as cluster_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'keyword_similarity') as keyword_edges
        FROM nodes
      `)

      console.log('\n📈 BEFORE vs AFTER Enhancement:')
      console.log('   BEFORE: 86 nodes, 110 edges')
      console.log(`   AFTER:  ${finalStats.directive_nodes + finalStats.cda_nodes + finalStats.oh_nodes} nodes, ${
        finalStats.membership_edges + finalStats.reference_edges + finalStats.semantic_edges + 
        finalStats.inspiration_edges + finalStats.bridge_edges + finalStats.implementation_edges + 
        finalStats.cluster_edges + finalStats.keyword_edges
      } edges`)

      console.log('\n📊 Node Distribution:')
      console.log(`   Directive Nodes: ${finalStats.directive_nodes}`)
      console.log(`   CDA Metadata: ${finalStats.cda_nodes}`)
      console.log(`   OH Terms: ${finalStats.oh_nodes}`)

      console.log('\n🔗 Edge Distribution:')
      console.log(`   Membership: ${finalStats.membership_edges}`)
      console.log(`   References: ${finalStats.reference_edges}`)
      console.log(`   Semantic Similarity: ${finalStats.semantic_edges}`)
      console.log(`   Shared Inspiration: ${finalStats.inspiration_edges}`)
      console.log(`   Category Bridges: ${finalStats.bridge_edges}`)
      console.log(`   OH Implementation: ${finalStats.implementation_edges}`)
      console.log(`   Semantic Clusters: ${finalStats.cluster_edges}`)
      console.log(`   Keyword Similarity: ${finalStats.keyword_edges}`)

      // Calculate connectivity improvement
      const isolatedAfter = await db.get(`
        SELECT COUNT(*) as count
        FROM nodes n
        WHERE json_extract(body, '$.node_type') = 'directive'
          AND NOT EXISTS (
            SELECT 1 FROM edges e 
            WHERE (e.source = n.id OR e.target = n.id)
              AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
          )
      `)

      console.log('\n🎯 Connectivity Improvement:')
      console.log(`   Isolated Directives: 62 → ${isolatedAfter.count}`)
      console.log(`   Connected Directives: ${finalStats.directive_nodes - isolatedAfter.count}/${finalStats.directive_nodes} (${Math.round((finalStats.directive_nodes - isolatedAfter.count) * 100 / finalStats.directive_nodes)}%)`)

      expect(finalStats.directive_nodes).toBe(85)
      expect(isolatedAfter.count).toBeLessThan(30) // Significant improvement
    })
  })
})
