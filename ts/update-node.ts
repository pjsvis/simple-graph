import { Node } from './types';

/**
 * Returns SQL to update a node's body with new JSON data
 * @param nodeJson - The JSON string representation of the updated node
 * @param nodeId - The ID of the node to update
 * @returns SQL string for updating the node
 */
export function updateNode(nodeJson: string, nodeId: string): string {
  return `UPDATE nodes SET body = json(?) WHERE id = ?`;
}

/**
 * Returns SQL to update a node using a Node object
 * @param node - The node object with updated data (must include id)
 * @returns SQL string for updating the node
 */
export function updateNodeFromObject(node: Node): string {
  return updateNode(JSON.stringify(node), node.id);
}

/**
 * Helper function to get the parameters for the update node SQL
 * @param node - The node object with updated data
 * @returns Array of parameters for the SQL query
 */
export function getUpdateNodeParams(node: Node): [string, string] {
  return [JSON.stringify(node), node.id];
}

/**
 * Helper function to get the parameters for the update node SQL with separate values
 * @param nodeJson - The JSON string representation of the updated node
 * @param nodeId - The ID of the node to update
 * @returns Array of parameters for the SQL query
 */
export function getUpdateNodeParamsFromValues(nodeJson: string, nodeId: string): [string, string] {
  return [nodeJson, nodeId];
}
