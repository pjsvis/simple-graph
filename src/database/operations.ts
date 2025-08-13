/**
 * Database Operations Module for Knowledge Graph
 * 
 * This module provides high-level database operations for managing nodes and edges.
 * Designed for easy integration with external systems like Groq-CLI.
 * 
 * Enhanced with comprehensive error handling, input validation, and structured logging.
 */

import { DatabaseConnection, Node, Edge, GraphStats } from '../types/base-types'
import { createSchema } from './schema'
import { insertNodeFromObject, getInsertNodeParams } from './insert-node'
import { insertEdgeFromObject, getInsertEdgeParams } from './insert-edge'
import {
  DatabaseOperationError,
  NodeAlreadyExistsError,
  NodeNotFoundError,
  EdgeAlreadyExistsError,
  InvalidNodeError,
  InvalidEdgeError,
  TransactionError,
  ValidationUtils,
  mapSQLiteError,
  errorLogger
} from './errors'

/**
 * Initialize database with schema
 * 
 * @param connection - Database connection
 * @returns Promise that resolves when schema is created
 * @throws {DatabaseOperationError} When schema creation fails
 */
export async function initializeDatabase(connection: DatabaseConnection): Promise<void> {
  try {
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }

    const schema = createSchema()
    await connection.exec(schema)
    
    errorLogger.info('Database schema initialized successfully')
  } catch (error) {
    const dbError = mapSQLiteError(error)
    errorLogger.error('Failed to initialize database schema', dbError, { schema: 'nodes, edges' })
    throw dbError
  }
}

/**
 * Insert a node into the database
 * 
 * @param connection - Database connection
 * @param node - Node to insert
 * @returns Promise that resolves to the result
 * @throws {InvalidNodeError} When node data is invalid
 * @throws {NodeAlreadyExistsError} When node with same ID already exists
 * @throws {DatabaseOperationError} When database operation fails
 */
export async function insertNode(connection: DatabaseConnection, node: Node): Promise<any> {
  try {
    // Input validation
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }

    const validationErrors = ValidationUtils.validateNode(node)
    if (validationErrors.length > 0) {
      throw new InvalidNodeError(`Node validation failed: ${validationErrors.join(', ')}`, node, { validationErrors })
    }

    const sql = insertNodeFromObject(node)
    const params = getInsertNodeParams(node)
    
    const result = await connection.run(sql, params)
    
    errorLogger.debug(`Node inserted successfully: ${node.id}`, { nodeId: node.id, changes: result.changes })
    return result
    
  } catch (error) {
    if (error instanceof InvalidNodeError) {
      throw error
    }
    
    const dbError = mapSQLiteError(error, { nodeId: node?.id })
    errorLogger.error(`Failed to insert node: ${node?.id}`, dbError, { node })
    throw dbError
  }
}

/**
 * Insert an edge into the database
 * 
 * @param connection - Database connection
 * @param edge - Edge to insert
 * @returns Promise that resolves to the result
 * @throws {InvalidEdgeError} When edge data is invalid
 * @throws {EdgeAlreadyExistsError} When edge already exists
 * @throws {DatabaseOperationError} When database operation fails
 */
export async function insertEdge(connection: DatabaseConnection, edge: Edge): Promise<any> {
  try {
    // Input validation
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }

    const validationErrors = ValidationUtils.validateEdge(edge)
    if (validationErrors.length > 0) {
      throw new InvalidEdgeError(`Edge validation failed: ${validationErrors.join(', ')}`, edge, { validationErrors })
    }

    const sql = insertEdgeFromObject(edge)
    const params = getInsertEdgeParams(edge)
    
    const result = await connection.run(sql, params)
    
    errorLogger.debug(`Edge inserted successfully: ${edge.source} -> ${edge.target}`, { 
      source: edge.source, 
      target: edge.target, 
      changes: result.changes 
    })
    return result
    
  } catch (error) {
    if (error instanceof InvalidEdgeError) {
      throw error
    }
    
    const dbError = mapSQLiteError(error, { source: edge?.source, target: edge?.target })
    errorLogger.error(`Failed to insert edge: ${edge?.source} -> ${edge?.target}`, dbError, { edge })
    throw dbError
  }
}

/**
 * Get a node by ID
 * 
 * @param connection - Database connection
 * @param nodeId - Node ID to find
 * @returns Promise that resolves to the node or null
 * @throws {DatabaseOperationError} When database operation fails
 */
