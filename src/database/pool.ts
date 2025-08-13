/**
 * Database Connection Pool for Knowledge Graph
 * 
 * This module provides connection pooling functionality to manage multiple database connections
 * efficiently, reducing connection overhead and improving performance for concurrent operations.
 */

import { DatabaseConfig, DatabaseConnection } from '../types/base-types'
import { createDatabaseConnection } from './connection'
import { 
  DatabaseOperationError, 
  ConnectionError, 
  errorLogger 
} from './errors'

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  minConnections?: number      // Minimum number of connections to maintain (default: 2)
  maxConnections?: number      // Maximum number of connections allowed (default: 10)
  acquireTimeout?: number      // Timeout for acquiring a connection in ms (default: 30000)
  idleTimeout?: number         // Time before idle connections are closed in ms (default: 300000)
  validateConnection?: boolean // Whether to validate connections before use (default: true)
  retryAttempts?: number      // Number of retry attempts for failed connections (default: 3)
  retryDelay?: number         // Delay between retry attempts in ms (default: 1000)
}

/**
 * Connection wrapper with metadata
 */
interface PooledConnection {
  connection: DatabaseConnection
  id: string
  createdAt: Date
  lastUsed: Date
  inUse: boolean
  isValid: boolean
}

/**
 * Connection pool statistics
 */
export interface PoolStats {
  totalConnections: number
  availableConnections: number
  busyConnections: number
  pendingAcquires: number
  totalAcquired: number
  totalReleased: number
  totalCreated: number
  totalDestroyed: number
  averageAcquireTime: number
  errors: number
}

/**
 * Database connection pool class
 */
export class DatabasePool {
  private config: Required<PoolConfig>
  private dbConfig: DatabaseConfig
  private connections: Map<string, PooledConnection> = new Map()
  private availableConnections: string[] = []
  private pendingAcquires: Array<{
    resolve: (connection: DatabaseConnection) => void
    reject: (error: Error) => void
    timestamp: number
  }> = []
  
  private stats: PoolStats = {
    totalConnections: 0,
    availableConnections: 0,
    busyConnections: 0,
    pendingAcquires: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    totalDestroyed: 0,
    averageAcquireTime: 0,
    errors: 0
  }
  
  private acquireTimes: number[] = []
  private isShuttingDown = false
  private idleCheckInterval?: NodeJS.Timeout

  constructor(dbConfig: DatabaseConfig, poolConfig: PoolConfig = {}) {
    this.dbConfig = dbConfig
    this.config = {
      minConnections: poolConfig.minConnections ?? 2,
      maxConnections: poolConfig.maxConnections ?? 10,
      acquireTimeout: poolConfig.acquireTimeout ?? 30000,
      idleTimeout: poolConfig.idleTimeout ?? 300000, // 5 minutes
      validateConnection: poolConfig.validateConnection ?? true,
      retryAttempts: poolConfig.retryAttempts ?? 3,
      retryDelay: poolConfig.retryDelay ?? 1000
    }

    // Validate configuration
    if (this.config.minConnections < 0) {
      throw new DatabaseOperationError('minConnections must be >= 0')
    }
    if (this.config.maxConnections < this.config.minConnections) {
      throw new DatabaseOperationError('maxConnections must be >= minConnections')
    }

    errorLogger.info('Database pool created', {
      minConnections: this.config.minConnections,
      maxConnections: this.config.maxConnections,
      dbType: this.dbConfig.type
    })
  }

