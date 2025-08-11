import { Node } from './types';

/**
 * Returns SQL to search for all edges connected to a specific node (both incoming and outgoing)
 * @param nodeId - The node ID to search edges for
 * @returns SQL string for searching all edges connected to the node
 */
export function searchEdges(nodeId: string): string {
  return `SELECT * FROM edges WHERE source = ? 
UNION
SELECT * FROM edges WHERE target = ?`;
}

/**
 * Returns SQL to search for all edges connected to a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for searching all edges connected to the node
 */
export function searchEdgesFromNode(node: Pick<Node, 'id'>): string {
  return searchEdges(node.id);
}

/**
 * Helper function to get the parameters for the search edges SQL
 * @param nodeId - The node ID to search edges for
 * @returns Array of parameters for the SQL query
 */
export function getSearchEdgesParams(nodeId: string): [string, string] {
  return [nodeId, nodeId];
}
