
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SimpleGraph } from '../../src/SimpleGraph';

describe('Mind Map Generation via SimpleGraph API', () => {
    let graph: SimpleGraph;

    beforeAll(async () => {
        // Connect to a clean in-memory database and add test data
        graph = await SimpleGraph.connect(); // In-memory by default
        await graph.nodes.add({ id: 'nodeA', label: 'Node A' });
        await graph.nodes.add({ id: 'nodeB', label: 'Node B' });
        await graph.edges.add({ source: 'nodeA', target: 'nodeB' });
    });

    afterAll(async () => {
        await graph.close();
    });

    it('should generate a mind map from a real node', async () => {
        // Dynamically select a well-connected node to avoid brittle tests
        const [startNodeResult] = await graph.query.raw(`
            SELECT s.source AS id, n.body
            FROM edges AS s
            JOIN nodes AS n ON s.source = n.id
            GROUP BY s.source
            ORDER BY COUNT(s.source) DESC
            LIMIT 1
        `);
        expect(startNodeResult, 'Test database needs at least one node with edges.').toBeDefined();
        const startNodeId = startNodeResult.id;
        const startNodeLabel = JSON.parse(startNodeResult.body).label;

        // Find a target node connected to the start node
        const [targetNodeResult] = await graph.query.raw(`
            SELECT e.target, n.body
            FROM edges AS e
            JOIN nodes AS n ON e.target = n.id
            WHERE e.source = ?
            LIMIT 1
        `, [startNodeId]);
        expect(targetNodeResult, 'Could not find a target node for the selected start node.').toBeDefined();
        const targetNodeId = targetNodeResult.target;
        const targetNodeLabel = JSON.parse(targetNodeResult.body).label;

        const depth = 1;
        const dot = await graph.visualize.mindMap({ startNodeId, depth });

        // Basic DOT structure validation
        expect(dot).toContain('digraph G {');
        expect(dot).toContain('rankdir="LR"');
        expect(dot).toContain('layout="twopi"');
        expect(dot).toContain('}');

        // Check for the root node's presence
        expect(dot).toContain(`"${startNodeId}" [label="${startNodeLabel}"];`);

        // Check for the connected target node's presence
        expect(dot).toContain(`"${targetNodeId}" [label="${targetNodeLabel}"];`);
        
        // Check for the edge between them
        expect(dot).toContain(`"${startNodeId}" -> "${targetNodeId}";`);
    });

    it('should return an empty graph for a non-existent node', async () => {
        const startNodeId = 'non-existent-node';
        const depth = 2;

        const dot = await graph.visualize.mindMap({ startNodeId, depth });

        // Should just be an empty graph definition
        expect(dot).toContain('digraph G {');
        expect(dot).toContain('}');
        expect(dot).not.toContain('->'); // No edges
        expect(dot).not.toContain('[label='); // No nodes
    });
});