export async function getNodeById(connection: DatabaseConnection, nodeId: string): Promise<Node | null> {
  try {
    // Input validation
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }
    
    if (!nodeId || typeof nodeId !== 'string' || nodeId.trim().length === 0) {
      throw new DatabaseOperationError('Valid node ID is required')
    }

    const result = await connection.get(
      'SELECT body FROM nodes WHERE id = ?',
      [nodeId.trim()]
    )
    
    if (!result) {
      errorLogger.debug(`Node not found: ${nodeId}`)
      return null
    }

    try {
      const node = JSON.parse(result.body)
      errorLogger.debug(`Node retrieved successfully: ${nodeId}`)
      return node
    } catch (parseError) {
      throw new DatabaseOperationError(`Failed to parse node data for ID: ${nodeId}`, parseError)
    }
    
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      throw error
    }
    
    const dbError = mapSQLiteError(error, { nodeId })
    errorLogger.error(`Failed to get node by ID: ${nodeId}`, dbError)
    throw dbError
  }
}

/**
 * Get all nodes of a specific type
 * 
 * @param connection - Database connection
 * @param nodeType - Type of nodes to retrieve
 * @returns Promise that resolves to array of nodes
 * @throws {DatabaseOperationError} When database operation fails
 */
export async function getNodesByType(connection: DatabaseConnection, nodeType: string): Promise<Node[]> {
  try {
    // Input validation
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }
    
    if (!nodeType || typeof nodeType !== 'string' || nodeType.trim().length === 0) {
      throw new DatabaseOperationError('Valid node type is required')
    }

    const results = await connection.all(
      "SELECT body FROM nodes WHERE json_extract(body, '$.node_type') = ?",
      [nodeType.trim()]
    )
    
    const nodes: Node[] = []
    for (const row of results) {
      try {
        nodes.push(JSON.parse(row.body))
      } catch (parseError) {
        errorLogger.warn(`Failed to parse node data, skipping`, { error: parseError.message, body: row.body })
        continue
      }
    }
    
    errorLogger.debug(`Retrieved ${nodes.length} nodes of type: ${nodeType}`)
    return nodes
    
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      throw error
    }
    
    const dbError = mapSQLiteError(error)
    errorLogger.error(`Failed to get nodes by type: ${nodeType}`, dbError)
    throw dbError
  }
}

/**
 * Get edges for a specific node
 * 
 * @param connection - Database connection
 * @param nodeId - Node ID
 * @param direction - Direction of edges ('outgoing', 'incoming', 'both')
 * @returns Promise that resolves to array of edges
 * @throws {DatabaseOperationError} When database operation fails
 */
export async function getEdgesForNode(
  connection: DatabaseConnection, 
  nodeId: string, 
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<Edge[]> {
  try {
    // Input validation
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }
    
    if (!nodeId || typeof nodeId !== 'string' || nodeId.trim().length === 0) {
      throw new DatabaseOperationError('Valid node ID is required')
    }

    if (!['outgoing', 'incoming', 'both'].includes(direction)) {
      throw new DatabaseOperationError('Direction must be "outgoing", "incoming", or "both"')
    }

    let sql: string
    
    switch (direction) {
      case 'outgoing':
        sql = 'SELECT source, target, properties FROM edges WHERE source = ?'
        break
      case 'incoming':
        sql = 'SELECT source, target, properties FROM edges WHERE target = ?'
        break
      case 'both':
        sql = 'SELECT source, target, properties FROM edges WHERE source = ? OR target = ?'
        break
    }
    
    const params = direction === 'both' ? [nodeId.trim(), nodeId.trim()] : [nodeId.trim()]
    const results = await connection.all(sql, params)
    
    const edges: Edge[] = []
    for (const row of results) {
      try {
        edges.push({
          source: row.source,
          target: row.target,
          properties: row.properties ? JSON.parse(row.properties) : {}
        })
      } catch (parseError) {
        errorLogger.warn(`Failed to parse edge properties, skipping`, { 
          error: parseError.message, 
          source: row.source, 
          target: row.target 
        })
        continue
      }
    }
    
    errorLogger.debug(`Retrieved ${edges.length} edges for node: ${nodeId} (${direction})`)
    return edges
    
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      throw error
    }
    
    const dbError = mapSQLiteError(error)
    errorLogger.error(`Failed to get edges for node: ${nodeId}`, dbError, { direction })
    throw dbError
  }
}

/**
 * Search nodes by text content
 * 
 * @param connection - Database connection
 * @param searchTerm - Term to search for
 * @param fields - Fields to search in (defaults to common text fields)
 * @returns Promise that resolves to array of matching nodes
 * @throws {DatabaseOperationError} When database operation fails
 */
