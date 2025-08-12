/**
 * Knowledge Graph Database Module
 * 
 * This is the main entry point for the database functionality.
 * Perfect for integration with external systems like Groq-CLI.
 * 
 * GROQ-CLI INTEGRATION GUIDE:
 * ===========================
 * 
 * To integrate this database module with Groq-CLI, copy these files:
 * 
 * REQUIRED FILES:
 * - src/types/base-types.ts       (Core type definitions)
 * - src/database/connection.ts    (Database connection logic)
 * - src/database/schema.ts        (Database schema)
 * - src/database/insert-node.ts   (Node insertion)
 * - src/database/insert-edge.ts   (Edge insertion)
 * - src/database/operations.ts    (High-level operations)
 * - src/database/index.ts         (This file - main exports)
 * 
 * DEPENDENCIES:
 * - sqlite3 (npm install sqlite3)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { createKnowledgeGraph, insertNode, insertEdge } from './database'
 * 
 * const kg = await createKnowledgeGraph('my-graph.db')
 * await kg.insertNode({ id: 'node1', type: 'concept', name: 'Example' })
 * await kg.insertEdge({ source: 'node1', target: 'node2', properties: { type: 'relates_to' } })
 * ```
 */

// Core types
export type { 
  Node, 
  Edge, 
  DatabaseConfig, 
  DatabaseConnection, 
  GraphStats,
  TraversalOptions 
} from '../types/base-types'

// Connection management
export {
  createDatabaseConnection,
  connectToTheLoom,
  connectToTestDatabase,
  createMemoryDatabase,
  testConnection,
  getDatabaseStats,
  DEFAULT_DB_CONFIG
} from './connection'

// Schema management
export { createSchema } from './schema'

// Low-level insert operations
export {
  insertNode as insertNodeSQL,
  insertNodeFromObject,
  getInsertNodeParams
} from './insert-node'

export {
  insertEdge as insertEdgeSQL,
  insertEdgeFromObject,
  getInsertEdgeParams
} from './insert-edge'

// High-level operations
export {
  initializeDatabase,
  insertNode,
  insertEdge,
  getNodeById,
  getNodesByType,
  getEdgesForNode,
  searchNodes,
  getGraphStats,
  traverseGraph,
  batchInsertNodes,
  batchInsertEdges
} from './operations'

/**
 * Knowledge Graph class - High-level interface for graph operations
 * 
 * This provides a convenient object-oriented interface for working with
 * the knowledge graph. Perfect for Groq-CLI integration.
 */
export class KnowledgeGraph {
  private connection: DatabaseConnection

  constructor(connection: DatabaseConnection) {
    this.connection = connection
  }

  /**
   * Initialize the database schema
   */
  async initialize(): Promise<void> {
    const { initializeDatabase } = await import('./operations')
    return initializeDatabase(this.connection)
  }

  /**
   * Insert a node
   */
  async insertNode(node: Node): Promise<any> {
    const { insertNode } = await import('./operations')
    return insertNode(this.connection, node)
  }

  /**
   * Insert an edge
   */
  async insertEdge(edge: Edge): Promise<any> {
    const { insertEdge } = await import('./operations')
    return insertEdge(this.connection, edge)
  }

  /**
   * Get a node by ID
   */
  async getNode(nodeId: string): Promise<Node | null> {
    const { getNodeById } = await import('./operations')
    return getNodeById(this.connection, nodeId)
  }

  /**
   * Search nodes
   */
  async search(searchTerm: string, fields?: string[]): Promise<Node[]> {
    const { searchNodes } = await import('./operations')
    return searchNodes(this.connection, searchTerm, fields)
  }

  /**
   * Get graph statistics
   */
  async getStats(): Promise<GraphStats> {
    const { getGraphStats } = await import('./operations')
    return getGraphStats(this.connection)
  }

  /**
   * Traverse the graph
   */
  async traverse(startNodeId: string, maxDepth?: number, direction?: 'outgoing' | 'incoming' | 'both'): Promise<Node[]> {
    const { traverseGraph } = await import('./operations')
    return traverseGraph(this.connection, startNodeId, maxDepth, direction)
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    return this.connection.close()
  }

  /**
   * Get the underlying database connection
   */
  getConnection(): DatabaseConnection {
    return this.connection
  }
}

/**
 * Factory function to create a knowledge graph instance
 * 
 * @param dbPath - Path to database file (or ':memory:' for in-memory)
 * @param config - Optional database configuration
 * @returns Promise that resolves to a KnowledgeGraph instance
 */
export async function createKnowledgeGraph(
  dbPath: string = ':memory:',
  config: Partial<DatabaseConfig> = {}
): Promise<KnowledgeGraph> {
  const finalConfig: Partial<DatabaseConfig> = {
    type: dbPath === ':memory:' ? 'memory' : 'file',
    filename: dbPath,
    ...config
  }

  const connection = await createDatabaseConnection(finalConfig)
  const kg = new KnowledgeGraph(connection)
  await kg.initialize()
  
  return kg
}

/**
 * Connect to The Loom knowledge graph
 * 
 * @param dbPath - Path to The Loom database
 * @param readonly - Whether to open in readonly mode
 * @returns Promise that resolves to a KnowledgeGraph instance
 */
export async function connectToLoom(
  dbPath: string = 'data/databases/the-loom-v2.db',
  readonly: boolean = false
): Promise<KnowledgeGraph> {
  const connection = await connectToTheLoom(dbPath, readonly)
  return new KnowledgeGraph(connection)
}
