import { Node } from './types';

/**
 * Returns SQL to delete all outgoing edges from a specific node
 * @param nodeId - The source node ID to delete outgoing edges for
 * @returns SQL string for deleting outgoing edges from the node
 */
export function deleteOutgoingEdges(nodeId: string): string {
  return `DELETE FROM edges WHERE source = ?`;
}

/**
 * Returns SQL to delete all outgoing edges from a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for deleting outgoing edges from the node
 */
export function deleteOutgoingEdgesFromNode(node: Pick<Node, 'id'>): string {
  return deleteOutgoingEdges(node.id);
}
