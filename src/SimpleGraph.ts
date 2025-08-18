import { DatabaseConnection } from './types/base-types';
import { createDatabaseConnection, DEFAULT_DB_CONFIG } from './database/connection';
import { createSchema } from './database/schema';

// Import managers
import { NodeManager } from './api/NodeManager';
import { EdgeManager } from './api/EdgeManager';
import { QueryManager } from './api/QueryManager';
import { VisualizationManager } from './api/VisualizationManager';

/**
 * Main entry point for the SimpleGraph knowledge graph database.
 * Provides access to node, edge, query, and visualization managers.
 * @example
 * const graph = await SimpleGraph.connect();
 * await graph.nodes.add({ id: "A", label: "Node A" });
 * await graph.edges.add({ source: "A", target: "B" });
 * await graph.close();
 */
export interface ConnectOptions {
    /**
     * Path to the database file. If omitted, an in-memory database is used.
     */
    path?: string;
    /**
     * Optional existing database connection.
     */
    db?: DatabaseConnection;
}

/**
 * Represents a graph database instance.
 */
export class SimpleGraph {
    /** Node manager for CRUD operations on nodes. */
    public nodes: NodeManager;
    /** Edge manager for CRUD operations on edges. */
    public edges: EdgeManager;
    /** Query manager for advanced graph queries and stats. */
    public query: QueryManager;
    /** Visualization manager for graph visualizations. */
    public visualize: VisualizationManager;

    /**
     * The underlying database connection used by all managers.
     * This object provides low-level access to the SQLite database, allowing queries, transactions, and schema management.
     * It is shared by all managers (nodes, edges, queries, visualization) to ensure consistent state and resource usage.
     * You generally do not need to interact with this directly unless you are extending the API or performing custom SQL operations.
     * @param connection Database connection instance.
     */
    private constructor(private connection: DatabaseConnection) {
        this.nodes = new NodeManager(connection);
        this.edges = new EdgeManager(connection);
        this.query = new QueryManager(connection);
        this.visualize = new VisualizationManager(connection);
    }

    /**
     * Connect to a new or existing graph database.
     * Use this to initialize the graph and access all managers.
     * @param options Connection options (database path or existing connection).
     * @returns A SimpleGraph instance ready for use.
     */
    public static async connect(options: ConnectOptions = {}): Promise<SimpleGraph> {
        let dbConnection: DatabaseConnection;

        if (options.db) {
            dbConnection = options.db;
        } else {
            dbConnection = await createDatabaseConnection({
                type: options.path ? 'file' : 'memory',
                filename: options.path,
            });
            await dbConnection.exec(createSchema()); // Create schema only for new connections
        }
        return new SimpleGraph(dbConnection);
    }

    /**
     * Close the database connection.
     * Call this when you are done with the graph to release resources.
     */
    public async close(): Promise<void> {
        await this.connection.close();
    }
}