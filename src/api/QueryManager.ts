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
}