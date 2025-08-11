import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createDatabase, type Database } from '../helpers/database'
import { insertEdgeFromObject, getInsertEdgeParams } from '../../src/database/insert-edge'
import type { DirectiveRelationship } from '../../src/types/cl-types'

const SOURCE_DB_FILE = 'cda-import-test.db'

describe('CDA Enhancement Implementation (In-Place)', () => {
  let db: Database

  beforeAll(async () => {
    // Open the existing CDA database for enhancement
    db = createDatabase({ 
      type: 'file', 
      filename: SOURCE_DB_FILE, 
      cleanup: false
    })
    
    console.log('\n🚀 STARTING IN-PLACE CDA ENHANCEMENT')
    console.log('=' .repeat(60))
  })

  afterAll(async () => {
    await db.close()
    console.log('\n🎯 CDA Enhancement Complete!')
    console.log(`📁 Enhanced database: ${SOURCE_DB_FILE}`)
  })

  describe('Enhancement 1: Connect Isolated Directives', () => {
    it('should create semantic connections between isolated directives', async () => {
      console.log('\n📋 ENHANCEMENT 1: CONNECTING ISOLATED DIRECTIVES')
      console.log('=' .repeat(60))

      // Get isolated directives
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

      console.log(`🏝️  Found ${isolatedDirectives.length} isolated directives`)

      // Create semantic connections based on shared themes
      const themes = {
        'user_interaction': ['user', 'audience', 'interaction', 'engagement'],
        'quality_control': ['quality', 'accuracy', 'validation', 'verification'],
        'information_processing': ['information', 'data', 'processing', 'analysis'],
        'cognitive_operations': ['cognitive', 'mental', 'thinking', 'reasoning'],
        'protocol_management': ['protocol', 'procedure', 'management', 'coordination'],
        'uncertainty_handling': ['uncertainty', 'ambiguity', 'unclear', 'unknown']
      }

      let connectionsCreated = 0

      for (const [themeName, keywords] of Object.entries(themes)) {
        // Find directives matching this theme
        const themeDirectives = isolatedDirectives.filter(dir => {
          const text = (dir.title + ' ' + dir.description).toLowerCase()
          return keywords.some(keyword => text.includes(keyword))
        })

        if (themeDirectives.length >= 2) {
          console.log(`\n🎯 Theme "${themeName}": ${themeDirectives.length} directives`)
          
          // Connect first directive to others in the theme
          for (let i = 1; i < Math.min(themeDirectives.length, 4); i++) {
            const relationship: DirectiveRelationship = {
              source: themeDirectives[0].id,
              target: themeDirectives[i].id,
              properties: {
                type: 'semantic_similarity',
                context: `Semantic theme: ${themeName}`,
                extracted_from: 'enhancement_semantic_analysis'
              }
            }

            await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
            connectionsCreated++
            
            console.log(`   Connected: ${themeDirectives[0].directive_id} → ${themeDirectives[i].directive_id}`)
          }
        }
      }

      console.log(`\n✅ Created ${connectionsCreated} semantic connections`)
      expect(connectionsCreated).toBeGreaterThan(5)
    })

    it('should create inspirational source connections', async () => {
      console.log('\n💡 Creating inspirational source connections...')

      // Find directives with shared inspirational sources
      const inspirationalGroups = [
        { name: 'McLuhan-Inspired', pattern: 'mcluhan' },
        { name: 'HSE-Inspired', pattern: 'hse' },
        { name: 'A-Covert-Inspired', pattern: 'a-covert' },
        { name: 'Noise-Reduction', pattern: 'noise-reduction' }
      ]

      let inspirationalConnections = 0

      for (const group of inspirationalGroups) {
        const groupDirectives = await db.all(`
          SELECT 
            id,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.title') as title
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND LOWER(json_extract(body, '$.title')) LIKE '%${group.pattern}%'
        `)

        if (groupDirectives.length >= 2) {
          console.log(`   ${group.name}: ${groupDirectives.length} directives`)
          
          // Connect all directives in this inspirational group
          for (let i = 0; i < groupDirectives.length - 1; i++) {
            for (let j = i + 1; j < groupDirectives.length; j++) {
              const relationship: DirectiveRelationship = {
                source: groupDirectives[i].id,
                target: groupDirectives[j].id,
                properties: {
                  type: 'shared_inspiration',
                  context: `Shared inspirational source: ${group.name}`,
                  extracted_from: 'enhancement_inspirational_analysis'
                }
              }

              await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
              inspirationalConnections++
            }
          }
        }
      }

      console.log(`\n✅ Created ${inspirationalConnections} inspirational connections`)
      expect(inspirationalConnections).toBeGreaterThan(0)
    })
  })

  describe('Enhancement 2: Improve Category Interconnectivity', () => {
    it('should create strategic inter-category connections', async () => {
      console.log('\n🌉 ENHANCEMENT 2: IMPROVING CATEGORY INTERCONNECTIVITY')
      console.log('=' .repeat(60))

      // Define strategic category relationships
      const categoryPairs = [
        { source: 'CIP', target: 'IPR', reason: 'Identity informs interaction style' },
        { source: 'PHI', target: 'QPG', reason: 'Philosophy guides query processing' },
        { source: 'QPG', target: 'QHD', reason: 'Processing guidelines inform query handling' },
        { source: 'COG', target: 'PHI', reason: 'Cognitive strategies implement philosophy' },
        { source: 'ADV', target: 'COG', reason: 'Advanced directives use cognitive strategies' },
        { source: 'OPM', target: 'PHI', reason: 'Operational protocols implement philosophy' }
      ]

      let categoryConnections = 0

      for (const pair of categoryPairs) {
        // Get one representative directive from each category
        const sourceDirective = await db.get(`
          SELECT id, json_extract(body, '$.directive_id') as directive_id
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND json_extract(body, '$.category') = ?
          LIMIT 1
        `, [pair.source])

        const targetDirective = await db.get(`
          SELECT id, json_extract(body, '$.directive_id') as directive_id
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND json_extract(body, '$.category') = ?
          LIMIT 1
        `, [pair.target])

        if (sourceDirective && targetDirective) {
          const relationship: DirectiveRelationship = {
            source: sourceDirective.id,
            target: targetDirective.id,
            properties: {
              type: 'category_bridge',
              context: pair.reason,
              extracted_from: 'enhancement_category_interconnectivity'
            }
          }

          await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
          categoryConnections++
          
          console.log(`   ${pair.source} → ${pair.target}: ${sourceDirective.directive_id} → ${targetDirective.directive_id}`)
        }
      }

      console.log(`\n✅ Created ${categoryConnections} strategic category connections`)
      expect(categoryConnections).toBeGreaterThan(3)
    })
  })

  describe('Enhancement 3: Keyword-Based Connections', () => {
    it('should create keyword-based cross-references', async () => {
      console.log('\n🔗 ENHANCEMENT 3: KEYWORD-BASED CONNECTIONS')
      console.log('=' .repeat(60))

      // Important keywords that should create connections
      const importantKeywords = [
        'uncertainty', 'ambiguity', 'clarity', 'structure', 'analysis',
        'evaluation', 'assessment', 'protocol', 'heuristic', 'optimization'
      ]

      let keywordConnections = 0

      for (const keyword of importantKeywords) {
        const keywordDirectives = await db.all(`
          SELECT 
            id,
            json_extract(body, '$.directive_id') as directive_id,
            json_extract(body, '$.category') as category
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND (
              LOWER(json_extract(body, '$.title')) LIKE '%${keyword}%'
              OR LOWER(json_extract(body, '$.description')) LIKE '%${keyword}%'
            )
          LIMIT 4
        `)

        if (keywordDirectives.length >= 2) {
          console.log(`   Keyword "${keyword}": ${keywordDirectives.length} directives`)
          
          // Connect first directive to others with same keyword
          for (let i = 1; i < keywordDirectives.length; i++) {
            // Don't connect directives in the same category
            if (keywordDirectives[0].category !== keywordDirectives[i].category) {
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
              keywordConnections++
            }
          }
        }
      }

      console.log(`\n✅ Created ${keywordConnections} keyword-based connections`)
      expect(keywordConnections).toBeGreaterThan(5)
    })
  })

  describe('Enhancement 4: Functional Relationships', () => {
    it('should create functional dependency relationships', async () => {
      console.log('\n⚙️ ENHANCEMENT 4: FUNCTIONAL RELATIONSHIPS')
      console.log('=' .repeat(60))

      // Define functional relationships based on directive purposes
      const functionalPairs = [
        { sourcePattern: 'input', targetPattern: 'output', type: 'process_flow' },
        { sourcePattern: 'analysis', targetPattern: 'decision', type: 'analysis_to_decision' },
        { sourcePattern: 'assessment', targetPattern: 'action', type: 'assessment_to_action' },
        { sourcePattern: 'validation', targetPattern: 'approval', type: 'validation_flow' },
        { sourcePattern: 'error', targetPattern: 'correction', type: 'error_handling' }
      ]

      let functionalConnections = 0

      for (const pair of functionalPairs) {
        const sourceDirectives = await db.all(`
          SELECT id, json_extract(body, '$.directive_id') as directive_id
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND (
              LOWER(json_extract(body, '$.title')) LIKE '%${pair.sourcePattern}%'
              OR LOWER(json_extract(body, '$.description')) LIKE '%${pair.sourcePattern}%'
            )
          LIMIT 2
        `)

        const targetDirectives = await db.all(`
          SELECT id, json_extract(body, '$.directive_id') as directive_id
          FROM nodes 
          WHERE json_extract(body, '$.node_type') = 'directive'
            AND (
              LOWER(json_extract(body, '$.title')) LIKE '%${pair.targetPattern}%'
              OR LOWER(json_extract(body, '$.description')) LIKE '%${pair.targetPattern}%'
            )
          LIMIT 2
        `)

        if (sourceDirectives.length > 0 && targetDirectives.length > 0) {
          console.log(`   ${pair.sourcePattern} → ${pair.targetPattern}: ${sourceDirectives.length} → ${targetDirectives.length}`)
          
          // Connect source to target directives
          for (const source of sourceDirectives) {
            for (const target of targetDirectives.slice(0, 1)) { // Connect to first target only
              const relationship: DirectiveRelationship = {
                source: source.id,
                target: target.id,
                properties: {
                  type: pair.type,
                  context: `Functional relationship: ${pair.sourcePattern} → ${pair.targetPattern}`,
                  extracted_from: 'enhancement_functional_analysis'
                }
              }

              await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
              functionalConnections++
            }
          }
        }
      }

      console.log(`\n✅ Created ${functionalConnections} functional relationships`)
      expect(functionalConnections).toBeGreaterThan(0)
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
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'belongs_to_cda') as membership_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'references') as reference_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'semantic_similarity') as semantic_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'shared_inspiration') as inspiration_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'category_bridge') as bridge_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') = 'keyword_similarity') as keyword_edges,
          (SELECT COUNT(*) FROM edges WHERE json_extract(properties, '$.type') LIKE '%_flow' OR json_extract(properties, '$.type') LIKE '%_to_%' OR json_extract(properties, '$.type') LIKE '%_handling') as functional_edges
        FROM nodes
      `)

      const totalEdges = finalStats.membership_edges + finalStats.reference_edges + 
                        finalStats.semantic_edges + finalStats.inspiration_edges + 
                        finalStats.bridge_edges + finalStats.keyword_edges + finalStats.functional_edges

      console.log('\n📈 ENHANCEMENT RESULTS:')
      console.log(`   Total Nodes: ${finalStats.directive_nodes + finalStats.cda_nodes}`)
      console.log(`   Total Edges: ${totalEdges}`)

      console.log('\n🔗 Edge Distribution:')
      console.log(`   Original References: ${finalStats.reference_edges}`)
      console.log(`   Membership: ${finalStats.membership_edges}`)
      console.log(`   NEW Semantic Similarity: ${finalStats.semantic_edges}`)
      console.log(`   NEW Shared Inspiration: ${finalStats.inspiration_edges}`)
      console.log(`   NEW Category Bridges: ${finalStats.bridge_edges}`)
      console.log(`   NEW Keyword Similarity: ${finalStats.keyword_edges}`)
      console.log(`   NEW Functional Relationships: ${finalStats.functional_edges}`)

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

      const connectedDirectives = finalStats.directive_nodes - isolatedAfter.count
      const connectivityPercentage = Math.round(connectedDirectives * 100 / finalStats.directive_nodes)

      console.log('\n🎯 Connectivity Improvement:')
      console.log(`   Isolated Directives: 62 → ${isolatedAfter.count}`)
      console.log(`   Connected Directives: ${connectedDirectives}/${finalStats.directive_nodes} (${connectivityPercentage}%)`)
      console.log(`   Improvement: ${62 - isolatedAfter.count} directives connected`)

      expect(finalStats.directive_nodes).toBe(85)
      expect(isolatedAfter.count).toBeLessThan(50) // Significant improvement expected
      expect(totalEdges).toBeGreaterThan(120) // Should have more edges than original 110
    })
  })
})
