import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createDatabase, cleanupDatabase, type Database } from './helpers/database'

// Import our SQL generation functions
import { createSchema } from '../ts/schema'
import { insertNodeFromObject, getInsertNodeParams } from '../ts/insert-node'
import { insertEdgeFromObject, getInsertEdgeParams } from '../ts/insert-edge'

// Import conceptual lexicon types
import type { 
  ConceptualLexiconFile, 
  TermNode, 
  CategoryNode, 
  VersionNode,
  TermRelationship,
  CategoryMembership,
  VersionMembership
} from '../ts/cl-types'
import { ConceptualLexiconUtils } from '../ts/cl-types'

const DB_FILE = 'conceptual-lexicon-full.db'

describe('Conceptual Lexicon Import Tests', () => {
  let db: Database
  let lexiconData: ConceptualLexiconFile

  beforeAll(async () => {
    // Clean up any existing file
    await cleanupDatabase(DB_FILE)
    
    // Create file database (no cleanup so we can inspect it)
    db = createDatabase({ 
      type: 'file', 
      filename: DB_FILE, 
      cleanup: false // Keep the file for inspection
    })
    
    // Create the schema
    await db.exec(createSchema())

    // Load the conceptual lexicon data
    const rawData = readFileSync('cda-matrix-ref/conceptual-lexicon.json', 'utf-8')
    lexiconData = JSON.parse(rawData)
    
    console.log(`\n📚 Loaded conceptual lexicon v${lexiconData.lexicon_version} with ${lexiconData.entry_count} entries`)
  })

  afterAll(async () => {
    await db.close()
    console.log(`\n📁 Database file created: ${DB_FILE}`)
    console.log('You can now open this file with a DB manager to inspect the conceptual lexicon data!')
  })

  it('should import all conceptual lexicon entries', async () => {
    // Clear existing data first
    await db.run('DELETE FROM edges')
    await db.run('DELETE FROM nodes')

    // Create version node
    const versionNode: VersionNode = {
      id: `v${lexiconData.lexicon_version}`,
      version: lexiconData.lexicon_version,
      export_timestamp: lexiconData.export_timestamp,
      entry_count: lexiconData.entry_count,
      cda_reference_version: lexiconData.cda_reference_version,
      lexicon_purpose: lexiconData.lexicon_purpose,
      node_type: 'version'
    }

    await db.run(insertNodeFromObject(versionNode), getInsertNodeParams(versionNode))
    console.log(`✅ Created version node: v${lexiconData.lexicon_version}`)

    // Track categories we've seen
    const categoriesCreated = new Set<string>()
    
    // Process all entries
    const entriesToProcess = lexiconData.entries
    
    for (const [index, entry] of entriesToProcess.entries()) {
      // Log progress every 10 entries to avoid too much output
      if (index % 10 === 0 || index === entriesToProcess.length - 1) {
        console.log(`\n📝 Processing entry ${index + 1}/${entriesToProcess.length}: "${entry.Term}"`)
      }
      
      // Create category node if we haven't seen it before
      const categoryId = ConceptualLexiconUtils.normalizeCategoryId(entry.Category)
      if (!categoriesCreated.has(categoryId)) {
        const categoryNode: CategoryNode = {
          id: categoryId,
          name: entry.Category,
          node_type: 'category'
        }

        await db.run(insertNodeFromObject(categoryNode), getInsertNodeParams(categoryNode))
        categoriesCreated.add(categoryId)
        if (index % 10 === 0 || index < 10) {
          console.log(`  📂 Created category: ${entry.Category}`)
        }
      }

      // Create term node
      const termId = ConceptualLexiconUtils.normalizeTermId(entry.Term)
      const termNode: TermNode = {
        id: termId,
        term: entry.Term,
        definition: entry.Definition,
        category: entry.Category,
        status: entry.Status,
        timestamp_added: entry.Timestamp_Added,
        context_reference: entry.Context_Reference,
        colloquial_alias: ConceptualLexiconUtils.processColloquialAliases(entry.Colloquial_Alias),
        lexicon_version: lexiconData.lexicon_version,
        node_type: 'term'
      }

      await db.run(insertNodeFromObject(termNode), getInsertNodeParams(termNode))
      if (index % 10 === 0 || index < 10) {
        console.log(`  📄 Created term node: ${entry.Term} (${termId})`)
      }

      // Create category membership edge
      const categoryMembership: CategoryMembership = {
        source: termId,
        target: categoryId,
        properties: {
          type: 'belongs_to',
          primary: true
        }
      }

      await db.run(insertEdgeFromObject(categoryMembership), getInsertEdgeParams(categoryMembership))

      // Create version membership edge
      const versionMembership: VersionMembership = {
        source: termId,
        target: `v${lexiconData.lexicon_version}`,
        properties: {
          type: 'present_in',
          timestamp: entry.Timestamp_Added
        }
      }

      await db.run(insertEdgeFromObject(versionMembership), getInsertEdgeParams(versionMembership))

      // Extract and create term relationships
      if (entry.Context_Reference) {
        const references = ConceptualLexiconUtils.extractTermReferences(entry.Context_Reference)
        
        for (const ref of references) {
          if (index % 10 === 0 || index < 10) {
            console.log(`    🔗 Found reference: ${ref.term} (${ref.type})`)
          }

          const termRelationship: TermRelationship = {
            source: termId,
            target: ConceptualLexiconUtils.normalizeTermId(ref.term),
            properties: {
              type: ref.type as any,
              context: ref.context,
              extracted_from: 'Context_Reference'
            }
          }

          await db.run(insertEdgeFromObject(termRelationship), getInsertEdgeParams(termRelationship))
        }
      }
    }

    // Verify data was inserted
    const nodeCount = await db.get('SELECT COUNT(*) as count FROM nodes')
    const edgeCount = await db.get('SELECT COUNT(*) as count FROM edges')
    
    console.log(`\n📊 Import Summary:`)
    console.log(`   Nodes created: ${nodeCount.count}`)
    console.log(`   Edges created: ${edgeCount.count}`)
    console.log(`   Categories: ${categoriesCreated.size}`)
    console.log(`   Terms: ${entriesToProcess.length}`)
    console.log(`   Version: 1`)

    expect(nodeCount.count).toBeGreaterThan(120) // At least 120 terms + categories + version
    expect(edgeCount.count).toBeGreaterThan(240) // At least category + version memberships for all terms
  })

  it('should demonstrate querying the conceptual lexicon data', async () => {
    // Query terms by category
    const coreConceptTerms = await db.all(`
      SELECT
        json_extract(t.body, '$.term') as term,
        json_extract(t.body, '$.definition') as definition,
        json_extract(t.body, '$.status') as status
      FROM nodes t
      JOIN edges e ON t.id = e.source
      JOIN nodes c ON e.target = c.id
      WHERE json_extract(c.body, '$.node_type') = 'category'
        AND json_extract(c.body, '$.name') = 'Core Concept'
        AND json_extract(e.properties, '$.type') = 'belongs_to'
        AND json_extract(t.body, '$.node_type') = 'term'
    `)

    console.log(`\n🔍 Core Concept terms found: ${coreConceptTerms.length}`)
    coreConceptTerms.forEach(term => {
      console.log(`   - ${term.term}: ${term.status}`)
    })

    // Query term relationships
    const termRelationships = await db.all(`
      SELECT
        json_extract(s.body, '$.term') as source_term,
        json_extract(t.body, '$.term') as target_term,
        e.properties
      FROM edges e
      JOIN nodes s ON e.source = s.id
      JOIN nodes t ON e.target = t.id
      WHERE json_extract(s.body, '$.node_type') = 'term'
        AND json_extract(t.body, '$.node_type') = 'term'
        AND json_extract(e.properties, '$.type') LIKE '%related%'
    `)

    console.log(`\n🔗 Term relationships found: ${termRelationships.length}`)
    termRelationships.slice(0, 5).forEach(rel => {
      const props = JSON.parse(rel.properties)
      console.log(`   ${rel.source_term} --[${props.type}]--> ${rel.target_term}`)
    })

    expect(coreConceptTerms.length).toBeGreaterThan(0)
  })

  it('should show database statistics', async () => {
    // Node type distribution
    const nodeTypes = await db.all(`
      SELECT 
        json_extract(body, '$.node_type') as node_type,
        COUNT(*) as count
      FROM nodes 
      GROUP BY json_extract(body, '$.node_type')
    `)

    console.log(`\n📈 Node type distribution:`)
    nodeTypes.forEach(type => {
      console.log(`   ${type.node_type}: ${type.count}`)
    })

    // Edge type distribution
    const edgeTypes = await db.all(`
      SELECT 
        json_extract(properties, '$.type') as edge_type,
        COUNT(*) as count
      FROM edges 
      GROUP BY json_extract(properties, '$.type')
    `)

    console.log(`\n📈 Edge type distribution:`)
    edgeTypes.forEach(type => {
      console.log(`   ${type.edge_type}: ${type.count}`)
    })

    // Category distribution
    const categories = await db.all(`
      SELECT 
        json_extract(body, '$.category') as category,
        COUNT(*) as count
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'term'
      GROUP BY json_extract(body, '$.category')
    `)

    console.log(`\n📈 Category distribution:`)
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count}`)
    })

    expect(nodeTypes.length).toBeGreaterThan(0)
    expect(edgeTypes.length).toBeGreaterThan(0)
  })
})