export async function searchNodes(
  connection: DatabaseConnection, 
  searchTerm: string,
  fields: string[] = ['title', 'description', 'term', 'definition']
): Promise<Node[]> {
  try {
    // Input validation
    if (!connection) {
      throw new DatabaseOperationError('Database connection is required')
    }
    
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      throw new DatabaseOperationError('Valid search term is required')
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new DatabaseOperationError('At least one search field is required')
    }

    // Validate field names to prevent SQL injection
    const validFieldPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    for (const field of fields) {
      if (!validFieldPattern.test(field)) {
        throw new DatabaseOperationError(`Invalid field name: ${field}`)
      }
    }

    const conditions = fields.map(field => 
      `json_extract(body, '$.${field}') LIKE ?`
    ).join(' OR ')
    
    const sql = `SELECT body FROM nodes WHERE ${conditions}`
    const params = fields.map(() => `%${searchTerm.trim()}%`)
    
    const results = await connection.all(sql, params)
    
    const nodes: Node[] = []
    for (const row of results) {
      try {
        nodes.push(JSON.parse(row.body))
      } catch (parseError) {
        errorLogger.warn(`Failed to parse node data during search, skipping`, { 
          error: parseError.message, 
          body: row.body 
        })
        continue
      }
    }
    
    errorLogger.debug(`Search found ${nodes.length} nodes for term: ${searchTerm}`, { fields })
    return nodes
    
  } catch (error) {
    if (error instanceof DatabaseOperationError) {
      throw error
    }
    
    const dbError = mapSQLiteError(error)
    errorLogger.error(`Failed to search nodes for term: ${searchTerm}`, dbError, { fields })
    throw dbError
  }
}

/**
 * Get graph statistics
 * 
 * @param connection - Database connection
 * @returns Promise that resolves to graph statistics
 */
export async function getGraphStats(connection: DatabaseConnection): Promise<GraphStats> {
  const [nodeCount, edgeCount, nodeTypes, edgeTypes] = await Promise.all([
    connection.get('SELECT COUNT(*) as count FROM nodes'),
    connection.get('SELECT COUNT(*) as count FROM edges'),
    connection.all("SELECT json_extract(body, '$.node_type') as type, COUNT(*) as count FROM nodes GROUP BY type"),
    connection.all("SELECT json_extract(properties, '$.type') as type, COUNT(*) as count FROM edges GROUP BY type")
  ])

  return {
    nodeCount: nodeCount.count,
    edgeCount: edgeCount.count,
    nodeTypes: Object.fromEntries(nodeTypes.map(row => [row.type || 'unknown', row.count])),
    edgeTypes: Object.fromEntries(edgeTypes.map(row => [row.type || 'unknown', row.count]))
  }
}

/**
 * Execute a graph traversal starting from a node
 * 
 * @param connection - Database connection
 * @param startNodeId - Starting node ID
 * @param maxDepth - Maximum traversal depth
 * @param direction - Direction to traverse
 * @returns Promise that resolves to array of visited nodes
 */
export async function traverseGraph(
  connection: DatabaseConnection,
  startNodeId: string,
  maxDepth: number = 3,
  direction: 'outgoing' | 'incoming' | 'both' = 'outgoing'
): Promise<Node[]> {
  const visited = new Set<string>()
  const result: Node[] = []
  
  async function traverse(nodeId: string, depth: number) {
    if (depth > maxDepth || visited.has(nodeId)) return
    
    visited.add(nodeId)
    const node = await getNodeById(connection, nodeId)
    if (node) result.push(node)
    
    const edges = await getEdgesForNode(connection, nodeId, direction)
    
    for (const edge of edges) {
      const nextNodeId = direction === 'incoming' ? edge.source : edge.target
      if (!visited.has(nextNodeId)) {
        await traverse(nextNodeId, depth + 1)
      }
    }
  }
  
  await traverse(startNodeId, 0)
  return result
}

/**
 * Batch insert nodes
 * 
 * @param connection - Database connection
 * @param nodes - Array of nodes to insert
 * @returns Promise that resolves when all nodes are inserted
 */
export async function batchInsertNodes(connection: DatabaseConnection, nodes: Node[]): Promise<void> {
  for (const node of nodes) {
    await insertNode(connection, node)
  }
}

/**
 * Batch insert edges
 * 
 * @param connection - Database connection
 * @param edges - Array of edges to insert
 * @returns Promise that resolves when all edges are inserted
 */
export async function batchInsertEdges(connection: DatabaseConnection, edges: Edge[]): Promise<void> {
  for (const edge of edges) {
    await insertEdge(connection, edge)
  }
}








