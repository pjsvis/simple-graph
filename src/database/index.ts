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
