import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createDatabase, type Database } from './helpers/database'
import { DotGraphGenerator, type DotGraphConfig } from '../ts/dot-graph-generator'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DB_FILE = 'cda-import-test.db'
const OUTPUT_DIR = 'graph-visualizations'

describe('DOT Graph Visualization Tests', () => {
  let db: Database
  let generator: DotGraphGenerator

  beforeAll(async () => {
    // Open the enhanced CDA database
    db = createDatabase({ 
      type: 'file', 
      filename: DB_FILE, 
      cleanup: false
    })
    
    generator = new DotGraphGenerator(db)
    
    // Create output directory
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true })
    }
    
    console.log('\n🎨 STARTING DOT GRAPH VISUALIZATION TESTS')
    console.log('=' .repeat(60))
  })

  afterAll(async () => {
    await db.close()
    console.log(`\n📁 DOT files generated in: ${OUTPUT_DIR}/`)
    console.log('🎯 Use Graphviz to render: dot -Tsvg input.dot -o output.svg')
  })

  describe('Basic Graph Generation', () => {
    it('should generate a complete knowledge graph', async () => {
      console.log('\n📊 GENERATING COMPLETE KNOWLEDGE GRAPH')
      console.log('=' .repeat(50))

      const config: Partial<DotGraphConfig> = {
        title: 'Complete CDA Knowledge Graph',
        layout: 'dot',
        clusterByCategory: true,
        maxEdges: 100,
        showNodeLabels: true,
        showEdgeLabels: false
      }

      const dotContent = await generator.generateDot(config)
      
      // Save to file
      const filename = join(OUTPUT_DIR, 'complete-knowledge-graph.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated complete graph: ${filename}`)
      console.log(`📊 Graph size: ${dotContent.length} characters`)
      
      // Verify DOT structure
      expect(dotContent).toContain('digraph KnowledgeGraph')
      expect(dotContent).toContain('subgraph cluster_')
      expect(dotContent).toContain('->')
      expect(dotContent.length).toBeGreaterThan(1000)
    })

    it('should generate a directive-only graph', async () => {
      console.log('\n📋 GENERATING DIRECTIVE-ONLY GRAPH')
      console.log('=' .repeat(50))

      const config: Partial<DotGraphConfig> = {
        title: 'Core Directives Network',
        includeNodeTypes: ['directive'],
        includeEdgeTypes: ['references', 'semantic_similarity', 'category_bridge'],
        layout: 'neato',
        clusterByCategory: true,
        showNodeLabels: true,
        maxLabelLength: 20
      }

      const dotContent = await generator.generateDot(config)
      
      const filename = join(OUTPUT_DIR, 'directives-only.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated directive graph: ${filename}`)
      
      expect(dotContent).toContain('layout="neato"')
      expect(dotContent).toContain('Core Directives Network')
    })

    it('should generate a relationship-focused graph', async () => {
      console.log('\n🔗 GENERATING RELATIONSHIP-FOCUSED GRAPH')
      console.log('=' .repeat(50))

      const config: Partial<DotGraphConfig> = {
        title: 'Directive Relationships Network',
        includeNodeTypes: ['directive'],
        includeEdgeTypes: ['semantic_similarity', 'shared_inspiration', 'keyword_similarity'],
        layout: 'fdp',
        clusterByNodeType: false,
        showNodeLabels: true,
        showEdgeLabels: true,
        maxLabelLength: 15,
        edgeColors: {
          'semantic_similarity': '#4CAF50',
          'shared_inspiration': '#9C27B0',
          'keyword_similarity': '#FF9800'
        }
      }

      const dotContent = await generator.generateDot(config)
      
      const filename = join(OUTPUT_DIR, 'relationships-network.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated relationship graph: ${filename}`)
      
      expect(dotContent).toContain('layout="fdp"')
      expect(dotContent).toContain('semantic_similarity')
    })
  })

  describe('Category-Specific Visualizations', () => {
    it('should generate category-specific graphs', async () => {
      console.log('\n📂 GENERATING CATEGORY-SPECIFIC GRAPHS')
      console.log('=' .repeat(50))

      const categories = ['ADV', 'COG', 'PHI', 'QPG', 'OPM']
      
      for (const category of categories) {
        const config: Partial<DotGraphConfig> = {
          title: `${category} Category Network`,
          includeCategories: [category],
          includeNodeTypes: ['directive'],
          layout: 'circo',
          clusterByCategory: false,
          showNodeLabels: true,
          showEdgeLabels: true,
          maxLabelLength: 25,
          nodeColors: {
            'directive': category === 'ADV' ? '#FFCDD2' : 
                       category === 'COG' ? '#C8E6C9' :
                       category === 'PHI' ? '#DCEDC8' :
                       category === 'QPG' ? '#FFE0B2' : '#E1BEE7'
          }
        }

        const dotContent = await generator.generateDot(config)
        
        const filename = join(OUTPUT_DIR, `category-${category.toLowerCase()}.dot`)
        writeFileSync(filename, dotContent)
        
        console.log(`   ✅ Generated ${category} category graph: ${filename}`)
      }

      expect(categories.length).toBe(5)
    })

    it('should generate cross-category bridge visualization', async () => {
      console.log('\n🌉 GENERATING CROSS-CATEGORY BRIDGE GRAPH')
      console.log('=' .repeat(50))

      const config: Partial<DotGraphConfig> = {
        title: 'Cross-Category Bridges',
        includeNodeTypes: ['directive'],
        includeEdgeTypes: ['category_bridge'],
        layout: 'dot',
        rankdir: 'LR',
        clusterByCategory: true,
        showNodeLabels: true,
        showEdgeLabels: true,
        edgeColors: {
          'category_bridge': '#FF5722'
        },
        edgeStyles: {
          'category_bridge': 'bold'
        }
      }

      const dotContent = await generator.generateDot(config)
      
      const filename = join(OUTPUT_DIR, 'cross-category-bridges.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated bridge graph: ${filename}`)
      
      expect(dotContent).toContain('category_bridge')
      expect(dotContent).toContain('rankdir="LR"')
    })
  })

  describe('Specialized Visualizations', () => {
    it('should generate inspirational source clusters', async () => {
      console.log('\n💡 GENERATING INSPIRATIONAL SOURCE CLUSTERS')
      console.log('=' .repeat(50))

      const config: Partial<DotGraphConfig> = {
        title: 'Inspirational Source Networks',
        includeNodeTypes: ['directive'],
        includeEdgeTypes: ['shared_inspiration'],
        layout: 'neato',
        clusterByCategory: false,
        showNodeLabels: true,
        showEdgeLabels: false,
        nodeColors: {
          'directive': '#F3E5F5'
        },
        edgeColors: {
          'shared_inspiration': '#9C27B0'
        },
        edgeStyles: {
          'shared_inspiration': 'dotted'
        }
      }

      const dotContent = await generator.generateDot(config)
      
      const filename = join(OUTPUT_DIR, 'inspirational-clusters.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated inspirational clusters: ${filename}`)
      
      expect(dotContent).toContain('shared_inspiration')
    })

    it('should generate semantic similarity network', async () => {
      console.log('\n🎯 GENERATING SEMANTIC SIMILARITY NETWORK')
      console.log('=' .repeat(50))

      const config: Partial<DotGraphConfig> = {
        title: 'Semantic Similarity Network',
        includeNodeTypes: ['directive'],
        includeEdgeTypes: ['semantic_similarity', 'keyword_similarity'],
        layout: 'sfdp',
        clusterByCategory: false,
        showNodeLabels: true,
        showEdgeLabels: false,
        nodeColors: {
          'directive': '#E8F5E8'
        },
        edgeColors: {
          'semantic_similarity': '#4CAF50',
          'keyword_similarity': '#8BC34A'
        },
        edgeStyles: {
          'semantic_similarity': 'dashed',
          'keyword_similarity': 'solid'
        }
      }

      const dotContent = await generator.generateDot(config)
      
      const filename = join(OUTPUT_DIR, 'semantic-similarity.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated semantic network: ${filename}`)
      
      expect(dotContent).toContain('semantic_similarity')
      expect(dotContent).toContain('keyword_similarity')
    })

    it('should generate hub and authority visualization', async () => {
      console.log('\n⭐ GENERATING HUB AND AUTHORITY VISUALIZATION')
      console.log('=' .repeat(50))

      // First, identify hub nodes (most incoming connections)
      const hubNodes = await db.all(`
        SELECT 
          target as node_id,
          json_extract(n.body, '$.directive_id') as directive_id,
          COUNT(*) as incoming_count
        FROM edges e
        JOIN nodes n ON e.target = n.id
        WHERE json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
          AND json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY target
        HAVING incoming_count >= 2
        ORDER BY incoming_count DESC
        LIMIT 10
      `)

      console.log(`   Found ${hubNodes.length} hub nodes`)
      hubNodes.forEach(hub => {
        console.log(`     ${hub.directive_id}: ${hub.incoming_count} incoming connections`)
      })

      const config: Partial<DotGraphConfig> = {
        title: 'Hub and Authority Nodes',
        includeNodeTypes: ['directive'],
        layout: 'dot',
        clusterByCategory: false,
        showNodeLabels: true,
        showEdgeLabels: false,
        maxEdges: 50
      }

      const dotContent = await generator.generateDot(config)
      
      const filename = join(OUTPUT_DIR, 'hub-authority.dot')
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated hub/authority graph: ${filename}`)
      
      expect(hubNodes.length).toBeGreaterThan(0)
    })
  })

  describe('Layout Comparison', () => {
    it('should generate graphs with different layouts', async () => {
      console.log('\n🎨 GENERATING LAYOUT COMPARISON GRAPHS')
      console.log('=' .repeat(50))

      const layouts: Array<{ name: string, layout: any, description: string }> = [
        { name: 'hierarchical', layout: 'dot', description: 'Hierarchical top-down' },
        { name: 'force-directed', layout: 'neato', description: 'Force-directed spring model' },
        { name: 'spring-model', layout: 'fdp', description: 'Spring model for large graphs' },
        { name: 'circular', layout: 'circo', description: 'Circular layout' },
        { name: 'radial', layout: 'twopi', description: 'Radial layout' }
      ]

      for (const layoutInfo of layouts) {
        const config: Partial<DotGraphConfig> = {
          title: `Layout: ${layoutInfo.description}`,
          layout: layoutInfo.layout,
          includeNodeTypes: ['directive'],
          includeCategories: ['ADV', 'COG', 'PHI'], // Subset for clarity
          maxEdges: 30,
          showNodeLabels: true,
          showEdgeLabels: false
        }

        const dotContent = await generator.generateDot(config)
        
        const filename = join(OUTPUT_DIR, `layout-${layoutInfo.name}.dot`)
        writeFileSync(filename, dotContent)
        
        console.log(`   ✅ Generated ${layoutInfo.name} layout: ${filename}`)
      }

      expect(layouts.length).toBe(5)
    })
  })

  describe('Statistics and Summary', () => {
    it('should provide visualization statistics', async () => {
      console.log('\n📊 VISUALIZATION STATISTICS')
      console.log('=' .repeat(50))

      // Count nodes by type
      const nodeStats = await db.all(`
        SELECT 
          json_extract(body, '$.node_type') as node_type,
          COUNT(*) as count
        FROM nodes 
        GROUP BY json_extract(body, '$.node_type')
        ORDER BY count DESC
      `)

      console.log('\n📋 Node Distribution:')
      nodeStats.forEach(stat => {
        console.log(`   ${stat.node_type}: ${stat.count} nodes`)
      })

      // Count edges by type
      const edgeStats = await db.all(`
        SELECT 
          json_extract(properties, '$.type') as edge_type,
          COUNT(*) as count
        FROM edges 
        GROUP BY json_extract(properties, '$.type')
        ORDER BY count DESC
      `)

      console.log('\n🔗 Edge Distribution:')
      edgeStats.forEach(stat => {
        console.log(`   ${stat.edge_type}: ${stat.count} edges`)
      })

      // Category distribution
      const categoryStats = await db.all(`
        SELECT 
          json_extract(body, '$.category') as category,
          COUNT(*) as count
        FROM nodes 
        WHERE json_extract(body, '$.node_type') = 'directive'
          AND json_extract(body, '$.category') IS NOT NULL
        GROUP BY json_extract(body, '$.category')
        ORDER BY count DESC
      `)

      console.log('\n📂 Category Distribution:')
      categoryStats.forEach(stat => {
        console.log(`   ${stat.category}: ${stat.count} directives`)
      })

      console.log('\n🎨 Generated Visualizations:')
      console.log('   1. complete-knowledge-graph.dot - Full network overview')
      console.log('   2. directives-only.dot - Directive network only')
      console.log('   3. relationships-network.dot - Relationship-focused view')
      console.log('   4. category-*.dot - Individual category networks')
      console.log('   5. cross-category-bridges.dot - Inter-category connections')
      console.log('   6. inspirational-clusters.dot - Inspirational source groups')
      console.log('   7. semantic-similarity.dot - Semantic relationship network')
      console.log('   8. hub-authority.dot - Central nodes visualization')
      console.log('   9. layout-*.dot - Different layout comparisons')

      expect(nodeStats.length).toBeGreaterThan(0)
      expect(edgeStats.length).toBeGreaterThan(0)
    })
  })
})
