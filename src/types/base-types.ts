/**
 * Represents a node in the knowledge graph.
 * Contains all properties for an entity, including ID, label, type, and any custom attributes.
 */
export interface Node {
  id: string;
  label?: string;
  type?: string;
  [key: string]: any;
}
/**
 * Base Graph Types for Knowledge Graph Database
 * 
 * These are the fundamental types that any knowledge graph implementation needs.
 * Perfect for integration with external systems like Groq-CLI.
 */
/**
 * Represents a database connection to the underlying SQLite database.
 * @property exec Execute a SQL query and return results. Use for direct database access.
 * @property close Close the database connection and release resources.
 * @property transaction Run a transaction with a callback. Ensures atomic operations.
 */
export interface DatabaseConnection {
  /**
   * Executes a SQL statement (INSERT, UPDATE, DELETE, etc.) with optional parameters.
   * Returns a result object with metadata (e.g., changes, lastID).
   * @param sql SQL statement to execute.
   * @param params Optional parameters for the SQL statement.
   */
  run(sql: string, params?: any[]): Promise<any>;

  /**
   * Executes a SQL SELECT statement and returns the first row of the result set (or null if none).
   * Use this for queries where you expect a single result.
   * @param sql SQL SELECT statement.
   * @param params Optional parameters for the SQL statement.
   */
  get(sql: string, params?: any[]): Promise<any>;

  /**
   * Executes a SQL SELECT statement and returns all rows as an array.
   * Use this for queries where you expect multiple results.
   * @param sql SQL SELECT statement.
   * @param params Optional parameters for the SQL statement.
   */
  all(sql: string, params?: any[]): Promise<any[]>;

  /**
   * Executes a SQL statement that does not return results (e.g., schema creation).
   * Use this for DDL statements like CREATE TABLE.
   * @param sql SQL statement to execute.
   */
  exec(sql: string): Promise<void>;

  /**
   * Closes the database connection and releases resources.
   * Always call this when you are done with the database.
   */
  close(): Promise<void>;
}
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
 * Database configuration interface for SQLite.
 * @property type 'memory' for in-memory DB, 'file' for persistent DB.
 * @property filename Path to the SQLite file (if type is 'file').
 * @property readonly Open the database in read-only mode (default: false).
 * @property timeout Connection timeout in milliseconds.
 * @property pragmas SQLite PRAGMA options for advanced configuration:
 *   - journal_mode: Controls transaction journaling ('delete', 'truncate', 'persist', 'memory', 'wal', 'off').
 *   - busy_timeout: Milliseconds to wait if the database is locked.
 *   - synchronous: Controls how often data is flushed to disk ('off', 'normal', 'full', 'extra').
 *   - foreign_keys: Enable/disable foreign key enforcement ('on', 'off').
 */
export interface DatabaseConfig {
  /** 'memory' for in-memory DB, 'file' for persistent DB. */
  type: 'memory' | 'file';
  /** Path to the SQLite file (if type is 'file'). */
  filename?: string;
  /** Open the database in read-only mode (default: false). */
  readonly?: boolean;
  /** Connection timeout in milliseconds. */
  timeout?: number;
  /**
   * SQLite PRAGMA options for advanced configuration:
   * - journal_mode: Controls transaction journaling ('delete', 'truncate', 'persist', 'memory', 'wal', 'off').
   * - busy_timeout: Milliseconds to wait if the database is locked.
   * - synchronous: Controls how often data is flushed to disk ('off', 'normal', 'full', 'extra').
   * - foreign_keys: Enable/disable foreign key enforcement ('on', 'off').
   */
  pragmas?: {
    /** Transaction journaling mode. Common values: 'delete', 'truncate', 'persist', 'memory', 'wal', 'off'. */
    journal_mode?: string;
    /** Milliseconds to wait if the database is locked. */
    busy_timeout?: number;
    /** How often data is flushed to disk. Common values: 'off', 'normal', 'full', 'extra'. */
    synchronous?: string;
    /** Enable/disable foreign key enforcement. 'on' or 'off'. */
    foreign_keys?: string;
  };
}

// DatabaseConnection interface is defined above with JSDoc comments for all keys.

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
