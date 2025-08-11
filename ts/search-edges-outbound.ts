import { Node } from './types';

/**
 * Returns SQL to search for outbound edges from a specific node
 * @param nodeId - The source node ID to search outbound edges for
 * @returns SQL string for searching outbound edges from the node
 */
export function searchEdgesOutbound(nodeId: string): string {
  return `SELECT * FROM edges WHERE target = ?`;
}

/**
 * Returns SQL to search for outbound edges from a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for searching outbound edges from the node
 */
export function searchEdgesOutboundFromNode(node: Pick<Node, 'id'>): string {
  return searchEdgesOutbound(node.id);
}

/**
 * Helper function to get the parameters for the search outbound edges SQL
 * @param nodeId - The source node ID to search outbound edges for
 * @returns Array of parameters for the SQL query
 */
export function getSearchEdgesOutboundParams(nodeId: string): [string] {
  return [nodeId];
}
