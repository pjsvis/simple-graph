import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { SimpleGraph } from '../../src/SimpleGraph';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_OUTPUT_DIR = 'outputs/test-visualizations';

describe('Graph Visualization via SimpleGraph API', () => {
    let graph: SimpleGraph;

    beforeEach(async () => {
        // Connect to a new in-memory database for each test
        graph = await SimpleGraph.connect();
        
        // Add some data for visualization
        await graph.nodes.add({ id: 'a', label: 'A' });
        await graph.nodes.add({ id: 'b', label: 'B' });
        await graph.nodes.add({ id: 'c', label: 'C' });
        await graph.edges.add({ source: 'a', target: 'b' });
        await graph.edges.add({ source: 'b', target: 'c' });

        if (!existsSync(TEST_OUTPUT_DIR)) {
            mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
        }
    });

    afterEach(async () => {
        await graph.close();
        if (existsSync(TEST_OUTPUT_DIR)) {
            rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
        }
    });

    test('should generate a mind map and render it successfully', async () => {
        const dot = await graph.visualize.mindMap({ startNodeId: 'a', depth: 2 });
        expect(dot).toContain('digraph G');
        expect(dot).toContain('"a" -> "b"');
        expect(dot).toContain('"b" -> "c"');

        const svgPath = join(TEST_OUTPUT_DIR, 'mind-map.svg');
        await graph.visualize.render(dot, { format: 'svg', path: svgPath });
        expect(existsSync(svgPath)).toBe(true);
    });

    test('should throw an error for an invalid canned graph type', async () => {
        // @ts-expect-error - Intentionally passing an invalid type
        await expect(graph.visualize.cannedGraph('invalid-type')).rejects.toThrow('Invalid graph type: invalid-type');
    });
});