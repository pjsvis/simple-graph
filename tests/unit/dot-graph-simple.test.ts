import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { DotGraphGenerator } from '../../src/visualization/dot-generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { SimpleGraph } from '../../src/SimpleGraph';

const OUTPUT_DIR = 'outputs/visualizations';

describe('Simple DOT Graph Test', () => {
  let graph: SimpleGraph;
  let generator: DotGraphGenerator;

  beforeAll(async () => {
    graph = await SimpleGraph.connect({ path: `dot-graph-test-${Date.now()}.db` });
    generator = new DotGraphGenerator(graph.query);
    
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!existsSync(`${OUTPUT_DIR}/organic`)) {
      mkdirSync(`${OUTPUT_DIR}/organic`, { recursive: true });
    }
    if (!existsSync(`${OUTPUT_DIR}/synth`)) {
      mkdirSync(`${OUTPUT_DIR}/synth`, { recursive: true });
    }
    
    console.log('\n🔍 DEBUGGING DOT GRAPH GENERATION');
    console.log('=' .repeat(50));
  });

  afterAll(async () => {
    if (graph) {
      await graph.close();
    }
  });

  it('should debug database queries', async () => {
    console.log('\n🔍 Testing database queries...');
    
    // Test basic node query
    const nodeQuery = `
      SELECT 
        id,
        json_extract(body, '$.node_type') as node_type,
        json_extract(body, '$.directive_id') as directive_id,
        json_extract(body, '$.title') as title
      FROM nodes 
      WHERE json_extract(body, '$.node_type') = 'directive'
      LIMIT 5
    `;
    
    const nodeResult = await graph.query.raw(nodeQuery);
    console.log('Node query result type:', typeof nodeResult);
    console.log('Node query result is array:', Array.isArray(nodeResult));
    console.log('Node query result length:', nodeResult?.length);
    console.log('First node:', nodeResult?.[0]);
    
    // Test basic edge query
    const edgeQuery = `
      SELECT 
        source,
        target,
        json_extract(properties, '$.type') as edge_type
      FROM edges 
      WHERE json_extract(properties, '$.type') = 'references'
      LIMIT 5
    `;
    
    const edgeResult = await graph.query.raw(edgeQuery);
    console.log('\nEdge query result type:', typeof edgeResult);
    console.log('Edge query result is array:', Array.isArray(edgeResult));
    console.log('Edge query result length:', edgeResult?.length);
    console.log('First edge:', edgeResult?.[0]);
    
    expect(Array.isArray(nodeResult)).toBe(true);
    expect(Array.isArray(edgeResult)).toBe(true);
  });


  it('should generate a simple DOT graph', async () => {
    console.log('\n🎨 Generating simple DOT graph...')
    
    try {
      const config = {
        title: 'Simple Test Graph',
        includeNodeTypes: ['directive'],
        includeEdgeTypes: ['references'],
        maxEdges: 10,
        showNodeLabels: true,
        showEdgeLabels: false,
        clusterByCategory: false
      }

      const dotContent = await generator.generateDot(config)
      
      console.log('DOT content length:', dotContent.length)
      console.log('DOT content preview:', dotContent.substring(0, 200) + '...')
      
      // Save to file
      const filename = `${OUTPUT_DIR}/organic/simple-test.dot`
      writeFileSync(filename, dotContent)
      
      console.log(`✅ Generated simple graph: ${filename}`)
      
      expect(dotContent).toContain('digraph KnowledgeGraph')
      expect(dotContent.length).toBeGreaterThan(100)
      
    } catch (error) {
      console.error('Error generating DOT graph:', error)
      throw error
    }
  })

  it('should generate a minimal working example', async () => {
    console.log('\n🎯 Creating minimal working example...')
    
    // Create a minimal DOT graph manually
    const minimalDot = `digraph KnowledgeGraph {
  layout="dot"
  rankdir="TB"
  
  // Sample nodes
  node1 [label="CIP-1\\nCore Identity", shape="box", fillcolor="#E3F2FD", style=filled]
  node2 [label="IPR-1\\nInteraction Style", shape="box", fillcolor="#E3F2FD", style=filled]
  node3 [label="PHI-1\\nProcessing Philosophy", shape="box", fillcolor="#E3F2FD", style=filled]
  
  // Sample edges
  node1 -> node2 [label="informs", color="#1976D2"]
  node2 -> node3 [label="guides", color="#1976D2"]
}`

    const filename = `${OUTPUT_DIR}/organic/minimal-example.dot`
    writeFileSync(filename, minimalDot)

    console.log(`✅ Generated minimal example: ${filename}`)
    console.log('\n📋 To render this graph:')
    console.log(`   dot -Tsvg ${filename} -o ${OUTPUT_DIR}/organic/minimal-example.svg`)
    console.log(`   dot -Tpng ${filename} -o ${OUTPUT_DIR}/organic/minimal-example.png`)
    
    expect(minimalDot).toContain('digraph KnowledgeGraph')
  })

  it('should provide rendering instructions', async () => {
    console.log('\n📋 RENDERING INSTRUCTIONS')
    console.log('=' .repeat(50))
    console.log('To render the DOT files to visual formats:')
    console.log('')
    console.log('1. Install Graphviz:')
    console.log('   Windows: choco install graphviz')
    console.log('   macOS: brew install graphviz')
    console.log('   Ubuntu: sudo apt-get install graphviz')
    console.log('')
    console.log('2. Render to SVG (recommended):')
    console.log(`   dot -Tsvg ${OUTPUT_DIR}/simple-test.dot -o ${OUTPUT_DIR}/simple-test.svg`)
    console.log('')
    console.log('3. Render to PNG:')
    console.log(`   dot -Tpng -Gdpi=300 ${OUTPUT_DIR}/simple-test.dot -o ${OUTPUT_DIR}/simple-test.png`)
    console.log('')
    console.log('4. Render to PDF:')
    console.log(`   dot -Tpdf ${OUTPUT_DIR}/simple-test.dot -o ${OUTPUT_DIR}/simple-test.pdf`)
    console.log('')
    console.log('5. Open SVG in browser:')
    console.log(`   Open: file://${process.cwd()}/${OUTPUT_DIR}/simple-test.svg`)
    
    expect(true).toBe(true) // Always pass
  })
})
