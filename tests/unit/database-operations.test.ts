import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDatabase, type Database } from '../helpers/database';
import { initializeDatabase, getNodeById, deleteNode } from '../../src/database/operations';

describe('Database Operations', () => {
    let db: Database;

    beforeAll(async () => {
        // Create a new in-memory database for each test suite
        db = createDatabase({ type: 'memory' });
        await initializeDatabase(db);
    });

    afterAll(async () => {
        await db.close();
    });

    describe('Genesis Node', () => {
        it('should create the genesis node upon initialization', async () => {
            const genesisNode = await getNodeById(db, '0');
            expect(genesisNode).toBeDefined();
            expect(genesisNode).not.toBeNull();
            expect(genesisNode?.id).toBe('0');
            expect(genesisNode?.label).toBe('System');
            expect(genesisNode?.body).toBe('This is the genesis node, the root of the graph.');
            expect(genesisNode?.createdAt).toBeDefined();
        });

        it('should prevent the genesis node from being deleted', async () => {
            await expect(deleteNode(db, '0')).rejects.toThrow('The genesis node cannot be deleted.');
        });
    });

    describe('deleteNode', () => {
        it('should delete a regular node', async () => {
            // Insert a node to delete
            const node = { id: 'test-node', label: 'Test' };
            const body = JSON.stringify(node);
            await db.run('INSERT INTO nodes (body) VALUES (?)', [body]);

            // Verify it exists
            const insertedNode = await getNodeById(db, 'test-node');
            expect(insertedNode).toBeDefined();

            // Delete it
            await deleteNode(db, 'test-node');

            // Verify it's gone
            const deletedNode = await getNodeById(db, 'test-node');
            expect(deletedNode).toBeNull();
        });
    });
});
