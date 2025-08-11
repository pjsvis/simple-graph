import { describe, it, expect } from 'vitest'
import { 
  updateNode, 
  updateNodeFromObject, 
  getUpdateNodeParams, 
  getUpdateNodeParamsFromValues 
} from '../ts/update-node'
import { 
  updateEdge, 
  updateEdgeFromObject, 
  getUpdateEdgeParams, 
  getUpdateEdgeParamsFromValues 
} from '../ts/update-edge'
import type { Node, Edge } from '../ts/types'

describe('Update SQL Generation', () => {
  describe('updateNode', () => {
    it('should generate correct UPDATE SQL for nodes', () => {
      const sql = updateNode('{"id":"test","name":"Test Node"}', 'test')
      
      expect(sql).toBe('UPDATE nodes SET body = json(?) WHERE id = ?')
    })

    it('should generate SQL from Node object', () => {
      const node: Node = { id: 'test', name: 'Test Node', data: 'some data' }
      const sql = updateNodeFromObject(node)
      
      expect(sql).toBe('UPDATE nodes SET body = json(?) WHERE id = ?')
    })

    it('should generate correct parameters from Node object', () => {
      const node: Node = { id: 'test', name: 'Test Node', data: 'some data' }
      const params = getUpdateNodeParams(node)
      
      expect(params).toHaveLength(2)
      expect(params[0]).toBe(JSON.stringify(node))
      expect(params[1]).toBe('test')
    })

    it('should generate correct parameters from separate values', () => {
      const nodeJson = '{"id":"test","name":"Test Node"}'
      const nodeId = 'test'
      const params = getUpdateNodeParamsFromValues(nodeJson, nodeId)
      
      expect(params).toEqual([nodeJson, nodeId])
    })

    it('should handle complex node objects', () => {
      const node: Node = {
        id: 'complex-node',
        name: 'Complex Node',
        metadata: {
          created: '2023-01-01',
          tags: ['important', 'test']
        },
        count: 42
      }
      
      const params = getUpdateNodeParams(node)
      const parsedNode = JSON.parse(params[0])
      
      expect(parsedNode).toEqual(node)
      expect(params[1]).toBe('complex-node')
    })

    it('should match SQL snapshot', () => {
      const sql = updateNode('{}', 'test')
      expect(sql).toMatchSnapshot()
    })
  })

  describe('updateEdge', () => {
    it('should generate correct UPDATE SQL for edges', () => {
      const sql = updateEdge('{"weight":1.5}', 'source1', 'target1')
      
      expect(sql).toBe('UPDATE edges SET properties = json(?) WHERE source = ? AND target = ?')
    })

    it('should generate SQL from Edge object', () => {
      const edge: Edge = { 
        source: 'source1', 
        target: 'target1', 
        properties: { weight: 1.5, type: 'connection' } 
      }
      const sql = updateEdgeFromObject(edge)
      
      expect(sql).toBe('UPDATE edges SET properties = json(?) WHERE source = ? AND target = ?')
    })

    it('should generate correct parameters from Edge object', () => {
      const edge: Edge = { 
        source: 'source1', 
        target: 'target1', 
        properties: { weight: 1.5, type: 'connection' } 
      }
      const params = getUpdateEdgeParams(edge)
      
      expect(params).toHaveLength(3)
      expect(params[0]).toBe(JSON.stringify(edge.properties))
      expect(params[1]).toBe('source1')
      expect(params[2]).toBe('target1')
    })

    it('should handle edge without properties', () => {
      const edge: Edge = { source: 'source1', target: 'target1' }
      const params = getUpdateEdgeParams(edge)
      
      expect(params[0]).toBe('{}')
      expect(params[1]).toBe('source1')
      expect(params[2]).toBe('target1')
    })

    it('should generate correct parameters from separate values', () => {
      const propertiesJson = '{"weight":2.0}'
      const source = 'source1'
      const target = 'target1'
      const params = getUpdateEdgeParamsFromValues(propertiesJson, source, target)
      
      expect(params).toEqual([propertiesJson, source, target])
    })

    it('should handle complex edge properties', () => {
      const edge: Edge = {
        source: 'node1',
        target: 'node2',
        properties: {
          weight: 2.5,
          type: 'strong',
          metadata: {
            created: '2023-01-01',
            confidence: 0.95
          },
          tags: ['important', 'verified']
        }
      }
      
      const params = getUpdateEdgeParams(edge)
      const parsedProperties = JSON.parse(params[0])
      
      expect(parsedProperties).toEqual(edge.properties)
      expect(params[1]).toBe('node1')
      expect(params[2]).toBe('node2')
    })

    it('should match SQL snapshot', () => {
      const sql = updateEdge('{}', 'source', 'target')
      expect(sql).toMatchSnapshot()
    })
  })
})
