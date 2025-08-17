import { DatabaseConnection } from './types/base-types';
import { createDatabaseConnection, DEFAULT_DB_CONFIG } from './database/connection';
import { createSchema } from './database/schema';

// Import managers
import { NodeManager } from './api/NodeManager';
import { EdgeManager } from './api/EdgeManager';
import { QueryManager } from './api/QueryManager';
import { VisualizationManager } from './api/VisualizationManager';

export interface ConnectOptions {
    path?: string;
}

export class SimpleGraph {
    public nodes: NodeManager;
    public edges: EdgeManager;
    public query: QueryManager;
    public visualize: VisualizationManager;

    private constructor(private connection: DatabaseConnection) {
        this.nodes = new NodeManager(connection);
        this.edges = new EdgeManager(connection);
        this.query = new QueryManager(connection);
        this.visualize = new VisualizationManager(connection);
    }

    public static async connect(options: ConnectOptions = {}): Promise<SimpleGraph> {
        const dbConnection = await createDatabaseConnection({
            type: options.path ? 'file' : 'memory',
            filename: options.path,
        });
        await dbConnection.exec(createSchema());
        return new SimpleGraph(dbConnection);
    }

    public async close(): Promise<void> {
        await this.connection.close();
    }
}