import { Node } from './types';

/**
 * Returns SQL to insert a node with JSON body
 * @param nodeJson - The JSON string representation of the node
 * @returns SQL string for inserting the node
 */
export function insertNode(nodeJson: string): string {
  return `INSERT INTO nodes VALUES(json(?))`;
}

/**
 * Returns SQL to insert a node using a Node object
 * @param node - The node object to insert
 * @returns SQL string for inserting the node
 */
export function insertNodeFromObject(node: Node): string {
  return insertNode(JSON.stringify(node));
}

/**
 * Helper function to get the parameters for the insert node SQL
 * @param node - The node object to insert
 * @returns Array of parameters for the SQL query
 */
export function getInsertNodeParams(node: Node): [string] {
  return [JSON.stringify(node)];
}
