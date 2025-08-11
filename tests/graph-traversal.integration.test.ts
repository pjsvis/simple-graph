import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDatabase, type Database } from './helpers/database'

// Import our SQL generation functions
import { createSchema } from '../ts/schema'
import { insertNodeFromObject, getInsertNodeParams } from '../ts/insert-node'
import { insertEdgeFromObject, getInsertEdgeParams } from '../ts/insert-edge'
import { traverseAll, traverseOutbound, traverseInbound } from '../ts/traverse'
import type { Node, Edge } from '../ts/types'

describe('Graph Traversal Integration Tests', () => {
  let db: Database

  beforeEach(async () => {
    db = createDatabase({ type: 'memory' })
    await db.exec(createSchema())
    
    // Create a test graph:
    //     A
    //    / \
    //   B   C
    //  /   / \
    // D   E   F
    //     |
    //     G
    
    const nodes: Node[] = [
      { id: 'A', name: 'Node A', type: 'root' },
      { id: 'B', name: 'Node B', type: 'branch' },
      { id: 'C', name: 'Node C', type: 'branch' },
      { id: 'D', name: 'Node D', type: 'leaf' },
      { id: 'E', name: 'Node E', type: 'branch' },
      { id: 'F', name: 'Node F', type: 'leaf' },
      { id: 'G', name: 'Node G', type: 'leaf' }
    ]

    const edges: Edge[] = [
      { source: 'A', target: 'B', properties: { weight: 1.0, type: 'parent-child' } },
      { source: 'A', target: 'C', properties: { weight: 1.0, type: 'parent-child' } },
      { source: 'B', target: 'D', properties: { weight: 0.8, type: 'parent-child' } },
      { source: 'C', target: 'E', properties: { weight: 0.9, type: 'parent-child' } },
      { source: 'C', target: 'F', properties: { weight: 0.7, type: 'parent-child' } },
      { source: 'E', target: 'G', properties: { weight: 0.6, type: 'parent-child' } }
    ]

    // Insert all nodes
    for (const node of nodes) {
      await db.run(insertNodeFromObject(node), getInsertNodeParams(node))
    }

    // Insert all edges
    for (const edge of edges) {
      await db.run(insertEdgeFromObject(edge), getInsertEdgeParams(edge))
    }
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Outbound Traversal', () => {
    it('should traverse outbound from root node A', async () => {
      const sql = traverseOutbound(false)
      const results = await db.all(sql, ['A'])
      
      // Should find A, B, C, D, E, F, G (all reachable nodes)
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    })

    it('should traverse outbound from branch node C', async () => {
      const sql = traverseOutbound(false)
      const results = await db.all(sql, ['C'])
      
      // Should find C, E, F, G (C and its descendants)
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).toEqual(['C', 'E', 'F', 'G'])
    })

    it('should traverse outbound from leaf node D', async () => {
      const sql = traverseOutbound(false)
      const results = await db.all(sql, ['D'])
      
      // Should only find D (no outbound edges)
      const nodeIds = results.map(r => r.x)
      expect(nodeIds).toEqual(['D'])
    })

    it('should include edge data when withBodies is true', async () => {
      const sql = traverseOutbound(true)
      const results = await db.all(sql, ['A'])
      
      // Check that we have the expected structure
      expect(results.length).toBeGreaterThan(0)
      
      // Find an edge result (should have '->' as direction indicator)
      const edgeResult = results.find(r => r.y === '->')
      expect(edgeResult).toBeDefined()
      expect(edgeResult.obj).toBeDefined()
      
      // Parse the edge properties
      const edgeProps = JSON.parse(edgeResult.obj)
      expect(edgeProps).toHaveProperty('weight')
      expect(edgeProps).toHaveProperty('type')
    })
  })

  describe('Inbound Traversal', () => {
    it('should traverse inbound from leaf node G', async () => {
      const sql = traverseInbound(false)
      const results = await db.all(sql, ['G'])
      
      // Should find G, E, C, A (path back to root)
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).toEqual(['A', 'C', 'E', 'G'])
    })

    it('should traverse inbound from branch node C', async () => {
      const sql = traverseInbound(false)
      const results = await db.all(sql, ['C'])
      
      // Should find C, A (C and its ancestors)
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).toEqual(['A', 'C'])
    })

    it('should traverse inbound from root node A', async () => {
      const sql = traverseInbound(false)
      const results = await db.all(sql, ['A'])
      
      // Should only find A (no inbound edges)
      const nodeIds = results.map(r => r.x)
      expect(nodeIds).toEqual(['A'])
    })
  })

  describe('Full Traversal (Inbound + Outbound)', () => {
    it('should traverse all connected nodes from any starting point', async () => {
      const sql = traverseAll(false)
      const results = await db.all(sql, ['C'])
      
      // Should find all nodes in the graph (they're all connected)
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    })

    it('should include both node and edge data when withBodies is true', async () => {
      const sql = traverseAll(true)
      const results = await db.all(sql, ['A'])
      
      // Should have nodes (with '()' direction) and edges (with '<-' or '->')
      const nodeResults = results.filter(r => r.y === '()')
      const edgeResults = results.filter(r => r.y === '<-' || r.y === '->')
      
      expect(nodeResults.length).toBeGreaterThan(0)
      expect(edgeResults.length).toBeGreaterThan(0)
      
      // Check node data
      const nodeResult = nodeResults[0]
      expect(nodeResult.obj).toBeDefined()
      const nodeData = JSON.parse(nodeResult.obj)
      expect(nodeData).toHaveProperty('id')
      expect(nodeData).toHaveProperty('name')
      
      // Check edge data
      const edgeResult = edgeResults[0]
      expect(edgeResult.obj).toBeDefined()
      const edgeData = JSON.parse(edgeResult.obj)
      expect(edgeData).toHaveProperty('weight')
      expect(edgeData).toHaveProperty('type')
    })
  })

  describe('Complex Graph Scenarios', () => {
    it('should handle disconnected components', async () => {
      // Add a disconnected node
      const isolatedNode: Node = { id: 'ISOLATED', name: 'Isolated Node' }
      await db.run(insertNodeFromObject(isolatedNode), getInsertNodeParams(isolatedNode))
      
      // Traverse from the main graph
      const sql = traverseAll(false)
      const results = await db.all(sql, ['A'])
      
      // Should not include the isolated node
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).not.toContain('ISOLATED')
      expect(nodeIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    })

    it('should handle cycles in the graph', async () => {
      // Add a cycle: G -> A
      const cycleEdge: Edge = { 
        source: 'G', 
        target: 'A', 
        properties: { weight: 0.1, type: 'cycle' } 
      }
      await db.run(insertEdgeFromObject(cycleEdge), getInsertEdgeParams(cycleEdge))
      
      // Traverse should still work and not get stuck in infinite loop
      const sql = traverseAll(false)
      const results = await db.all(sql, ['A'])
      
      // Should still find all nodes exactly once
      const nodeIds = results.map(r => r.x).sort()
      expect(nodeIds).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    })
  })
})
