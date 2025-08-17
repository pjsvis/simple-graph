
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateMindMap } from '../../src/visualization/mind-map-generator';
import { createDatabase, type Database } from '../helpers/database';

// This test runs against the static, pre-populated test database.
const DB_FILE = 'cda-import-test.db';

describe('generateMindMap against live test data', () => {
    let db: Database;

    beforeAll(async () => {
        // Connect to the existing test database file
        db = createDatabase({ type: 'file', filename: DB_FILE, cleanup: false });
    });

    afterAll(async () => {
        await db.close();
    });

    // This is a read-only test that runs against the test database.
    // It passes its own database connection to the generator function.
    it('should generate a mind map from a real node', async () => {
        // Dynamically select a well-connected node to avoid brittle tests
        const startNodeResult = await db.get(`
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
        const targetNodeResult = await db.get(`
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
        // Pass the test database connection to the generator
        const dot = await generateMindMap(startNodeId, depth, db);

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

        const dot = await generateMindMap(startNodeId, depth, db);

        // Should just be an empty graph definition
        expect(dot).toContain('digraph G {');
        expect(dot).toContain('}');
        expect(dot).not.toContain('->'); // No edges
        expect(dot).not.toContain('[label='); // No nodes
    });
});
