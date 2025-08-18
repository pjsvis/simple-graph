import { DatabaseConnection, Node, GraphStats } from '../types/base-types';
import { NodeManager } from './NodeManager';
import { EdgeManager } from './EdgeManager';

export interface TraverseOptions {
    startNodeId: string;
    maxDepth?: number;
    direction?: 'incoming' | 'outgoing' | 'both';
}

export class QueryManager {
    private nodes: NodeManager;
    private edges: EdgeManager;

    constructor(private connection: DatabaseConnection) {
        this.nodes = new NodeManager(connection);
        this.edges = new EdgeManager(connection);
    }

    public async raw(sql: string, params?: any[]): Promise<any[]> {
        // Basic protection against write operations
        if (!sql.trim().toUpperCase().startsWith('SELECT')) {
            throw new Error('Only SELECT queries are allowed for raw reads.');
        }
        return this.connection.all(sql, params);
    }

    public async run(sql: string, params?: any[]): Promise<any> {
        return this.connection.run(sql, params);
    }

    public async stats(): Promise<GraphStats> {
        const [nodeCount, edgeCount, nodeTypes, edgeTypes] = await Promise.all([
            this.connection.get('SELECT COUNT(*) as count FROM nodes'),
            this.connection.get('SELECT COUNT(*) as count FROM edges'),
            this.connection.all("SELECT json_extract(body, '$.type') as type, COUNT(*) as count FROM nodes GROUP BY type"),
            this.connection.all("SELECT json_extract(properties, '$.type') as type, COUNT(*) as count FROM edges GROUP BY type")
        ]);

        return {
            nodeCount: nodeCount.count,
            edgeCount: edgeCount.count,
            nodeTypes: Object.fromEntries(nodeTypes.map(row => [row.type || 'unknown', row.count])),
            edgeTypes: Object.fromEntries(edgeTypes.map(row => [row.type || 'unknown', row.count]))
        };
    }

    public async traverse(options: TraverseOptions): Promise<Node[]> {
        const { startNodeId, maxDepth = 3, direction = 'outgoing' } = options;
        const visited = new Set<string>();
        const result: Node[] = [];

        const traverse = async (nodeId: string, depth: number) => {
            if (depth > maxDepth || visited.has(nodeId)) return;

            visited.add(nodeId);
            const node = await this.nodes.get(nodeId);
            if (node) result.push(node);

            const edges = await this.edges.forNode(nodeId, direction);

            for (const edge of edges) {
                const nextNodeId = direction === 'incoming' ? edge.source : edge.target;
                if (!visited.has(nextNodeId)) {
                    await traverse(nextNodeId, depth + 1);
                }
            }
        }

        await traverse(startNodeId, 0);
        return result;
    }

    public async getRelationshipStats(): Promise<any[]> {
      const query = `
        SELECT
          json_extract(properties, '$.type') as relationship_type,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM edges
            WHERE json_extract(properties, '$.type') NOT IN ('belongs_to_cda')
          ), 2) as percentage
        FROM edges
        WHERE json_extract(properties, '$.type') NOT IN ('belongs_to_cda')
        GROUP BY json_extract(properties, '$.type')
        ORDER BY count DESC
      `;
      return this.raw(query);
    }

    public async getConnectivityStats(limit: number = 15): Promise<any[]> {
      const query = `
        SELECT
          json_extract(n.body, '$.directive_id') as directive_id,
          json_extract(n.body, '$.category') as category,
          COUNT(DISTINCT e_out.target) as outgoing_refs,
          COUNT(DISTINCT e_in.source) as incoming_refs,
          COUNT(DISTINCT e_out.target) + COUNT(DISTINCT e_in.source) as total_connections
        FROM nodes n
        LEFT JOIN edges e_out ON n.id = e_out.source
          AND json_extract(e_out.properties, '$.type') NOT IN ('belongs_to_cda')
        LEFT JOIN edges e_in ON n.id = e_in.target
          AND json_extract(e_in.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY n.id
        ORDER BY total_connections DESC
        LIMIT ?
      `;
      return this.raw(query, [limit]);
    }

    public async getIntraCategoryConnections(): Promise<any[]> {
      const query = `
        SELECT
          json_extract(s.body, '$.category') as source_category,
          json_extract(t.body, '$.category') as target_category,
          COUNT(*) as connection_count
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.node_type') = 'directive'
          AND json_extract(s.body, '$.category') = json_extract(t.body, '$.category')
        GROUP BY source_category, target_category
        ORDER BY connection_count DESC
      `;
      return this.raw(query);
    }

    public async getHubDirectives(limit: number = 10): Promise<any[]> {
      const query = `
        SELECT
          json_extract(n.body, '$.directive_id') as directive_id,
          json_extract(n.body, '$.title') as title,
          json_extract(n.body, '$.category') as category,
          COUNT(e.source) as incoming_references,
          LENGTH(json_extract(n.body, '$.description')) as description_length
        FROM nodes n
        LEFT JOIN edges e ON n.id = e.target
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY n.id
        HAVING incoming_references > 0
        ORDER BY incoming_references DESC, description_length DESC
        LIMIT ?
      `;
      return this.raw(query, [limit]);
    }

    public async getAuthorityDirectives(limit: number = 10): Promise<any[]> {
      const query = `
        SELECT
          json_extract(n.body, '$.directive_id') as directive_id,
          json_extract(n.body, '$.title') as title,
          json_extract(n.body, '$.category') as category,
          COUNT(e.target) as outgoing_references
        FROM nodes n
        LEFT JOIN edges e ON n.id = e.source
          AND json_extract(e.properties, '$.type') NOT IN ('belongs_to_cda')
        WHERE json_extract(n.body, '$.node_type') = 'directive'
        GROUP BY n.id
        HAVING outgoing_references > 0
        ORDER BY outgoing_references DESC
        LIMIT ?
      `;
      return this.raw(query, [limit]);
    }

    public async getBridgeDirectives(limit: number = 10): Promise<any[]> {
      const query = `
        SELECT 
          json_extract(s.body, '$.directive_id') as directive_id,
          json_extract(s.body, '$.title') as title,
          json_extract(s.body, '$.category') as source_category,
          COUNT(DISTINCT json_extract(t.body, '$.category')) as categories_referenced
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE json_extract(s.body, '$.node_type') = 'directive'
          AND json_extract(t.body, '$.node_type') = 'directive'
          AND json_extract(s.body, '$.category') != json_extract(t.body, '$.category')
        GROUP BY s.id
        ORDER BY categories_referenced DESC
        LIMIT ?
      `;
      return this.raw(query, [limit]);
    }

    public async getDanglingEdges(): Promise<any[]> {
      const query = `
        SELECT source, target, properties
        FROM edges e
        WHERE NOT EXISTS (
          SELECT 1 FROM nodes n WHERE n.id = e.source
        ) OR NOT EXISTS (
          SELECT 1 FROM nodes n WHERE n.id = e.target
        )
      `;
      return this.raw(query);
    }

    public async validateNodeIdsByPattern(nodeType: string, idPatterns: string[]): Promise<{ id: string; isValid: boolean }[]> {
      const query = `
        SELECT json_extract(body, '$.id') as id
        FROM nodes
        WHERE json_extract(body, '$.node_type') = ?
      `;
      const results = await this.raw(query, [nodeType]);

      return results.map((row: any) => ({
        id: row.id,
        isValid: idPatterns.some(pattern => new RegExp(pattern).test(row.id))
      }));
    }
}