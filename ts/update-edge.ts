import { Edge } from './types';

/**
 * Returns SQL to update an edge's properties
 * @param propertiesJson - The JSON string representation of the updated properties
 * @param source - The source node ID of the edge to update
 * @param target - The target node ID of the edge to update
 * @returns SQL string for updating the edge
 */
export function updateEdge(propertiesJson: string, source: string, target: string): string {
  return `UPDATE edges SET properties = json(?) WHERE source = ? AND target = ?`;
}

/**
 * Returns SQL to update an edge using an Edge object
 * @param edge - The edge object with updated properties
 * @returns SQL string for updating the edge
 */
export function updateEdgeFromObject(edge: Edge): string {
  const propertiesJson = edge.properties ? JSON.stringify(edge.properties) : '{}';
  return updateEdge(propertiesJson, edge.source, edge.target);
}

/**
 * Helper function to get the parameters for the update edge SQL
 * @param edge - The edge object with updated properties
 * @returns Array of parameters for the SQL query
 */
export function getUpdateEdgeParams(edge: Edge): [string, string, string] {
  const propertiesJson = edge.properties ? JSON.stringify(edge.properties) : '{}';
  return [propertiesJson, edge.source, edge.target];
}

/**
 * Helper function to get the parameters for the update edge SQL with separate values
 * @param propertiesJson - The JSON string representation of the updated properties
 * @param source - The source node ID of the edge to update
 * @param target - The target node ID of the edge to update
 * @returns Array of parameters for the SQL query
 */
export function getUpdateEdgeParamsFromValues(propertiesJson: string, source: string, target: string): [string, string, string] {
  return [propertiesJson, source, target];
}
