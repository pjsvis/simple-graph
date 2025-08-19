import { DatabaseConnection, Edge } from '../types/base-types';
import { insertEdgeFromObject, getInsertEdgeParams } from '../database/insert-edge';

/**
 * Manages CRUD operations for edges in the graph database.
 * Provides methods to get, add, update, and delete edges, as well as query edges for a specific node.
 *
 * Example usage:
 * ```ts
 * const edgeManager = new EdgeManager(connection);
 * await edgeManager.add({ source: 'A', target: 'B', properties: { type: 'references' } });
 * ```
 */
export class Edges {
    /**
     * @param connection Database connection instance.
     */
    constructor(private connection: DatabaseConnection) {}

    /**
     * Get an edge by source and target node IDs.
     * This is the basic way to retrieve a relationship between two nodes.
     * Returns the edge object if found, or null if no such edge exists.
     *
     * Example:
     * ```ts
     * const edge = await edgeManager.get('A', 'B');
     * ```
     * @param source Source node ID.
     * @param target Target node ID.
     * @returns The edge object or null if not found.
     */
    public async get(source: string, target: string): Promise<Edge | null> {
        const row = await this.connection.get(
            'SELECT * FROM edges WHERE source = ? AND target = ?',
            [source, target]
        );
        if (!row) return null;
        return {
            source: row.source,
            target: row.target,
            properties: row.properties ? JSON.parse(row.properties) : {}
        };
    }

    /**
     * Get all edges for a node, optionally filtered by direction.
     * Use this to find all relationships for a node, whether incoming, outgoing, or both.
     *
     * Example:
     * ```ts
     * const edges = await edgeManager.forNode('A', 'outgoing');
     * ```
     * @param id Node ID.
     * @param direction Direction of edges ('incoming', 'outgoing', or 'both').
     * @returns Array of edge objects.
     */
    public async forNode(id: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Promise<Edge[]> {
        let sql: string;
        switch (direction) {
            case 'outgoing':
                sql = 'SELECT * FROM edges WHERE source = ?';
                break;
            case 'incoming':
                sql = 'SELECT * FROM edges WHERE target = ?';
                break;
            case 'both':
            default:
                sql = 'SELECT * FROM edges WHERE source = ? OR target = ?';
                break;
        }
        const params = direction === 'both' ? [id, id] : [id];
        const results = await this.connection.all(sql, params);
        return results.map(row => ({
            source: row.source,
            target: row.target,
            properties: row.properties ? JSON.parse(row.properties) : {}
        }));
    }

    /**
     * Add a new edge to the graph.
     * This creates a relationship between two nodes. If the edge already exists, it may be updated.
     *
     * Example:
     * ```ts
     * await edgeManager.add({ source: 'A', target: 'B', properties: { type: 'references' } });
     * ```
     * @param edge Edge object to add.
     */
    public async add(edge: Edge): Promise<any> {
        const sql = insertEdgeFromObject(edge);
        const params = getInsertEdgeParams(edge);
        return this.connection.run(sql, params);
    }

    /**
     * Update properties of an existing edge.
     * Use this to change metadata or attributes of a relationship between two nodes.
     *
     * Example:
     * ```ts
     * await edgeManager.update('A', 'B', { weight: 2 });
     * ```
     * @param source Source node ID.
     * @param target Target node ID.
     * @param properties Properties to update.
     */
    public async update(source: string, target: string, properties: object): Promise<any> {
        const propertiesJson = JSON.stringify(properties);
        return this.connection.run(
            'UPDATE edges SET properties = ? WHERE source = ? AND target = ?',
            [propertiesJson, source, target]
        );
    }

    /**
     * Delete an edge from the graph.
     * Removes the relationship between two nodes. This does not delete the nodes themselves.
     *
     * Example:
     * ```ts
     * await edgeManager.delete('A', 'B');
     * ```
     * @param source Source node ID.
     * @param target Target node ID.
     */
    public async delete(source: string, target: string): Promise<any> {
        return this.connection.run(
            'DELETE FROM edges WHERE source = ? AND target = ?',
            [source, target]
        );
    }
}