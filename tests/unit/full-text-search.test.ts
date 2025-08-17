import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SimpleGraph } from '../../src/SimpleGraph';
import { Node } from '../../src/types/base-types';

describe('Full-text search via SimpleGraph API', () => {
    let graph: SimpleGraph;

    beforeAll(async () => {
        graph = await SimpleGraph.connect();

        // Insert some sample data
        await graph.nodes.add({ id: 'node-1', content: 'This is a test node with some interesting content.' });
        await graph.nodes.add({ id: 'node-2', content: 'Another node, this one is about cats.' });
        await graph.nodes.add({ id: 'node-3', content: 'A third node, this one is about dogs and cats.' });
    });

    afterAll(async () => {
        await graph.close();
    });

    it('should return nodes that match the search query', async () => {
        const results = await graph.nodes.search('cats');
        expect(results).toHaveLength(2);
        const ids = results.map(n => n.id);
        expect(ids).toContain('node-2');
        expect(ids).toContain('node-3');
    });

    it('should return an empty array if no nodes match the search query', async () => {
        const results = await graph.nodes.search('zebras');
        expect(results).toHaveLength(0);
    });

    it('should handle complex queries', async () => {
        const results = await graph.nodes.search('dogs AND cats');
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('node-3');
    });
});