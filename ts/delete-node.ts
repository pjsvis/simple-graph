import { Node } from './types';

/**
 * Returns SQL to delete a specific node by ID
 * @param nodeId - The node ID to delete
 * @returns SQL string for deleting the node
 */
export function deleteNode(nodeId: string): string {
  return `DELETE FROM nodes WHERE id = ?`;
}

/**
 * Returns SQL to delete a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for deleting the node
 */
export function deleteNodeFromObject(node: Pick<Node, 'id'>): string {
  return deleteNode(node.id);
}
