import { Node } from './types';

/**
 * Returns SQL to search for inbound edges to a specific node
 * @param nodeId - The target node ID to search inbound edges for
 * @returns SQL string for searching inbound edges to the node
 */
export function searchEdgesInbound(nodeId: string): string {
  return `SELECT * FROM edges WHERE source = ?`;
}

/**
 * Returns SQL to search for inbound edges to a node using a Node object
 * @param node - The node object containing the ID
 * @returns SQL string for searching inbound edges to the node
 */
export function searchEdgesInboundFromNode(node: Pick<Node, 'id'>): string {
  return searchEdgesInbound(node.id);
}

/**
 * Helper function to get the parameters for the search inbound edges SQL
 * @param nodeId - The target node ID to search inbound edges for
 * @returns Array of parameters for the SQL query
 */
export function getSearchEdgesInboundParams(nodeId: string): [string] {
  return [nodeId];
}
