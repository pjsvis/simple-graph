/**
 * Database Error Classes for Knowledge Graph
 * 
 * This module provides structured error handling for database operations
 * with specific error types for different failure scenarios.
 */

/**
 * Base class for all database-related errors
 */
export class DatabaseError extends Error {
  public readonly code: string
  public readonly details?: any
  public readonly timestamp: Date

  constructor(message: string, code: string = 'DATABASE_ERROR', details?: any) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.details = details
    this.timestamp = new Date()
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}

/**
 * General database operation error
 */
export class DatabaseOperationError extends DatabaseError {
  constructor(message: string, originalError?: Error, details?: any) {
    super(message, 'DATABASE_OPERATION_ERROR', {
      originalError: originalError?.message,
      originalStack: originalError?.stack,
      ...details
    })
  }
}

/**
 * Database connection related errors
 */
export class ConnectionError extends DatabaseError {
  public readonly connectionDetails: {
    type?: string
    filename?: string
    readonly?: boolean
  }

  constructor(message: string, connectionDetails: any = {}, originalError?: Error) {
    super(message, 'CONNECTION_ERROR', {
      originalError: originalError?.message,
      originalStack: originalError?.stack
    })
    this.connectionDetails = connectionDetails
  }
}

/**
 * Node already exists error (unique constraint violation)
 */
export class NodeAlreadyExistsError extends DatabaseError {
  public readonly nodeId: string

  constructor(nodeId: string, details?: any) {
    super(`Node with ID '${nodeId}' already exists`, 'NODE_ALREADY_EXISTS', details)
    this.nodeId = nodeId
  }
}

/**
 * Node not found error
 */
export class NodeNotFoundError extends DatabaseError {
  public readonly nodeId: string

  constructor(nodeId: string, details?: any) {
    super(`Node with ID '${nodeId}' not found`, 'NODE_NOT_FOUND', details)
    this.nodeId = nodeId
  }
}

/**
 * Edge already exists error (unique constraint violation)
 */
export class EdgeAlreadyExistsError extends DatabaseError {
  public readonly source: string
  public readonly target: string

  constructor(source: string, target: string, details?: any) {
    super(`Edge from '${source}' to '${target}' already exists`, 'EDGE_ALREADY_EXISTS', details)
    this.source = source
    this.target = target
  }
}

/**
 * Invalid node data error
 */
export class InvalidNodeError extends DatabaseError {
  public readonly nodeData: any

  constructor(message: string, nodeData: any, details?: any) {
    super(message, 'INVALID_NODE', details)
    this.nodeData = nodeData
  }
}

/**
 * Invalid edge data error
 */
export class InvalidEdgeError extends DatabaseError {
  public readonly edgeData: any

  constructor(message: string, edgeData: any, details?: any) {
    super(message, 'INVALID_EDGE', details)
    this.edgeData = edgeData
  }
}

/**
 * Transaction error
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, originalError?: Error, details?: any) {
    super(message, 'TRANSACTION_ERROR', {
      originalError: originalError?.message,
      originalStack: originalError?.stack,
      ...details
    })
  }
}

/**
 * Query timeout error
 */
export class QueryTimeoutError extends DatabaseError {
  public readonly timeoutMs: number
  public readonly query: string

  constructor(query: string, timeoutMs: number, details?: any) {
    super(`Query timed out after ${timeoutMs}ms: ${query.substring(0, 100)}...`, 'QUERY_TIMEOUT', details)
    this.timeoutMs = timeoutMs
    this.query = query
  }
}

/**
 * Schema validation error
 */
export class SchemaValidationError extends DatabaseError {
  public readonly validationErrors: string[]

  constructor(validationErrors: string[], details?: any) {
    super(`Schema validation failed: ${validationErrors.join(', ')}`, 'SCHEMA_VALIDATION_ERROR', details)
    this.validationErrors = validationErrors
  }
}

/**
 * Utility function to determine if an error is a SQLite constraint error
 */
export function isSQLiteConstraintError(error: any): boolean {
  return error && (
    error.code === 'SQLITE_CONSTRAINT' ||
    error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
    error.message?.includes('UNIQUE constraint failed') ||
    error.message?.includes('FOREIGN KEY constraint failed')
  )
}

/**
 * Utility function to determine if an error is a SQLite busy error
 */
export function isSQLiteBusyError(error: any): boolean {
  return error && (
    error.code === 'SQLITE_BUSY' ||
    error.message?.includes('database is locked')
  )
}

/**
 * Map SQLite errors to custom error types
 */
