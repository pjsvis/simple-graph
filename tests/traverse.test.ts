import { describe, it, expect } from 'vitest'
import { 
  generateTraverse, 
  traverseAll, 
  traverseOutbound, 
  traverseInbound,
  type TraverseOptions 
} from '../ts/traverse'

describe('Traverse SQL Generation', () => {
  describe('generateTraverse', () => {
    it('should generate basic traversal query without options', () => {
      const sql = generateTraverse()
      
      expect(sql).toContain('WITH RECURSIVE traverse(x) AS (')
      expect(sql).toContain('SELECT id FROM nodes WHERE id = ?')
      expect(sql).toContain('SELECT id FROM nodes JOIN traverse ON id = x')
      expect(sql).toContain(') SELECT x FROM traverse;')
      expect(sql).not.toContain('y, obj')
      expect(sql).not.toContain('source')
      expect(sql).not.toContain('target')
    })

    it('should generate traversal query with bodies', () => {
      const sql = generateTraverse({ withBodies: true })
      
      expect(sql).toContain('WITH RECURSIVE traverse(x, y, obj) AS (')
      expect(sql).toContain("SELECT id, '()', body FROM nodes WHERE id = ?")
      expect(sql).toContain("SELECT id, '()', body FROM nodes JOIN traverse ON id = x")
      expect(sql).toContain(') SELECT x, y, obj FROM traverse;')
    })

    it('should generate traversal query with inbound edges', () => {
      const sql = generateTraverse({ inbound: true })
      
      expect(sql).toContain('SELECT source FROM edges JOIN traverse ON target = x')
      expect(sql).not.toContain('SELECT target FROM edges')
    })

    it('should generate traversal query with outbound edges', () => {
      const sql = generateTraverse({ outbound: true })
      
      expect(sql).toContain('SELECT target FROM edges JOIN traverse ON source = x')
      expect(sql).not.toContain('SELECT source FROM edges')
    })

    it('should generate traversal query with both inbound and outbound edges', () => {
      const sql = generateTraverse({ inbound: true, outbound: true })
      
      expect(sql).toContain('SELECT source FROM edges JOIN traverse ON target = x')
      expect(sql).toContain('SELECT target FROM edges JOIN traverse ON source = x')
    })

    it('should generate full traversal query with all options', () => {
      const sql = generateTraverse({ 
        withBodies: true, 
        inbound: true, 
        outbound: true 
      })
      
      expect(sql).toContain('WITH RECURSIVE traverse(x, y, obj) AS (')
      expect(sql).toContain("SELECT id, '()', body FROM nodes WHERE id = ?")
      expect(sql).toContain("SELECT source, '<-', properties FROM edges JOIN traverse ON target = x")
      expect(sql).toContain("SELECT target, '->', properties FROM edges JOIN traverse ON source = x")
      expect(sql).toContain(') SELECT x, y, obj FROM traverse;')
    })

    it('should match snapshot for basic query', () => {
      const sql = generateTraverse()
      expect(sql).toMatchSnapshot()
    })

    it('should match snapshot for full query', () => {
      const sql = generateTraverse({ 
        withBodies: true, 
        inbound: true, 
        outbound: true 
      })
      expect(sql).toMatchSnapshot()
    })
  })

  describe('convenience functions', () => {
    it('traverseAll should generate query with inbound and outbound', () => {
      const sql = traverseAll()
      
      expect(sql).toContain('SELECT source FROM edges JOIN traverse ON target = x')
      expect(sql).toContain('SELECT target FROM edges JOIN traverse ON source = x')
      expect(sql).not.toContain('y, obj')
    })

    it('traverseAll with bodies should include body data', () => {
      const sql = traverseAll(true)
      
      expect(sql).toContain('x, y, obj')
      expect(sql).toContain("'<-', properties")
      expect(sql).toContain("'->', properties")
    })

    it('traverseOutbound should only include outbound edges', () => {
      const sql = traverseOutbound()
      
      expect(sql).toContain('SELECT target FROM edges JOIN traverse ON source = x')
      expect(sql).not.toContain('SELECT source FROM edges')
    })

    it('traverseInbound should only include inbound edges', () => {
      const sql = traverseInbound()
      
      expect(sql).toContain('SELECT source FROM edges JOIN traverse ON target = x')
      expect(sql).not.toContain('SELECT target FROM edges')
    })
  })
})
