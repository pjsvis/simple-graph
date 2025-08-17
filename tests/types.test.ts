import { describe, it, expect } from 'vitest'
import type { Node, NodeRow, Edge, EdgeRow } from '../src/types/base-types'

describe('Type Definitions', () => {
  describe('Node interface', () => {
    it('should allow valid node objects', () => {
      const node: Node = {
        id: 'test-node',
        name: 'Test Node',
        data: 'some data'
      }
      
      expect(node.id).toBe('test-node')
      expect(node.name).toBe('Test Node')
      expect(node.data).toBe('some data')
    })

    it('should allow additional properties', () => {
      const node: Node = {
        id: 'test-node',
        customProperty: 'custom value',
        nested: {
          property: 'nested value'
        },
        array: [1, 2, 3]
      }
      
      expect(node.id).toBe('test-node')
      expect(node.customProperty).toBe('custom value')
      expect(node.nested.property).toBe('nested value')
      expect(node.array).toEqual([1, 2, 3])
    })

    it('should require id property', () => {
      // This test ensures TypeScript compilation would fail without id
      const node: Node = {
        id: 'required-id'
      }
      
      expect(node.id).toBe('required-id')
    })
  })

  describe('NodeRow interface', () => {
    it('should represent database row structure', () => {
      const nodeRow: NodeRow = {
        body: '{"id":"test","name":"Test Node"}',
        id: 'test'
      }
      
      expect(nodeRow.body).toBe('{"id":"test","name":"Test Node"}')
      expect(nodeRow.id).toBe('test')
    })

    it('should allow parsing body as JSON', () => {
      const nodeRow: NodeRow = {
        body: '{"id":"test","name":"Test Node","data":"some data"}',
        id: 'test'
      }
      
      const parsedBody = JSON.parse(nodeRow.body)
      expect(parsedBody.id).toBe('test')
      expect(parsedBody.name).toBe('Test Node')
      expect(parsedBody.data).toBe('some data')
    })
  })

  describe('Edge interface', () => {
    it('should allow edge with properties', () => {
      const edge: Edge = {
        source: 'node1',
        target: 'node2',
        properties: {
          weight: 1.5,
          type: 'connection'
        }
      }
      
      expect(edge.source).toBe('node1')
      expect(edge.target).toBe('node2')
      expect(edge.properties?.weight).toBe(1.5)
      expect(edge.properties?.type).toBe('connection')
    })

    it('should allow edge without properties', () => {
      const edge: Edge = {
        source: 'node1',
        target: 'node2'
      }
      
      expect(edge.source).toBe('node1')
      expect(edge.target).toBe('node2')
      expect(edge.properties).toBeUndefined()
    })

    it('should allow complex properties', () => {
      const edge: Edge = {
        source: 'node1',
        target: 'node2',
        properties: {
          weight: 2.5,
          metadata: {
            created: '2023-01-01',
            confidence: 0.95
          },
          tags: ['important', 'verified'],
          active: true
        }
      }
      
      expect(edge.properties?.weight).toBe(2.5)
      expect(edge.properties?.metadata.created).toBe('2023-01-01')
      expect(edge.properties?.tags).toEqual(['important', 'verified'])
      expect(edge.properties?.active).toBe(true)
    })
  })

  describe('EdgeRow interface', () => {
    it('should represent database row structure', () => {
      const edgeRow: EdgeRow = {
        source: 'node1',
        target: 'node2',
        properties: '{"weight":1.5,"type":"connection"}'
      }
      
      expect(edgeRow.source).toBe('node1')
      expect(edgeRow.target).toBe('node2')
      expect(edgeRow.properties).toBe('{"weight":1.5,"type":"connection"}')
    })

    it('should allow parsing properties as JSON', () => {
      const edgeRow: EdgeRow = {
        source: 'node1',
        target: 'node2',
        properties: '{"weight":2.5,"metadata":{"created":"2023-01-01"}}'
      }
      
      const parsedProperties = JSON.parse(edgeRow.properties)
      expect(parsedProperties.weight).toBe(2.5)
      expect(parsedProperties.metadata.created).toBe('2023-01-01')
    })

    it('should handle empty properties', () => {
      const edgeRow: EdgeRow = {
        source: 'node1',
        target: 'node2',
        properties: '{}'
      }
      
      const parsedProperties = JSON.parse(edgeRow.properties)
      expect(parsedProperties).toEqual({})
    })
  })
})