  /**
   * Initialize the connection pool
   */
  async initialize(): Promise<void> {
    try {
      errorLogger.info('Initializing database connection pool')
      
      // Create minimum number of connections
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection()
      }

      // Start idle connection cleanup
      this.startIdleConnectionCleanup()
      
      errorLogger.info(`Database pool initialized with ${this.connections.size} connections`)
      
    } catch (error) {
      errorLogger.error('Failed to initialize database pool', error)
      throw new ConnectionError('Pool initialization failed', this.dbConfig, error)
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<DatabaseConnection> {
    if (this.isShuttingDown) {
      throw new DatabaseOperationError('Pool is shutting down')
    }

    const startTime = Date.now()

    try {
      // Try to get an available connection immediately
      const connectionId = this.availableConnections.pop()
      if (connectionId) {
        const pooledConn = this.connections.get(connectionId)
        if (pooledConn && await this.validateConnectionIfNeeded(pooledConn)) {
          return this.markConnectionInUse(pooledConn, startTime)
        }
      }

      // No available connection, try to create a new one
      if (this.connections.size < this.config.maxConnections) {
        const pooledConn = await this.createConnection()
        return this.markConnectionInUse(pooledConn, startTime)
      }

      // Pool is at capacity, wait for a connection to become available
      return await this.waitForConnection(startTime)

    } catch (error) {
      this.stats.errors++
      errorLogger.error('Failed to acquire connection from pool', error)
      throw error
    }
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: DatabaseConnection): Promise<void> {
    try {
      // Find the pooled connection
      let pooledConn: PooledConnection | undefined
      for (const conn of this.connections.values()) {
        if (conn.connection === connection) {
          pooledConn = conn
          break
        }
      }

      if (!pooledConn) {
        errorLogger.warn('Attempted to release unknown connection')
        return
      }

      if (!pooledConn.inUse) {
        errorLogger.warn('Attempted to release connection that was not in use', { id: pooledConn.id })
        return
      }

      // Mark as available
      pooledConn.inUse = false
      pooledConn.lastUsed = new Date()
      this.availableConnections.push(pooledConn.id)
      this.stats.totalReleased++
      this.updateStats()

      // Process pending acquires
      this.processPendingAcquires()

      errorLogger.debug('Connection released to pool', { id: pooledConn.id })

    } catch (error) {
      this.stats.errors++
      errorLogger.error('Failed to release connection to pool', error)
      throw new DatabaseOperationError('Failed to release connection', error)
    }
  }

  /**
   * Execute a function with an automatically managed connection
   */
  async withConnection<T>(fn: (connection: DatabaseConnection) => Promise<T>): Promise<T> {
    const connection = await this.acquire()
    try {
      return await fn(connection)
    } finally {
      await this.release(connection)
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    this.updateStats()
    return { ...this.stats }
  }

  /**
   * Shutdown the pool and close all connections
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    this.isShuttingDown = true
    errorLogger.info('Shutting down database connection pool')

    // Stop idle connection cleanup
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval)
    }

    // Reject all pending acquires
    for (const pending of this.pendingAcquires) {
      pending.reject(new DatabaseOperationError('Pool is shutting down'))
    }
    this.pendingAcquires.length = 0

    // Close all connections
    const closePromises: Promise<void>[] = []
    for (const pooledConn of this.connections.values()) {
      closePromises.push(this.destroyConnection(pooledConn))
    }

    await Promise.allSettled(closePromises)
    this.connections.clear()
    this.availableConnections.length = 0

    errorLogger.info('Database connection pool shutdown complete')
  }

  /**
   * Create a new connection and add it to the pool
   */
  private async createConnection(): Promise<PooledConnection> {
    try {
      const connection = await createDatabaseConnection(this.dbConfig)
      const id = this.generateConnectionId()
      
      const pooledConn: PooledConnection = {
        connection,
        id,
        createdAt: new Date(),
        lastUsed: new Date(),
        inUse: false,
        isValid: true
      }

      this.connections.set(id, pooledConn)
      this.availableConnections.push(id)
      this.stats.totalCreated++
      this.updateStats()

      errorLogger.debug('New connection created for pool', { id })
      return pooledConn

    } catch (error) {
      this.stats.errors++
      throw new ConnectionError('Failed to create pooled connection', this.dbConfig, error)
    }
  }

  /**
   * Destroy a connection and remove it from the pool
   */
  private async destroyConnection(pooledConn: PooledConnection): Promise<void> {
    try {
      await pooledConn.connection.close()
      this.connections.delete(pooledConn.id)
      
      // Remove from available connections if present
      const index = this.availableConnections.indexOf(pooledConn.id)
      if (index !== -1) {
        this.availableConnections.splice(index, 1)
      }

      this.stats.totalDestroyed++
      this.updateStats()

      errorLogger.debug('Connection destroyed', { id: pooledConn.id })

    } catch (error) {
      errorLogger.error('Failed to destroy connection', error, { id: pooledConn.id })
    }
  }

  /**
   * Validate a connection if validation is enabled
   */
  private async validateConnectionIfNeeded(pooledConn: PooledConnection): Promise<boolean> {
    if (!this.config.validateConnection) {
      return true
    }

    try {
      await pooledConn.connection.get('SELECT 1')
      pooledConn.isValid = true
      return true
    } catch (error) {
      errorLogger.warn('Connection validation failed', { id: pooledConn.id, error: error.message })
      pooledConn.isValid = false
      
      // Remove invalid connection from pool
      await this.destroyConnection(pooledConn)
      return false
    }
  }

  /**
   * Mark a connection as in use and update statistics
   */
  private markConnectionInUse(pooledConn: PooledConnection, startTime: number): DatabaseConnection {
    pooledConn.inUse = true
    pooledConn.lastUsed = new Date()
    
    const acquireTime = Date.now() - startTime
    this.acquireTimes.push(acquireTime)
    if (this.acquireTimes.length > 100) {
      this.acquireTimes.shift() // Keep only last 100 measurements
    }
    
    this.stats.totalAcquired++
    this.updateStats()

    errorLogger.debug('Connection acquired from pool', { 
      id: pooledConn.id, 
      acquireTime: acquireTime + 'ms' 
    })

    return pooledConn.connection
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(startTime: number): Promise<DatabaseConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from pending list
        const index = this.pendingAcquires.findIndex(p => p.resolve === resolve)
        if (index !== -1) {
          this.pendingAcquires.splice(index, 1)
        }
        
        this.stats.errors++
        reject(new DatabaseOperationError(
          `Connection acquire timeout after ${this.config.acquireTimeout}ms`
        ))
      }, this.config.acquireTimeout)

      this.pendingAcquires.push({
        resolve: (connection) => {
          clearTimeout(timeout)
          resolve(connection)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
        timestamp: startTime
      })

      this.updateStats()
    })
  }

  /**
   * Process pending connection acquire requests
   */
  private async processPendingAcquires(): Promise<void> {
    while (this.pendingAcquires.length > 0 && this.availableConnections.length > 0) {
      const pending = this.pendingAcquires.shift()!
      const connectionId = this.availableConnections.pop()!
      const pooledConn = this.connections.get(connectionId)!

      if (await this.validateConnectionIfNeeded(pooledConn)) {
        const connection = this.markConnectionInUse(pooledConn, pending.timestamp)
        pending.resolve(connection)
      } else {
        // Connection was invalid, try next one or create new one
        if (this.connections.size < this.config.maxConnections) {
          try {
            const newPooledConn = await this.createConnection()
            const connection = this.markConnectionInUse(newPooledConn, pending.timestamp)
            pending.resolve(connection)
          } catch (error) {
            pending.reject(error)
          }
        } else {
          // Put the request back and try again later
          this.pendingAcquires.unshift(pending)
          break
        }
      }
    }
  }

  /**
   * Start periodic cleanup of idle connections
   */
  private startIdleConnectionCleanup(): void {
    this.idleCheckInterval = setInterval(() => {
      this.cleanupIdleConnections()
    }, 60000) // Check every minute
  }

  /**
   * Clean up idle connections that exceed the idle timeout
   */
  private async cleanupIdleConnections(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    const now = Date.now()
    const connectionsToDestroy: PooledConnection[] = []

    for (const pooledConn of this.connections.values()) {
      if (!pooledConn.inUse && 
          this.connections.size > this.config.minConnections &&
          now - pooledConn.lastUsed.getTime() > this.config.idleTimeout) {
        connectionsToDestroy.push(pooledConn)
      }
    }

    for (const pooledConn of connectionsToDestroy) {
      await this.destroyConnection(pooledConn)
      errorLogger.debug('Idle connection cleaned up', { id: pooledConn.id })
    }

    if (connectionsToDestroy.length > 0) {
      errorLogger.info(`Cleaned up ${connectionsToDestroy.length} idle connections`)
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    this.stats.totalConnections = this.connections.size
    this.stats.availableConnections = this.availableConnections.length
    this.stats.busyConnections = this.connections.size - this.availableConnections.length
    this.stats.pendingAcquires = this.pendingAcquires.length
    
    if (this.acquireTimes.length > 0) {
      this.stats.averageAcquireTime = this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length
    }
  }

  /**
   * Generate a unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
