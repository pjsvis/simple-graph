import { DatabaseConnection, Node } from '../types/base-types';
import { insertNodeFromObject, getInsertNodeParams } from '../database/insert-node';

export interface FindNodesQuery {
    label?: string;
    type?: string;
}

export class NodeManager {
    constructor(private connection: DatabaseConnection) {}

    public async get(id: string): Promise<Node | null> {
        const result = await this.connection.get(
            'SELECT body FROM nodes WHERE id = ?',
            [id]
        );
        return result ? JSON.parse(result.body) : null;
    }

    public async add(node: Node): Promise<any> {
        const sql = insertNodeFromObject(node);
        const params = getInsertNodeParams(node);
        return this.connection.run(sql, params);
    }

    public async delete(id: string): Promise<any> {
        if (id === '0') {
            throw new Error('The genesis node cannot be deleted.');
        }
        return this.connection.run('DELETE FROM nodes WHERE id = ?', [id]);
    }

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

    public async search(query: string): Promise<Node[]> {
        const results = await this.connection.all(
            `SELECT n.body
             FROM nodes_fts fts
             JOIN nodes n ON fts.rowid = n.rowid
             WHERE fts.body MATCH ?`,
            [query]
        );
        return results.map((row: any) => JSON.parse(row.body));
    }
}
