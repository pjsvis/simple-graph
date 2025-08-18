import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { SimpleGraph } from '../../src/SimpleGraph';
import { Node, Edge } from '../../src/types/base-types';

describe('API Coverage Tests', () => {
  let graph: SimpleGraph;

  // Setup a fresh in-memory graph with test data before each test
  beforeEach(async () => {
    graph = await SimpleGraph.connect(); // In-memory DB
    // Add nodes
    await graph.nodes.add({ id: 'A', type: 'person', name: 'Alice' });
    await graph.nodes.add({ id: 'B', type: 'person', name: 'Bob' });
    await graph.nodes.add({ id: 'C', type: 'company', name: 'Charlie Inc.' });

    // Add edges
    await graph.edges.add({ source: 'A', target: 'B', properties: { type: 'knows', since: 2020 } });
    await graph.edges.add({ source: 'B', target: 'C', properties: { type: 'works_at' } });
  });

  // Close the connection after each test
  afterEach(async () => {
    if (graph) {
      await graph.close();
    }
  });

  // --- NodeManager --- //
  describe('NodeManager', () => {
    it('should update a node\'s properties', async () => {
      await graph.nodes.update('A', { name: 'Alice V2', age: 30 });
      const updatedNode = await graph.nodes.get('A');
      expect(updatedNode).not.toBeNull();
      expect(updatedNode?.id).toBe('A');
      expect(updatedNode?.name).toBe('Alice V2');
      expect(updatedNode?.age).toBe(30);
      expect(updatedNode?.type).toBe('person'); // Should not change other properties
    });
  });

  // --- EdgeManager --- //
  describe('EdgeManager', () => {
    it('should get a specific edge', async () => {
      const edge = await graph.edges.get('A', 'B');
      expect(edge).not.toBeNull();
      expect(edge?.source).toBe('A');
      expect(edge?.target).toBe('B');
      expect(edge?.properties?.type).toBe('knows');
    });

    it('should return null for a non-existent edge', async () => {
      const edge = await graph.edges.get('A', 'C');
      expect(edge).toBeNull();
    });

    it('should update an edge\'s properties', async () => {
      await graph.edges.update('A', 'B', { since: 2022, strength: 'strong' });
      const updatedEdge = await graph.edges.get('A', 'B');
      expect(updatedEdge?.properties?.since).toBe(2022);
      expect(updatedEdge?.properties?.strength).toBe('strong');
    });

    it('should delete an edge', async () => {
      await graph.edges.delete('A', 'B');
      const deletedEdge = await graph.edges.get('A', 'B');
      expect(deletedEdge).toBeNull();
    });
  });

  // --- QueryManager --- //
  describe('QueryManager', () => {
    it('should get correct graph stats', async () => {
      const stats = await graph.query.stats();
      expect(stats.nodeCount).toBe(4); // A, B, C + Genesis Node
      expect(stats.edgeCount).toBe(2);
      expect(stats.nodeTypes).toEqual({ person: 2, company: 1, unknown: 1 });
      expect(stats.edgeTypes).toEqual({ knows: 1, works_at: 1 });
    });

    it('should traverse the graph correctly', async () => {
      // Outgoing from A
      let traversed = await graph.query.traverse({ startNodeId: 'A', direction: 'outgoing', maxDepth: 1 });
      expect(traversed.map(n => n.id).sort()).toEqual(['A', 'B']);

      // Incoming to C
      traversed = await graph.query.traverse({ startNodeId: 'C', direction: 'incoming', maxDepth: 1 });
      expect(traversed.map(n => n.id).sort()).toEqual(['B', 'C']);

      // Deeper traversal
      traversed = await graph.query.traverse({ startNodeId: 'A', maxDepth: 2 });
      expect(traversed.map(n => n.id).sort()).toEqual(['A', 'B', 'C']);
    });
  });
});
