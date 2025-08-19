import { DatabaseConnection, Node } from '../types/base-types';
import { insertNodeFromObject, getInsertNodeParams } from '../database/insert-node';
import { searchNodes } from '../database/search';

/**
 * Query object for finding nodes by label or type.
 */
export interface FindNodesQuery {
    /** Node label to search for. */
    label?: string;
    /** Node type to search for. */
    type?: string;
}

/**
 * Manages CRUD operations for nodes in the graph database.
 * Provides methods to get, add, update, delete, and search nodes.
 *
 * Example usage:
 * ```ts
 * const nodes = new NodeManager(connection);
 * await nodes.add({ id: 'A', label: 'Node A', type: 'directive' });
 * ```
 */
export class Nodes {
    /**
     * @param connection Database connection instance.
     */
    constructor(private connection: DatabaseConnection) {}

    /**
     * Get a node by ID.
     * This is the basic way to retrieve an entity from the graph by its unique identifier.
     * Returns the node object if found, or null if no such node exists.
     *
     * Example:
     * ```ts
     * const node = await nodeManager.get('node-123');
     * ```
     * @param id Node ID.
     * @returns The node object or null if not found.
     */
    public async get(id: string): Promise<Node | null> {
        const result = await this.connection.get(
            'SELECT body FROM nodes WHERE id = ?',
            [id]
        );
        return result ? JSON.parse(result.body) : null;
    }

    /**
     * Add a new node to the graph.
     * This creates a new entity in the graph. If the node already exists, it may be updated.
     *
     * Example:
     * ```ts
     * await nodeManager.add({ id: 'A', label: 'Node A', type: 'directive' });
     * ```
     * @param node Node object to add.
     */
    public async add(node: Node): Promise<any> {
        const sql = insertNodeFromObject(node);
        const params = getInsertNodeParams(node);
        return this.connection.run(sql, params);
    }

    /**
     * Delete a node from the graph.
     * Removes the entity from the graph by its ID. This does not delete related edges automatically.
     * Throws an error if you try to delete the genesis node (ID '0').
     *
     * Example:
     * ```ts
     * await nodeManager.delete('node-123');
     * ```
     * @param id Node ID.
     * @throws Error if trying to delete the genesis node.
     */
    public async delete(id: string): Promise<any> {
        if (id === '0') {
            throw new Error('The genesis node cannot be deleted.');
        }
        return this.connection.run('DELETE FROM nodes WHERE id = ?', [id]);
    }

    /**
     * Update properties of an existing node.
     * Use this to change metadata or attributes of an entity in the graph.
     *
     * Example:
     * ```ts
     * await nodeManager.update('node-123', { label: 'Updated Node' });
     * ```
     * @param id Node ID.
     * @param partialNode Partial node object with properties to update.
     */
    public async update(id: string, partialNode: Partial<Node>): Promise<any> {
        if ('id' in partialNode) {
            delete partialNode.id;
        }

        const updateObject = JSON.stringify(partialNode);
        return this.connection.run(
            `UPDATE nodes SET body = json_patch(body, ?) WHERE id = ?`,
            [updateObject, id]
        );
    }

    /**
     * Find nodes by label and/or type.
     * Use this to search for entities in the graph matching specific criteria.
     *
     * Example:
     * ```ts
     * const nodes = await nodeManager.find({ type: 'directive' });
     * ```
     * @param query Query object with label and/or type.
     * @returns Array of node objects.
     */
    public async find(query: FindNodesQuery): Promise<Node[]> {
        let conditions: string[] = [];
        let params: any[] = [];

        if (query.type) {
            conditions.push("json_extract(body, '$.type') = ?");
            params.push(query.type);
        }

        if (query.label) {
            conditions.push("json_extract(body, '$.label') LIKE ?");
            params.push(`%${query.label}%`);
        }

        if (conditions.length === 0) {
            const results = await this.connection.all('SELECT body FROM nodes');
            return results.map(row => JSON.parse(row.body));
        }

        const sql = `SELECT body FROM nodes WHERE ${conditions.join(' AND ')}`;
        const results = await this.connection.all(sql, params);
        return results.map(row => JSON.parse(row.body));
    }

    /**
     * Search nodes using a full-text query.
     * Use this to perform a text search across all entities in the graph.
     *
     * Example:
     * ```ts
     * const results = await nodeManager.search('search term');
     * ```
     * @param query Search query string.
     * @returns Array of node objects matching the query.
     */
    public async search(query: string): Promise<Node[]> {
        const nodeIds = await searchNodes(this.connection, query);
        if (nodeIds.length === 0) return [];

        const nodes = await Promise.all(nodeIds.map(id => this.get(id)));
        return nodes.filter((node): node is Node => node !== null);
    }
}
