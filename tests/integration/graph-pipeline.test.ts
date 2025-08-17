import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateVisualization } from '../../src/analysis/graph-pipeline';
import { isGraphvizInstalled, renderDotToImage } from '../../src/visualization/renderers/graphviz-renderer';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DB_FILE = 'cda-import-test.db';
const TEST_OUTPUT_DIR = 'outputs/test-visualizations';

describe('Graph Generation Pipeline Tests', () => {

  beforeAll(() => {
    if (!existsSync(TEST_OUTPUT_DIR)) {
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  it('should generate and render a simple graph successfully', async () => {
    const simpleDot = 'digraph { a -> b -> c; }';
    const dotPath = join(TEST_OUTPUT_DIR, 'simple-graph.dot');

    // Test .dot file generation
    writeFileSync(dotPath, simpleDot, 'utf-8');
    expect(existsSync(dotPath)).toBe(true);
    const content = readFileSync(dotPath, 'utf-8');
    expect(content).toBe(simpleDot);

    // Test rendering to SVG and PNG
    const graphvizInstalled = await isGraphvizInstalled();
    if (!graphvizInstalled) {
      console.warn('Graphviz not found, skipping image rendering test.');
      return;
    }

    // --- Test SVG ---
    const svgPath = join(TEST_OUTPUT_DIR, 'simple-graph.svg');
    await renderDotToImage(simpleDot, 'svg', svgPath);
    expect(existsSync(svgPath)).toBe(true);

    // --- Test PNG ---
    const pngPath = join(TEST_OUTPUT_DIR, 'simple-graph.png');
    await renderDotToImage(simpleDot, 'png', pngPath);
    expect(existsSync(pngPath)).toBe(true);
  }, 10000);

  it('should throw an error for an invalid graph type', async () => {
    const outputPath = join(TEST_OUTPUT_DIR, 'invalid.dot');
    
    // @ts-expect-error - Intentionally passing an invalid type for testing
    const promise = generateVisualization(DB_FILE, 'invalid-graph-type', 'dot', outputPath);

    await expect(promise).rejects.toThrow('Invalid graph type: invalid-graph-type');
  });
});