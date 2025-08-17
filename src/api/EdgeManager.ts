import { DatabaseConnection, Edge } from '../types/base-types';
import { insertEdgeFromObject, getInsertEdgeParams } from '../database/insert-edge';

export class EdgeManager {
    constructor(private connection: DatabaseConnection) {}

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

    public async add(edge: Edge): Promise<any> {
        const sql = insertEdgeFromObject(edge);
        const params = getInsertEdgeParams(edge);
        return this.connection.run(sql, params);
    }

    public async update(source: string, target: string, properties: object): Promise<any> {
        const propertiesJson = JSON.stringify(properties);
        return this.connection.run(
            'UPDATE edges SET properties = ? WHERE source = ? AND target = ?',
            [propertiesJson, source, target]
        );
    }

    public async delete(source: string, target: string): Promise<any> {
        return this.connection.run(
            'DELETE FROM edges WHERE source = ? AND target = ?',
            [source, target]
        );
    }
}