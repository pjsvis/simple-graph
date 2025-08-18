import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SimpleGraph } from '../../src/SimpleGraph';
import { ConceptualLexiconParser } from '../../src/parsers/conceptual-lexicon-parser';
import type {
  TermNode,
  CategoryNode,
  VersionNode,
  CategoryMembership,
  VersionMembership,
} from '../../src/types/cl-types';

const LEXICON_FILE = '.ctx/conceptual-lexicon.json';

describe('Conceptual Lexicon Import Tests using SimpleGraph API', () => {
  let graph: SimpleGraph;

  beforeAll(async () => {
    graph = await SimpleGraph.connect({ path: 'conceptual-lexicon-import-test.db' });
    console.log(`\n📚 Starting Conceptual Lexicon import from ${LEXICON_FILE} into conceptual-lexicon-import-test.db`);
  });

  afterAll(async () => {
    await graph.close();
    console.log(`\n✅ Test database closed.`);
  });


  it('should parse the conceptual lexicon JSON file', async () => {
    console.log('\n🔍 STEP 1: PARSING CONCEPTUAL LEXICON JSON');
    console.log('=' .repeat(50));

    const lexiconData = ConceptualLexiconParser.parseJsonFile(LEXICON_FILE);
    
    console.log(`✅ Parsed Conceptual Lexicon v${lexiconData.lexicon_version}`);
    console.log(`📊 Entry count: ${lexiconData.entry_count}`);
    console.log(`📅 Export timestamp: ${lexiconData.export_timestamp}`);
    console.log(`🔗 CDA reference version: ${lexiconData.cda_reference_version}`);
    console.log(`📄 Purpose: ${lexiconData.lexicon_purpose.substring(0, 100)}...`);
    
    expect(lexiconData.lexicon_version).toBe('1.76');
    expect(lexiconData.entry_count).toBe(120);
    expect(lexiconData.entries.length).toBeGreaterThanOrEqual(120);
    expect(lexiconData.cda_reference_version).toBe('E-061');
  });

  it('should analyze lexicon statistics and categories', async () => {
    console.log('\n📊 STEP 2: ANALYZING LEXICON STATISTICS');
    console.log('=' .repeat(50));

    const lexiconData = ConceptualLexiconParser.parseJsonFile(LEXICON_FILE);
    const statistics = ConceptualLexiconParser.getStatistics(lexiconData);
    const categories = ConceptualLexiconParser.extractCategories(lexiconData.entries);
    
    console.log(`📈 Total entries: ${statistics.totalEntries}`);
    console.log(`📂 Unique categories: ${categories.length}`);
    console.log(`🏷️  Entries with aliases: ${statistics.entriesWithAliases}`);
    console.log(`📝 Entries with context: ${statistics.entriesWithContext}`);
    
    console.log('\n📊 Top Categories:');
    const sortedCategories = Object.entries(statistics.categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedCategories.forEach(([category, count]) => {
      console.log(`   ${category}: ${count} entries`);
    });
    
    console.log('\n📊 Status Distribution:');
    Object.entries(statistics.statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} entries`);
    });

    expect(statistics.totalEntries).toBeGreaterThanOrEqual(120);
    expect(categories.length).toBeGreaterThan(10);
    expect(statistics.statusCounts.active).toBeGreaterThan(100);
  });

  it('should import version and category nodes', async () => {
    console.log('\n🏗️  STEP 3: IMPORTING VERSION & CATEGORY NODES');
    console.log('=' .repeat(50));

    await graph.query.run('DELETE FROM edges');
    await graph.query.run("DELETE FROM nodes WHERE id != '0'");

    const processed = ConceptualLexiconParser.processLexiconFile(LEXICON_FILE);
    
    await graph.nodes.add(processed.versionNode);
    console.log(`✅ Created version node: ${processed.versionNode.id}`);
    
    for (const category of processed.categoryNodes) {
      await graph.nodes.add(category);
    }
    
    console.log(`✅ Created ${processed.categoryNodes.length} category nodes`);
    console.log('\n📂 Categories:');
    processed.categoryNodes.slice(0, 10).forEach(cat => {
      console.log(`   - ${cat.category_name}`);
    });
    if (processed.categoryNodes.length > 10) {
      console.log(`   ... and ${processed.categoryNodes.length - 10} more categories`);
    }

    const [nodeCount] = await graph.query.raw('SELECT COUNT(*) as count FROM nodes');
    expect(nodeCount.count).toBe(1 + processed.categoryNodes.length + 1); // +1 for genesis
    expect(processed.categoryNodes.length).toBeGreaterThan(50);
  });

  it('should import all term nodes', async () => {
    console.log('\n📝 STEP 4: IMPORTING TERM NODES');
    console.log('=' .repeat(50));

    const processed = ConceptualLexiconParser.processLexiconFile(LEXICON_FILE);
    
    let importedCount = 0;
    for (const [index, term] of processed.termNodes.entries()) {
      await graph.nodes.add(term);
      importedCount++;
      if (index % 20 === 0 || index === processed.termNodes.length - 1) {
        console.log(`📄 Imported ${importedCount}/${processed.termNodes.length}: ${term.term}`);
      }
    }
    
    console.log(`\n✅ Successfully imported ${processed.termNodes.length} terms`);

    const [nodeCount] = await graph.query.raw('SELECT COUNT(*) as count FROM nodes');
    const expectedNodes = 1 + processed.categoryNodes.length + processed.termNodes.length + 1; // + genesis
    
    console.log(`📊 Total nodes: ${nodeCount.count} (expected: ${expectedNodes})`);
    
    expect(processed.termNodes.length).toBeGreaterThanOrEqual(120);
    expect(nodeCount.count).toBe(expectedNodes);
  });

  it('should create category and version membership edges', async () => {
    console.log('\n🔗 STEP 5: CREATING MEMBERSHIP EDGES');
    console.log('=' .repeat(50));

    const processed = ConceptualLexiconParser.processLexiconFile(LEXICON_FILE);
    
    await graph.query.run('BEGIN TRANSACTION');
    try {
      let categoryMembershipCount = 0;
      for (const membership of processed.categoryMemberships) {
        await graph.edges.add(membership);
        categoryMembershipCount++;
      }
      
      console.log(`✅ Created ${categoryMembershipCount} category membership edges`);
      
      let versionMembershipCount = 0;
      for (const membership of processed.versionMemberships) {
        await graph.edges.add(membership);
        versionMembershipCount++;
      }
      
      console.log(`✅ Created ${versionMembershipCount} version membership edges`);

      await graph.query.run('COMMIT');

      const [edgeCount] = await graph.query.raw('SELECT COUNT(*) as count FROM edges');
      const expectedEdges = categoryMembershipCount + versionMembershipCount;
      
      console.log(`📊 Total edges: ${edgeCount.count} (expected: ${expectedEdges})`);
      
      expect(categoryMembershipCount).toBe(processed.termNodes.length);
      expect(versionMembershipCount).toBe(processed.termNodes.length);
      expect(edgeCount.count).toBe(expectedEdges);
    } catch (e) {
      await graph.query.run('ROLLBACK');
      throw e;
    }
  });

  it('should analyze CDA references in lexicon entries', async () => {
    console.log('\n🔗 STEP 6: ANALYZING CDA REFERENCES');
    console.log('=' .repeat(50));

    const processed = ConceptualLexiconParser.processLexiconFile(LEXICON_FILE);
    const cdaReferences = processed.cdaReferences;
    
    console.log(`🔍 Found ${cdaReferences.length} terms with CDA references`);
    
    if (cdaReferences.length > 0) {
      console.log('\n🔗 Terms referencing CDA directives:');
      cdaReferences.slice(0, 10).forEach(ref => {
        console.log(`   📄 ${ref.term}:`);
        ref.references.forEach(directive => {
          console.log(`      → ${directive}`);
        });
      });
      
      if (cdaReferences.length > 10) {
        console.log(`   ... and ${cdaReferences.length - 10} more terms with CDA references`);
      }
      
      const directiveCounts: Record<string, number> = {};
      cdaReferences.forEach(ref => {
        ref.references.forEach(directive => {
          directiveCounts[directive] = (directiveCounts[directive] || 0) + 1;
        });
      });
      
      const topDirectives = Object.entries(directiveCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      console.log('\n🌟 Most Referenced CDA Directives:');
      topDirectives.forEach(([directive, count]) => {
        console.log(`   ${directive}: ${count} references`);
      });
    }

    expect(cdaReferences.length).toBeGreaterThan(0);
  });

  it('should demonstrate querying the conceptual lexicon data', async () => {
    console.log('\n🔍 STEP 7: DEMONSTRATING LEXICON QUERIES');
    console.log('=' .repeat(50));

    const categoryStats = await graph.query.raw(`
      SELECT 
        json_extract(body, '$.category') as category,
        COUNT(*) as term_count
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'term'
        AND json_extract(body, '$.category') IS NOT NULL
      GROUP BY json_extract(body, '$.category')
      ORDER BY term_count DESC
      LIMIT 10
    `);

    console.log('\n📂 Terms by Category (Top 10):');
    categoryStats.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.term_count} terms`);
    });

    const statusStats = await graph.query.raw(`
      SELECT 
        json_extract(body, '$.status') as status,
        COUNT(*) as term_count
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'term'
      GROUP BY json_extract(body, '$.status')
    `);

    console.log('\n📊 Terms by Status:');
    statusStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.term_count} terms`);
    });

    const [versionInfo] = await graph.query.raw(`
      SELECT 
        json_extract(body, '$.version') as version,
        json_extract(body, '$.entry_count') as entry_count,
        json_extract(body, '$.cda_reference_version') as cda_version
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'version'
    `);

    if (versionInfo) {
      console.log(`\n📋 Lexicon Info: v${versionInfo.version} (${versionInfo.entry_count} entries, CDA ${versionInfo.cda_version})`);
    } else {
      console.log('\n⚠️  No version info found in database');
    }

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
    expect(statusStats.length).toBeGreaterThanOrEqual(1);
    if (versionInfo) {
      expect(versionInfo.version).toBe('1.76');
    }
  });
});
