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
