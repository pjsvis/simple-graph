import { Edge } from './types';

/**
 * Returns SQL to delete a specific edge between two nodes
 * @param source - The source node ID
 * @param target - The target node ID
 * @returns SQL string for deleting the edge
 */
export function deleteEdge(source: string, target: string): string {
  return `DELETE FROM edges WHERE source = ? AND target = ?`;
}

/**
 * Returns SQL to delete an edge using an Edge object
 * @param edge - The edge object containing source and target
 * @returns SQL string for deleting the edge
 */
export function deleteEdgeFromObject(edge: Pick<Edge, 'source' | 'target'>): string {
  return deleteEdge(edge.source, edge.target);
}
