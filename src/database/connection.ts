/**
 * Database Connection Module for Knowledge Graph
 * 
 * This module provides a standardized interface for connecting to SQLite databases
 * with high-concurrency settings and transaction management. Perfect for integration with external systems.
 */

import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import { DatabaseConfig, DatabaseConnection } from '../types/base-types'
import { TransactionError, DatabaseOperationError, errorLogger } from './errors'

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
    busy_timeout: 5000,
    synchronous: 'NORMAL',
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
 * Create a connection to The Loom knowledge graph database
 * 
 * @param dbPath - Path to the database file (defaults to the-loom-v2.db)
 * @param readonly - Whether to open in readonly mode
 * @returns Promise that resolves to a DatabaseConnection
 */
export async function connectToTheLoom(
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

/**
 * Transaction management utilities
 */

/**
 * Execute a function within a database transaction
 * 
 * @param connection - Database connection
 * @param fn - Function to execute within the transaction
 * @returns Promise that resolves to the function result
 * @throws {TransactionError} When transaction fails
 */
export async function withTransaction<T>(
  connection: DatabaseConnection,
  fn: (connection: DatabaseConnection) => Promise<T>
): Promise<T> {
  try {
    errorLogger.debug('Starting database transaction')
    
    // Begin transaction
    await connection.run('BEGIN TRANSACTION')
    
    try {
      // Execute the function within the transaction
      const result = await fn(connection)
      
      // Commit transaction
      await connection.run('COMMIT')
      errorLogger.debug('Transaction committed successfully')
      
      return result
      
    } catch (error) {
      // Rollback transaction on error
      try {
        await connection.run('ROLLBACK')
        errorLogger.debug('Transaction rolled back due to error')
      } catch (rollbackError) {
        errorLogger.error('Failed to rollback transaction', rollbackError)
        throw new TransactionError(
          'Transaction failed and rollback also failed',
          rollbackError,
          { originalError: error.message }
        )
      }
      
      // Re-throw the original error
      if (error instanceof Error) {
        throw new TransactionError(`Transaction failed: ${error.message}`, error)
      } else {
        throw new TransactionError('Transaction failed with unknown error', undefined, { error })
      }
    }
    
  } catch (error) {
    if (error instanceof TransactionError) {
      throw error
    }
    
    errorLogger.error('Failed to start transaction', error)
    throw new TransactionError('Failed to start transaction', error)
  }
}

/**
 * Execute multiple operations within a single transaction
 * 
 * @param connection - Database connection
 * @param operations - Array of operations to execute
 * @returns Promise that resolves to array of results
 * @throws {TransactionError} When transaction fails
 */
export async function withBatchTransaction<T>(
  connection: DatabaseConnection,
  operations: Array<(connection: DatabaseConnection) => Promise<T>>
): Promise<T[]> {
  return withTransaction(connection, async (txConnection) => {
    const results: T[] = []
    
    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i](txConnection)
        results.push(result)
      } catch (error) {
        errorLogger.error(`Batch operation ${i} failed`, error)
        throw error
      }
    }
    
    return results
  })
}

/**
 * Prepared statement interface for batch operations
 */
export interface PreparedStatement {
  run(params: any[]): Promise<any>
  finalize(): Promise<void>
}

/**
 * Create a prepared statement for batch operations
 * 
 * @param connection - Database connection
 * @param sql - SQL statement to prepare
 * @returns Promise that resolves to prepared statement
 */
export async function createPreparedStatement(
  connection: DatabaseConnection,
  sql: string
): Promise<PreparedStatement> {
  try {
    // Note: This is a simplified implementation
    // In a real implementation, we would use the underlying sqlite3 prepare method
    // For now, we'll simulate prepared statements with regular queries
    
    return {
      async run(params: any[]): Promise<any> {
        return connection.run(sql, params)
      },
      
      async finalize(): Promise<void> {
        // In a real implementation, this would finalize the prepared statement
        // For now, this is a no-op
        return Promise.resolve()
      }
    }
    
  } catch (error) {
    throw new DatabaseOperationError(`Failed to create prepared statement: ${sql}`, error)
  }
}

/**
 * Execute a batch operation with prepared statements within a transaction
 * 
 * @param connection - Database connection
 * @param sql - SQL statement to prepare
 * @param paramSets - Array of parameter sets to execute
 * @param options - Batch execution options
 * @returns Promise that resolves to batch results
 */
export async function executeBatchWithPreparedStatement<T = any>(
  connection: DatabaseConnection,
  sql: string,
  paramSets: any[][],
  options: {
    chunkSize?: number
    continueOnError?: boolean
  } = {}
): Promise<{
  successful: number
  failed: number
  results: T[]
  errors: Array<{ index: number; error: string; params: any[] }>
}> {
  const { chunkSize = 1000, continueOnError = false } = options
  
  return withTransaction(connection, async (txConnection) => {
    const results: T[] = []
    const errors: Array<{ index: number; error: string; params: any[] }> = []
    let successful = 0
    let failed = 0
    
    // Process in chunks to avoid memory issues with large batches
    for (let chunkStart = 0; chunkStart < paramSets.length; chunkStart += chunkSize) {
      const chunkEnd = Math.min(chunkStart + chunkSize, paramSets.length)
      const chunk = paramSets.slice(chunkStart, chunkEnd)
      
      errorLogger.debug(`Processing batch chunk ${chunkStart}-${chunkEnd} of ${paramSets.length}`)
      
      const stmt = await createPreparedStatement(txConnection, sql)
      
      try {
        for (let i = 0; i < chunk.length; i++) {
          const globalIndex = chunkStart + i
          const params = chunk[i]
          
          try {
            const result = await stmt.run(params)
            results.push(result)
            successful++
          } catch (error) {
            failed++
            const errorInfo = {
              index: globalIndex,
              error: error.message || 'Unknown error',
              params
            }
            errors.push(errorInfo)
            
            if (!continueOnError) {
              throw new DatabaseOperationError(
                `Batch operation failed at index ${globalIndex}`,
                error,
                { errorInfo }
              )
            }
          }
        }
      } finally {
        await stmt.finalize()
      }
    }
    
    errorLogger.info(`Batch operation completed: ${successful} successful, ${failed} failed`)
    
    return {
      successful,
      failed,
      results,
      errors
    }
  })
}