export function mapSQLiteError(error: any, context?: { nodeId?: string, source?: string, target?: string }): DatabaseError {
  if (!error) {
    return new DatabaseOperationError('Unknown database error')
  }

  // Handle constraint violations
  if (isSQLiteConstraintError(error)) {
    if (error.message?.includes('nodes.id')) {
      return new NodeAlreadyExistsError(context?.nodeId || 'unknown', { originalError: error.message })
    }
    if (error.message?.includes('edges') && context?.source && context?.target) {
      return new EdgeAlreadyExistsError(context.source, context.target, { originalError: error.message })
    }
    return new DatabaseOperationError(`Constraint violation: ${error.message}`, error)
  }

  // Handle busy/timeout errors
  if (isSQLiteBusyError(error)) {
    return new QueryTimeoutError('Database busy', 5000, { originalError: error.message })
  }

  // Handle connection errors
  if (error.message?.includes('no such file') || error.message?.includes('unable to open')) {
    return new ConnectionError(`Database connection failed: ${error.message}`, {}, error)
  }

  // Default to general operation error
  return new DatabaseOperationError(error.message || 'Database operation failed', error)
}

/**
 * Input validation utilities
 */
export class ValidationUtils {
  /**
   * Validate node data
   */
  static validateNode(node: any): string[] {
    const errors: string[] = []

    if (!node) {
      errors.push('Node cannot be null or undefined')
      return errors
    }

    if (typeof node !== 'object') {
      errors.push('Node must be an object')
      return errors
    }

    if (!node.id) {
      errors.push('Node must have an id property')
    } else if (typeof node.id !== 'string') {
      errors.push('Node id must be a string')
    } else if (node.id.trim().length === 0) {
      errors.push('Node id cannot be empty')
    }

    // Check for circular references in JSON serialization
    try {
      JSON.stringify(node)
    } catch (e) {
      errors.push('Node contains circular references and cannot be serialized')
    }

    return errors
  }

  /**
   * Validate edge data
   */
  static validateEdge(edge: any): string[] {
    const errors: string[] = []

    if (!edge) {
      errors.push('Edge cannot be null or undefined')
      return errors
    }

    if (typeof edge !== 'object') {
      errors.push('Edge must be an object')
      return errors
    }

    if (!edge.source) {
      errors.push('Edge must have a source property')
    } else if (typeof edge.source !== 'string') {
      errors.push('Edge source must be a string')
    } else if (edge.source.trim().length === 0) {
      errors.push('Edge source cannot be empty')
    }

    if (!edge.target) {
      errors.push('Edge must have a target property')
    } else if (typeof edge.target !== 'string') {
      errors.push('Edge target must be a string')
    } else if (edge.target.trim().length === 0) {
      errors.push('Edge target cannot be empty')
    }

    if (edge.source === edge.target) {
      errors.push('Edge source and target cannot be the same (self-loops not allowed)')
    }

    // Validate properties if present
    if (edge.properties !== undefined) {
      if (typeof edge.properties !== 'object' || edge.properties === null) {
        errors.push('Edge properties must be an object')
      } else {
        try {
          JSON.stringify(edge.properties)
        } catch (e) {
          errors.push('Edge properties contain circular references and cannot be serialized')
        }
      }
    }

    return errors
  }

  /**
   * Validate database configuration
   */
  static validateDatabaseConfig(config: any): string[] {
    const errors: string[] = []

    if (!config) {
      errors.push('Database config cannot be null or undefined')
      return errors
    }

    if (typeof config !== 'object') {
      errors.push('Database config must be an object')
      return errors
    }

    if (!config.type) {
      errors.push('Database config must have a type property')
    } else if (!['memory', 'file'].includes(config.type)) {
      errors.push('Database config type must be "memory" or "file"')
    }

    if (config.type === 'file' && !config.filename) {
      errors.push('Database config must have a filename when type is "file"')
    }

    if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout < 0)) {
      errors.push('Database config timeout must be a positive number')
    }

    return errors
  }
}

/**
 * Logger interface for error reporting
 */
export interface ErrorLogger {
  error(message: string, error?: Error, context?: any): void
  warn(message: string, context?: any): void
  info(message: string, context?: any): void
  debug(message: string, context?: any): void
}

/**
 * Default console logger implementation
 */
export class ConsoleErrorLogger implements ErrorLogger {
  error(message: string, error?: Error, context?: any): void {
    console.error(`[ERROR] ${message}`, error ? { error: error.message, stack: error.stack, context } : context)
  }

  warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, context)
  }

  info(message: string, context?: any): void {
    console.info(`[INFO] ${message}`, context)
  }

  debug(message: string, context?: any): void {
    console.debug(`[DEBUG] ${message}`, context)
  }
}

/**
 * Global error logger instance
 */
export let errorLogger: ErrorLogger = new ConsoleErrorLogger()

/**
 * Set custom error logger
 */
export function setErrorLogger(logger: ErrorLogger): void {
  errorLogger = logger
}
