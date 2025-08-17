import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SimpleGraph } from '../../src/SimpleGraph';
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

describe('Core Directive Array Import Tests using SimpleGraph API', () => {
  let graph: SimpleGraph;

  beforeAll(async () => {
    graph = await SimpleGraph.connect({ path: 'cda-import-test.db' });
    console.log(`\n📋 Starting Core Directive Array import from ${CDA_FILE} into cda-import-test.db`);
  });

  afterAll(async () => {
    await graph.close();
    console.log(`\n✅ Test database closed.`);
  });


  it('should parse the core directive array markdown file', async () => {
    console.log('\n🔍 STEP 1: PARSING MARKDOWN FILE');
    console.log('=' .repeat(50));

    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE);
    
    console.log(`✅ Parsed CDA v${cdaData.cda_version}: "${cdaData.title}"`);
    console.log(`📄 Purpose: ${cdaData.purpose.substring(0, 100)}...`);
    console.log(`📊 Found ${cdaData.core_directives.length} core directives`);
    
    expect(cdaData.cda_version).toBeGreaterThan(0);
    expect(cdaData.title).toBeTruthy();
    expect(cdaData.core_directives.length).toBeGreaterThan(10);
    
    const categories = new Map<string, number>();
    cdaData.core_directives.forEach(directive => {
      const category = directive.id.split('-')[0];
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    
    console.log('\n📂 Directive Categories:');
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} directives`);
      });
  });

  it('should import CDA metadata and core concepts', async () => {
    console.log('\n🏗️  STEP 2: IMPORTING METADATA & CONCEPTS');
    console.log('=' .repeat(50));

    await graph.query.run('DELETE FROM edges');
    await graph.query.run('DELETE FROM nodes WHERE id != \'0\''); // Keep genesis node

    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE);
    const content = require('fs').readFileSync(CDA_FILE, 'utf-8');
    
    const cdaNode = CDAParser.createCDANode(cdaData);
    await graph.nodes.add(cdaNode);
    console.log(`✅ Created CDA metadata node: ${cdaNode.id}`);
    
    const concepts = CDAParser.extractCoreConcepts(content);
    const conceptNodes = CDAParser.createCoreConceptNodes(concepts, cdaData.cda_version);
    
    for (const concept of conceptNodes) {
      await graph.nodes.add(concept);
    }
    
    console.log(`✅ Created ${conceptNodes.length} core concept nodes`);
    console.log('📋 Core Concepts:');
    conceptNodes.forEach(concept => {
      console.log(`   - ${concept.concept_name} (${concept.concept_type})`);
    });

    const [nodeCount] = await graph.query.raw('SELECT COUNT(*) as count FROM nodes');
    expect(nodeCount.count).toBe(1 + conceptNodes.length + 1); // +1 for genesis
  });

  it('should import all core directives', async () => {
    console.log('\n📝 STEP 3: IMPORTING CORE DIRECTIVES');
    console.log('=' .repeat(50));

    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE);
    const directiveNodes = CDAParser.createDirectiveNodes(cdaData.core_directives, cdaData.cda_version);
    
    let importedCount = 0;
    for (const [index, directive] of directiveNodes.entries()) {
      await graph.nodes.add(directive);
      importedCount++;
      if (index % 10 === 0 || index === directiveNodes.length - 1) {
        console.log(`📄 Imported ${importedCount}/${directiveNodes.length}: ${directive.directive_id} - ${directive.title}`);
      }
    }
    
    console.log(`✅ Successfully imported ${directiveNodes.length} directives`);
    
    let membershipCount = 0;
    for (const directive of directiveNodes) {
      const membership: CDAMembership = {
        source: directive.id,
        target: `cda-${cdaData.cda_version}`,
        properties: {
          type: 'belongs_to_cda',
          category: directive.category
        }
      };
      await graph.edges.add(membership);
      membershipCount++;
    }
    
    console.log(`✅ Created ${membershipCount} CDA membership edges`);

    const [nodeCount] = await graph.query.raw('SELECT COUNT(*) as count FROM nodes');
    const [edgeCount] = await graph.query.raw('SELECT COUNT(*) as count FROM edges');
    
    console.log(`\n📊 Current totals: ${nodeCount.count} nodes, ${edgeCount.count} edges`);
    
    expect(directiveNodes.length).toBeGreaterThan(50);
    expect(membershipCount).toBe(directiveNodes.length);
  });

  it('should extract and create directive relationships', async () => {
    console.log('\n🔗 STEP 4: EXTRACTING DIRECTIVE RELATIONSHIPS');
    console.log('=' .repeat(50));

    const cdaData = CDAParser.parseMarkdownFile(CDA_FILE);
    
    let relationshipCount = 0;
    let referencesFound = 0;
    
    for (const directive of cdaData.core_directives) {
      const sourceId = ConceptualLexiconUtils.normalizeDirectiveId(directive.id);
      const references = ConceptualLexiconUtils.extractDirectiveReferences(directive.description);
      referencesFound += references.length;
      
      if (references.length > 0) {
        console.log(`🔗 ${directive.id}: Found ${references.length} references`);
        references.forEach(ref => {
          console.log(`   → ${ref.directive} (${ref.type}): ${ref.context.substring(0, 50)}...`);
        });
      }
      
      for (const ref of references) {
        const targetId = ConceptualLexiconUtils.normalizeDirectiveId(ref.directive);
        const targetExists = await graph.nodes.get(targetId);

        if (targetExists) {
          const relationship: DirectiveRelationship = {
            source: sourceId,
            target: targetId,
            properties: {
              type: ref.type as any,
              context: ref.context,
              extracted_from: 'description'
            }
          };
          await graph.edges.add(relationship);
          relationshipCount++;
        } else {
          console.log(`   ⚠️  Skipping reference to non-existent node: ${ref.directive}`);
        }
      }
    }
    
    console.log(`\n✅ Created ${relationshipCount} directive relationships`);
    console.log(`📊 Total references found: ${referencesFound}`);
    
    const mostReferenced = await graph.query.raw(`
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
    `);
    
    console.log('\n🌟 Most Referenced Directives:');
    mostReferenced.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.directive_id}: ${dir.reference_count} references`);
    });

    expect(relationshipCount).toBeGreaterThan(0);
  });

  it('should demonstrate querying the CDA data', async () => {
    console.log('\n🔍 STEP 5: DEMONSTRATING CDA QUERIES');
    console.log('=' .repeat(50));

    const categoryStats = await graph.query.raw(`
      SELECT 
        json_extract(body, '$.category') as category,
        json_extract(body, '$.category_title') as category_title,
        COUNT(*) as directive_count
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'directive'
      GROUP BY json_extract(body, '$.category')
      ORDER BY directive_count DESC
    `);

    console.log('\n📂 Directives by Category:');
    categoryStats.forEach(cat => {
      console.log(`   ${cat.category} (${cat.category_title}): ${cat.directive_count} directives`);
    });

    const [coreConceptsCount] = await graph.query.raw(`
      SELECT COUNT(*) as count 
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'core_concept'
    `);

    console.log(`\n🧠 Core Concepts: ${coreConceptsCount.count}`);

    const [cdaInfo] = await graph.query.raw(`
      SELECT 
        json_extract(body, '$.title') as title,
        json_extract(body, '$.cda_version') as version,
        json_extract(body, '$.status') as status
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'cda'
    `);

    console.log(`\n📋 CDA Info: ${cdaInfo.title} v${cdaInfo.version} (${cdaInfo.status})`);

    const finalStats = await graph.query.raw(`
      SELECT 
        json_extract(body, '$.node_type') as node_type,
        COUNT(*) as count
      FROM nodes 
      GROUP BY json_extract(body, '$.node_type')
    `);

    console.log('\n📊 Final Node Statistics:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.node_type}: ${stat.count}`);
    });

    expect(categoryStats.length).toBeGreaterThan(5);
    expect(coreConceptsCount.count).toBeGreaterThanOrEqual(0);
  });
});