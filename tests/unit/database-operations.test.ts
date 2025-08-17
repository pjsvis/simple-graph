import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SimpleGraph } from '../../src/SimpleGraph';
import { Node } from '../../src/types/base-types';

describe('Database Operations via SimpleGraph API', () => {
    let graph: SimpleGraph;

    beforeAll(async () => {
        // Connect to a new in-memory database for each test suite
        graph = await SimpleGraph.connect();
    });

    afterAll(async () => {
        await graph.close();
    });

    describe('Genesis Node', () => {
        it('should create the genesis node upon initialization', async () => {
            const genesisNode = await graph.nodes.get('0');
            expect(genesisNode).toBeDefined();
            expect(genesisNode).not.toBeNull();
            expect(genesisNode?.id).toBe('0');
            expect(genesisNode?.label).toBe('System');
            expect(genesisNode?.body).toBe('This is the genesis node, the root of the graph.');
            expect(genesisNode?.createdAt).toBeDefined();
        });

        it('should prevent the genesis node from being deleted', async () => {
            await expect(graph.nodes.delete('0')).rejects.toThrow('The genesis node cannot be deleted.');
        });
    });

    describe('Node Operations', () => {
        it('should add and delete a regular node', async () => {
            const node: Node = { id: 'test-node', label: 'Test', body: 'Test node body' };
            
            // Add the node
            await graph.nodes.add(node);

            // Verify it exists
            const insertedNode = await graph.nodes.get('test-node');
            expect(insertedNode).toBeDefined();
            expect(insertedNode?.label).toBe('Test');

            // Delete it
            await graph.nodes.delete('test-node');

            // Verify it's gone
            const deletedNode = await graph.nodes.get('test-node');
            expect(deletedNode).toBeNull();
        });
    });
});
