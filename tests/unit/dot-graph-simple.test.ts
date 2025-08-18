import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { DotGraphGenerator } from '../../src/visualization/dot-generator';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { SimpleGraph } from '../../src/SimpleGraph';

const OUTPUT_DIR = 'outputs/visualizations';

describe('Simple DOT Graph Test', () => {
  let graph: SimpleGraph;
  let generator: DotGraphGenerator;
  let dbPath: string;

  beforeAll(async () => {
    dbPath = `dot-graph-test-${Date.now()}.db`;
    graph = await SimpleGraph.connect({ path: dbPath });
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
      if (dbPath && existsSync(dbPath)) {
        unlinkSync(dbPath);
        console.log(`🧹 Deleted test database: ${dbPath}`);
      }
    }
  });

  // ...existing test cases...
});