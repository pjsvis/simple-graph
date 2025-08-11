import { Node } from './types';

/**
 * Returns SQL to delete all edges connected to a specific node (both incoming and outgoing)
 * @param nodeId - The node ID to delete edges for
 * @returns SQL string for deleting all edges connected to the node
 */
export function deleteEdges(nodeId: string): string {
  return `DELETE FROM edges WHERE source = ? OR target = ?`;
}

/**
 * Returns SQL to delete all edges connected to a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for deleting all edges connected to the node
 */
export function deleteEdgesFromNode(node: Pick<Node, 'id'>): string {
  return deleteEdges(node.id);
}
