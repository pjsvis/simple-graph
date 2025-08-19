/**
 * Database Connection Module for Knowledge Graph
 * 
 * This module provides a standardized interface for connecting to SQLite databases
 * with high-concurrency settings. Perfect for integration with external systems.
 */

import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import { DatabaseConfig, DatabaseConnection } from '../types/base-types'

/**
 * Default high-concurrency database configuration
 */
export const DEFAULT_DB_CONFIG: Required<DatabaseConfig> = {
  type: 'memory',
  filename: ':memory:',
  readonly: false,
  timeout: 5000,
  pragmas: {
    journal_mode: 'WAL',
    busy_timeout: 10000,
    synchronous: 'FULL',
    foreign_keys: 'ON'
  }
}

/**
 * Create a database connection with high-concurrency settings
 * 
 * @param config - Database configuration options
 * @returns Promise that resolves to a DatabaseConnection
 */
export async function createDatabaseConnection(config: Partial<DatabaseConfig> = {}): Promise<DatabaseConnection> {
  const finalConfig = { ...DEFAULT_DB_CONFIG, ...config }
  
  const dbPath = finalConfig.type === 'memory' ? ':memory:' : finalConfig.filename!
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Failed to connect to database: ${err.message}`))
        return
      }

      // Apply high-concurrency PRAGMA settings
      db.serialize(() => {
        if (finalConfig.pragmas.journal_mode) {
          db.run(`PRAGMA journal_mode=${finalConfig.pragmas.journal_mode};`)
        }
        if (finalConfig.pragmas.busy_timeout) {
          db.run(`PRAGMA busy_timeout = ${finalConfig.pragmas.busy_timeout};`)
        }
        if (finalConfig.pragmas.synchronous) {
          db.run(`PRAGMA synchronous = ${finalConfig.pragmas.synchronous};`)
        }
        if (finalConfig.pragmas.foreign_keys) {
          db.run(`PRAGMA foreign_keys = ${finalConfig.pragmas.foreign_keys};`)
        }
      })

      // Create promisified interface
      const connection: DatabaseConnection = {
        run: promisify(db.run.bind(db)),
        get: promisify(db.get.bind(db)),
        all: promisify(db.all.bind(db)),
        exec: promisify(db.exec.bind(db)),
        close: async () => {
          await promisify(db.close.bind(db))()
        }
      }

      resolve(connection)
    })
  })
}

/**
 * Create a connection to the knowledge graph database
 * 
 * @param dbPath - Path to the database file (defaults to the-loom-v2.db)
 * @param readonly - Whether to open in readonly mode
 * @returns Promise that resolves to a DatabaseConnection
 */
export async function connectWithConfig(
  dbPath: string = 'data/databases/the-loom-v2.db',
  readonly: boolean = false
): Promise<DatabaseConnection> {
  return createDatabaseConnection({
    type: 'file',
    filename: dbPath,
    readonly
  })
}

/**
 * Create a test database connection with safe isolation
 * 
 * @param testDbPath - Path to the test database file
 * @returns Promise that resolves to a DatabaseConnection
 */
export async function connectToTestDatabase(
  testDbPath: string = 'data/databases/test-run.db'
): Promise<DatabaseConnection> {
  return createDatabaseConnection({
    type: 'file',
    filename: testDbPath,
    readonly: false
  })
}

/**
 * Create an in-memory database connection for temporary operations
 * 
 * @returns Promise that resolves to a DatabaseConnection
 */
export async function createMemoryDatabase(): Promise<DatabaseConnection> {
  return createDatabaseConnection({
    type: 'memory'
  })
}

/**
 * Utility function to test database connectivity
 * 
 * @param connection - Database connection to test
 * @returns Promise that resolves to true if connection is working
 */
export async function testConnection(connection: DatabaseConnection): Promise<boolean> {
  try {
    await connection.get('SELECT 1 as test')
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get database statistics
 * 
 * @param connection - Database connection
 * @returns Promise that resolves to basic database stats
 */
export async function getDatabaseStats(connection: DatabaseConnection): Promise<{
  nodeCount: number;
  edgeCount: number;
  tableCount: number;
}> {
  const [nodeResult, edgeResult, tableResult] = await Promise.all([
    connection.get('SELECT COUNT(*) as count FROM nodes').catch(() => ({ count: 0 })),
    connection.get('SELECT COUNT(*) as count FROM edges').catch(() => ({ count: 0 })),
    connection.all("SELECT name FROM sqlite_master WHERE type='table'").catch(() => [])
  ])

  return {
    nodeCount: nodeResult.count,
    edgeCount: edgeResult.count,
    tableCount: tableResult.length
  }
}