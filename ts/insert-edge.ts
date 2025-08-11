import { Edge } from './types';

/**
 * Returns SQL to insert an edge with source, target, and properties
 * @param source - The source node ID
 * @param target - The target node ID
 * @param propertiesJson - The JSON string representation of edge properties
 * @returns SQL string for inserting the edge
 */
export function insertEdge(source: string, target: string, propertiesJson: string): string {
  return `INSERT INTO edges VALUES(?, ?, json(?))`;
}

/**
 * Returns SQL to insert an edge using an Edge object
 * @param edge - The edge object to insert
 * @returns SQL string for inserting the edge
 */
export function insertEdgeFromObject(edge: Edge): string {
  const propertiesJson = edge.properties ? JSON.stringify(edge.properties) : '{}';
  return insertEdge(edge.source, edge.target, propertiesJson);
}

/**
 * Helper function to get the parameters for the insert edge SQL
 * @param edge - The edge object to insert
 * @returns Array of parameters for the SQL query
 */
export function getInsertEdgeParams(edge: Edge): [string, string, string] {
  const propertiesJson = edge.properties ? JSON.stringify(edge.properties) : '{}';
  return [edge.source, edge.target, propertiesJson];
}
