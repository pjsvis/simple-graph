import { Node } from './types';

/**
 * Returns SQL to delete all incoming edges to a specific node
 * @param nodeId - The target node ID to delete incoming edges for
 * @returns SQL string for deleting incoming edges to the node
 */
export function deleteIncomingEdges(nodeId: string): string {
  return `DELETE FROM edges WHERE target = ?`;
}

/**
 * Returns SQL to delete all incoming edges to a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for deleting incoming edges to the node
 */
export function deleteIncomingEdgesFromNode(node: Pick<Node, 'id'>): string {
  return deleteIncomingEdges(node.id);
}
