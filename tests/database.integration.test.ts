import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDatabase, type Database } from './helpers/database'

// Import our SQL generation functions
import { createSchema } from '../ts/schema'
import { insertNodeFromObject, getInsertNodeParams } from '../ts/insert-node'
import { insertEdgeFromObject, getInsertEdgeParams } from '../ts/insert-edge'
import { updateNodeFromObject, getUpdateNodeParams } from '../ts/update-node'
import { updateEdgeFromObject, getUpdateEdgeParams } from '../ts/update-edge'

import type { Node, Edge } from '../ts/types'

describe('Database Integration Tests', () => {
  let db: Database

  beforeEach(async () => {
    db = createDatabase({ type: 'memory' })
    // Create the schema
    await db.exec(createSchema())
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Schema Creation', () => {
    it('should create tables and indexes successfully', async () => {
      // Check if nodes table exists
      const nodesTable = await db.get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='nodes'
      `)
      expect(nodesTable).toBeDefined()
      expect(nodesTable.name).toBe('nodes')

      // Check if edges table exists
      const edgesTable = await db.get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='edges'
      `)
      expect(edgesTable).toBeDefined()
      expect(edgesTable.name).toBe('edges')

      // Check if indexes exist
      const indexes = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name IN ('id_idx', 'source_idx', 'target_idx')
      `)
      expect(indexes).toHaveLength(3)
    })
  })

  describe('Node Operations', () => {
    it('should insert and retrieve nodes', async () => {
      const node: Node = {
        id: 'test-node-1',
        name: 'Test Node',
        data: 'some test data',
        metadata: { created: '2023-01-01' }
      }

      // Insert node
      const insertSql = insertNodeFromObject(node)
      const insertParams = getInsertNodeParams(node)
      await db.run(insertSql, insertParams)

      // Retrieve node
      const retrievedNode = await db.get('SELECT * FROM nodes WHERE id = ?', ['test-node-1'])
      expect(retrievedNode).toBeDefined()
      expect(retrievedNode.id).toBe('test-node-1')
      
      const parsedBody = JSON.parse(retrievedNode.body)
      expect(parsedBody).toEqual(node)
    })

    it('should update nodes', async () => {
      // Insert initial node
      const originalNode: Node = {
        id: 'update-test',
        name: 'Original Name',
        value: 100
      }
      
      const insertSql = insertNodeFromObject(originalNode)
      const insertParams = getInsertNodeParams(originalNode)
      await db.run(insertSql, insertParams)

      // Update node
      const updatedNode: Node = {
        id: 'update-test',
        name: 'Updated Name',
        value: 200,
        newField: 'added field'
      }

      const updateSql = updateNodeFromObject(updatedNode)
      const updateParams = getUpdateNodeParams(updatedNode)
      await db.run(updateSql, updateParams)

      // Verify update
      const retrievedNode = await db.get('SELECT * FROM nodes WHERE id = ?', ['update-test'])
      const parsedBody = JSON.parse(retrievedNode.body)
      expect(parsedBody).toEqual(updatedNode)
      expect(parsedBody.name).toBe('Updated Name')
      expect(parsedBody.value).toBe(200)
      expect(parsedBody.newField).toBe('added field')
    })
  })

  describe('Edge Operations', () => {
    beforeEach(async () => {
      // Insert test nodes first
      const node1: Node = { id: 'node1', name: 'Node 1' }
      const node2: Node = { id: 'node2', name: 'Node 2' }
      
      await db.run(insertNodeFromObject(node1), getInsertNodeParams(node1))
      await db.run(insertNodeFromObject(node2), getInsertNodeParams(node2))
    })

    it('should insert and retrieve edges', async () => {
      const edge: Edge = {
        source: 'node1',
        target: 'node2',
        properties: {
          weight: 1.5,
          type: 'connection',
          metadata: { created: '2023-01-01' }
        }
      }

      // Insert edge
      const insertSql = insertEdgeFromObject(edge)
      const insertParams = getInsertEdgeParams(edge)
      await db.run(insertSql, insertParams)

      // Retrieve edge
      const retrievedEdge = await db.get(
        'SELECT * FROM edges WHERE source = ? AND target = ?', 
        ['node1', 'node2']
      )
      
      expect(retrievedEdge).toBeDefined()
      expect(retrievedEdge.source).toBe('node1')
      expect(retrievedEdge.target).toBe('node2')
      
      const parsedProperties = JSON.parse(retrievedEdge.properties)
      expect(parsedProperties).toEqual(edge.properties)
    })

    it('should update edge properties', async () => {
      // Insert initial edge
      const originalEdge: Edge = {
        source: 'node1',
        target: 'node2',
        properties: { weight: 1.0, type: 'weak' }
      }
      
      await db.run(insertEdgeFromObject(originalEdge), getInsertEdgeParams(originalEdge))

      // Update edge
      const updatedEdge: Edge = {
        source: 'node1',
        target: 'node2',
        properties: { weight: 2.5, type: 'strong', confidence: 0.95 }
      }

      const updateSql = updateEdgeFromObject(updatedEdge)
      const updateParams = getUpdateEdgeParams(updatedEdge)
      await db.run(updateSql, updateParams)

      // Verify update
      const retrievedEdge = await db.get(
        'SELECT * FROM edges WHERE source = ? AND target = ?', 
        ['node1', 'node2']
      )
      
      const parsedProperties = JSON.parse(retrievedEdge.properties)
      expect(parsedProperties).toEqual(updatedEdge.properties)
      expect(parsedProperties.weight).toBe(2.5)
      expect(parsedProperties.type).toBe('strong')
      expect(parsedProperties.confidence).toBe(0.95)
    })
  })
})
