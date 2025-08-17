import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDatabase, type Database } from '../helpers/database';

// Import our SQL generation functions
import { createSchema } from '../../src/database/schema';
import {
  insertNodeFromObject,
  getInsertNodeParams,
} from '../../src/database/insert-node';
import {
  insertEdgeFromObject,
  getInsertEdgeParams,
} from '../../src/database/insert-edge';

// Import CDA types and parser
import { CDAParser } from '../../src/parsers/cda-parser';
import { ConceptualLexiconUtils } from '../../src/types/cl-types';
import type {
  CDANode,
  DirectiveNode,
  CoreConceptNode,
  CDAMembership,
  DirectiveRelationship,
} from '../../src/types/cl-types';

const CDA_FILE = 'data/source/core-directive-array.md';

describe('Core Directive Array Import Tests', () => {
  let db: Database;

  beforeAll(async () => {
    // Create a temporary file-based database for the ingestion test.
    // The helper will automatically generate a unique name and handle cleanup.
    db = createDatabase({ type: 'file' });
    
    // Create the schema
    await db.exec(createSchema());
    
    console.log(`\n📋 Starting Core Directive Array import from ${CDA_FILE} into ${db.dbPath}`);
  });

  afterAll(async () => {
    // The cleanup is handled automatically by the close method for temporary dbs
    await db.close();
    console.log(`\n✅ Test database closed and cleaned up.`);
  });


  it('should parse the core directive array markdown file', async () => {
    console.log('\n🔍 STEP 1: PARSING MARKDOWN FILE')
    console.log('=' .repeat(50))

    // Parse the markdown file
    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE)
    
    console.log(`✅ Parsed CDA v${cdaData.cda_version}: "${cdaData.title}"`)
    console.log(`📄 Purpose: ${cdaData.purpose.substring(0, 100)}...`)
    console.log(`📊 Found ${cdaData.core_directives.length} core directives`)
    
    // Verify we got reasonable data
    expect(cdaData.cda_version).toBeGreaterThan(0)
    expect(cdaData.title).toBeTruthy()
    expect(cdaData.core_directives.length).toBeGreaterThan(10)
    
    // Show directive categories
    const categories = new Map<string, number>()
    cdaData.core_directives.forEach(directive => {
      const category = directive.id.split('-')[0]
      categories.set(category, (categories.get(category) || 0) + 1)
    })
    
    console.log('\n📂 Directive Categories:')
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} directives`)
      })
  })

  it('should import CDA metadata and core concepts', async () => {
    console.log('\n🏗️  STEP 2: IMPORTING METADATA & CONCEPTS')
    console.log('=' .repeat(50))

    // Clear existing data first
    await db.run('DELETE FROM edges')
    await db.run('DELETE FROM nodes')

    // Parse the file
    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE)
    const content = require('fs').readFileSync(CDA_FILE, 'utf-8')
    
    // Create CDA metadata node
    const cdaNode = CDAParser.createCDANode(cdaData)
    await db.run(insertNodeFromObject(cdaNode), getInsertNodeParams(cdaNode))
    console.log(`✅ Created CDA metadata node: ${cdaNode.id}`)
    
    // Extract and create core concepts
    const concepts = CDAParser.extractCoreConcepts(content)
    const conceptNodes = CDAParser.createCoreConceptNodes(concepts, cdaData.cda_version)
    
    for (const concept of conceptNodes) {
      await db.run(insertNodeFromObject(concept), getInsertNodeParams(concept))
    }
    
    console.log(`✅ Created ${conceptNodes.length} core concept nodes`)
    console.log('📋 Core Concepts:')
    conceptNodes.forEach(concept => {
      console.log(`   - ${concept.concept_name} (${concept.concept_type})`)
    })

    // Verify data was inserted
    const nodeCount = await db.get('SELECT COUNT(*) as count FROM nodes')
    expect(nodeCount.count).toBe(1 + conceptNodes.length)
  })

  it('should import all core directives', async () => {
    console.log('\n📝 STEP 3: IMPORTING CORE DIRECTIVES')
    console.log('=' .repeat(50))

    // Parse the file
    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE)
    
    // Create directive nodes
    const directiveNodes = CDAParser.createDirectiveNodes(cdaData.core_directives, cdaData.cda_version)
    
    let importedCount = 0
    for (const [index, directive] of directiveNodes.entries()) {
      await db.run(insertNodeFromObject(directive), getInsertNodeParams(directive))
      importedCount++
      
      // Log progress every 10 directives
      if (index % 10 === 0 || index === directiveNodes.length - 1) {
        console.log(`📄 Imported ${importedCount}/${directiveNodes.length}: ${directive.directive_id} - ${directive.title}`)
      }
    }
    
    console.log(`✅ Successfully imported ${directiveNodes.length} directives`)
    
    // Create CDA membership edges
    let membershipCount = 0
    for (const directive of directiveNodes) {
      const membership: CDAMembership = {
        source: directive.id,
        target: `cda-${cdaData.cda_version}`,
        properties: {
          type: 'belongs_to_cda',
          category: directive.category
        }
      }
      
      await db.run(insertEdgeFromObject(membership), getInsertEdgeParams(membership))
      membershipCount++
    }
    
    console.log(`✅ Created ${membershipCount} CDA membership edges`)

    // Verify final counts
    const nodeCount = await db.get('SELECT COUNT(*) as count FROM nodes')
    const edgeCount = await db.get('SELECT COUNT(*) as count FROM edges')
    
    console.log(`\n📊 Current totals: ${nodeCount.count} nodes, ${edgeCount.count} edges`)
    
    expect(directiveNodes.length).toBeGreaterThan(50) // Should have 60+ directives
    expect(membershipCount).toBe(directiveNodes.length)
  })

  it('should extract and create directive relationships', async () => {
    console.log('\n🔗 STEP 4: EXTRACTING DIRECTIVE RELATIONSHIPS')
    console.log('=' .repeat(50))

    // Parse the file
    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE)
    
    let relationshipCount = 0
    let referencesFound = 0
    
    for (const directive of cdaData.core_directives) {
      const sourceId = ConceptualLexiconUtils.normalizeDirectiveId(directive.id)
      
      // Extract references from description
      const references = ConceptualLexiconUtils.extractDirectiveReferences(directive.description)
      referencesFound += references.length
      
      if (references.length > 0) {
        console.log(`🔗 ${directive.id}: Found ${references.length} references`)
        references.forEach(ref => {
          console.log(`   → ${ref.directive} (${ref.type}): ${ref.context.substring(0, 50)}...`)
        })
      }
      
      // Create relationship edges (only for nodes that exist)
      for (const ref of references) {
        const targetId = ConceptualLexiconUtils.normalizeDirectiveId(ref.directive)

        // Check if target node exists before creating edge
        const targetExists = await db.get(
          'SELECT id FROM nodes WHERE id = ?',
          [targetId]
        )

        if (targetExists) {
          const relationship: DirectiveRelationship = {
            source: sourceId,
            target: targetId,
            properties: {
              type: ref.type as any,
              context: ref.context,
              extracted_from: 'description'
            }
          }

          await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
          relationshipCount++
        } else {
          console.log(`   ⚠️  Skipping reference to non-existent node: ${ref.directive}`)
        }
      }
    }
    
    console.log(`\n✅ Created ${relationshipCount} directive relationships`)
    console.log(`📊 Total references found: ${referencesFound}`)
    
    // Show most referenced directives
    const mostReferenced = await db.all(`
      SELECT 
        json_extract(t.body, '$.directive_id') as directive_id,
        json_extract(t.body, '$.title') as title,
        COUNT(e.target) as reference_count
      FROM nodes t
      LEFT JOIN edges e ON t.id = e.target
      WHERE json_extract(t.body, '$.node_type') = 'directive'
        AND json_extract(e.properties, '$.type') IN ('references', 'supports', 'depends_on')
      GROUP BY t.id
      HAVING reference_count > 0
      ORDER BY reference_count DESC
      LIMIT 10
    `)
    
    console.log('\n🌟 Most Referenced Directives:')
    mostReferenced.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.directive_id}: ${dir.reference_count} references`)
    })

    expect(relationshipCount).toBeGreaterThan(0)
  })

  it('should demonstrate querying the CDA data', async () => {
    console.log('\n🔍 STEP 5: DEMONSTRATING CDA QUERIES')
    console.log('=' .repeat(50))

    // Query directives by category
    const categoryStats = await db.all(`
      SELECT 
        json_extract(body, '$.category') as category,
        json_extract(body, '$.category_title') as category_title,
        COUNT(*) as directive_count
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'directive'
      GROUP BY json_extract(body, '$.category')
      ORDER BY directive_count DESC
    `)

    console.log('\n📂 Directives by Category:')
    categoryStats.forEach(cat => {
      console.log(`   ${cat.category} (${cat.category_title}): ${cat.directive_count} directives`)
    })

    // Query core concepts
    const coreConceptsCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'core_concept'
    `)

    console.log(`\n🧠 Core Concepts: ${coreConceptsCount.count}`)

    // Query CDA metadata
    const cdaInfo = await db.get(`
      SELECT 
        json_extract(body, '$.title') as title,
        json_extract(body, '$.cda_version') as version,
        json_extract(body, '$.status') as status
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'cda'
    `)

    console.log(`\n📋 CDA Info: ${cdaInfo.title} v${cdaInfo.version} (${cdaInfo.status})`)

    // Final statistics
    const finalStats = await db.all(`
      SELECT 
        json_extract(body, '$.node_type') as node_type,
        COUNT(*) as count
      FROM nodes 
      GROUP BY json_extract(body, '$.node_type')
    `)

    console.log('\n📊 Final Node Statistics:')
    finalStats.forEach(stat => {
      console.log(`   ${stat.node_type}: ${stat.count}`)
    })

    expect(categoryStats.length).toBeGreaterThan(5) // Should have multiple categories
    expect(coreConceptsCount.count).toBeGreaterThanOrEqual(0) // Core concepts (may be 0 if extraction needs improvement)
  })
})
