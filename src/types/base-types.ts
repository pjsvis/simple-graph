/**
 * Base Graph Types for Knowledge Graph Database
 * 
 * These are the fundamental types that any knowledge graph implementation needs.
 * Perfect for integration with external systems like Groq-CLI.
 */

/**
 * Base node interface - represents any entity in the knowledge graph
 */
export interface Node {
  id: string;                    // Unique identifier for the node
  [key: string]: any;           // Flexible properties for different node types
}

/**
 * Base edge interface - represents relationships between nodes
 */
export interface Edge {
  source: string;               // Source node ID
  target: string;               // Target node ID
  properties?: {                // Optional edge properties
    type?: string;              // Relationship type (e.g., 'references', 'supports')
    context?: string;           // Context where this relationship was found
    weight?: number;            // Relationship strength/weight
    [key: string]: any;         // Additional properties
  };
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  type: 'memory' | 'file';
  filename?: string;
  readonly?: boolean;
  timeout?: number;
  pragmas?: {
    journal_mode?: string;
    busy_timeout?: number;
    synchronous?: string;
    foreign_keys?: string;
  };
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  run(sql: string, params?: any[]): Promise<any>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

/**
 * Query result types
 */
export interface QueryResult {
  changes?: number;
  lastID?: number;
}

/**
 * Graph traversal options
 */
export interface TraversalOptions {
  maxDepth?: number;
  direction?: 'outgoing' | 'incoming' | 'both';
  edgeTypes?: string[];
  nodeTypes?: string[];
}

/**
 * Graph statistics
 */
export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  nodeTypes: Record<string, number>;
  edgeTypes: Record<string, number>;
}

/**
 * Batch operation options
 */
export interface BatchOptions {
  chunkSize?: number;           // Number of items to process per chunk (default: 1000)
  continueOnError?: boolean;    // Whether to continue processing on individual failures (default: false)
  useTransaction?: boolean;     // Whether to wrap operations in a transaction (default: true)
  timeout?: number;            // Timeout for the entire batch operation in milliseconds
}

/**
 * Batch operation result
 */
export interface BatchResult {
  successful: number;          // Number of successful operations
  failed: number;             // Number of failed operations
  total: number;              // Total number of operations attempted
  errors: Array<{             // Details of failed operations
    index: number;            // Index of the failed item in the original array
    error: string;            // Error message
    item?: any;               // The item that failed (optional, for debugging)
  }>;
  duration: number;           // Total execution time in milliseconds
  chunksProcessed: number;    // Number of chunks processed
}

