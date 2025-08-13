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
 */
export async function initializeDatabase(connection: DatabaseConnection): Promise<void> {
  const schema = createSchema()
  await connection.exec(schema)
}

/**
 * Insert a node into the database
 * 
 * @param connection - Database connection
 * @param node - Node to insert
 * @returns Promise that resolves to the result
 */
export async function insertNode(connection: DatabaseConnection, node: Node): Promise<any> {
  const sql = insertNodeFromObject(node)
  const params = getInsertNodeParams(node)
  return connection.run(sql, params)
}

/**
 * Insert an edge into the database
 * 
 * @param connection - Database connection
 * @param edge - Edge to insert
 * @returns Promise that resolves to the result
 */
export async function insertEdge(connection: DatabaseConnection, edge: Edge): Promise<any> {
  const sql = insertEdgeFromObject(edge)
  const params = getInsertEdgeParams(edge)
  return connection.run(sql, params)
}

/**
 * Get a node by ID
 * 
 * @param connection - Database connection
 * @param nodeId - Node ID to find
 * @returns Promise that resolves to the node or null
 */
export async function getNodeById(connection: DatabaseConnection, nodeId: string): Promise<Node | null> {
  const result = await connection.get(
    'SELECT body FROM nodes WHERE id = ?',
    [nodeId]
  )
  
  return result ? JSON.parse(result.body) : null
}

/**
 * Get all nodes of a specific type
 * 
 * @param connection - Database connection
 * @param nodeType - Type of nodes to retrieve
 * @returns Promise that resolves to array of nodes
 */
export async function getNodesByType(connection: DatabaseConnection, nodeType: string): Promise<Node[]> {
  const results = await connection.all(
    "SELECT body FROM nodes WHERE json_extract(body, '$.node_type') = ?",
    [nodeType]
  )
  
  return results.map(row => JSON.parse(row.body))
}

/**
 * Get edges for a specific node
 * 
 * @param connection - Database connection
 * @param nodeId - Node ID
 * @param direction - Direction of edges ('outgoing', 'incoming', 'both')
 * @returns Promise that resolves to array of edges
 */
export async function getEdgesForNode(
  connection: DatabaseConnection, 
  nodeId: string, 
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<Edge[]> {
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
  
  const params = direction === 'both' ? [nodeId, nodeId] : [nodeId]
  const results = await connection.all(sql, params)
  
  return results.map(row => ({
    source: row.source,
    target: row.target,
    properties: row.properties ? JSON.parse(row.properties) : {}
  }))
}

/**
 * Search nodes by text content
 * 
 * @param connection - Database connection
 * @param searchTerm - Term to search for
 * @param fields - Fields to search in (defaults to common text fields)
 * @returns Promise that resolves to array of matching nodes
 */
export async function searchNodes(
  connection: DatabaseConnection, 
  searchTerm: string,
  fields: string[] = ['title', 'description', 'term', 'definition']
): Promise<Node[]> {
  const conditions = fields.map(field => 
    `json_extract(body, '$.${field}') LIKE ?`
  ).join(' OR ')
  
  const sql = `SELECT body FROM nodes WHERE ${conditions}`
  const params = fields.map(() => `%${searchTerm}%`)
  
  const results = await connection.all(sql, params)
  return results.map(row => JSON.parse(row.body))
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

