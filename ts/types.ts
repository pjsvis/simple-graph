/**
 * Interface for a node object stored in the nodes table
 */
export interface Node {
  id: string;
  [key: string]: any; // Additional properties in the JSON body
}

/**
 * Interface for the raw node data as stored in the database
 */
export interface NodeRow {
  body: string; // JSON string containing the node data
  id: string;   // Virtual column extracted from body
}

/**
 * Interface for an edge object stored in the edges table
 */
export interface Edge {
  source: string;
  target: string;
  properties?: Record<string, any>; // JSON object for edge properties
}

/**
 * Interface for the raw edge data as stored in the database
 */
export interface EdgeRow {
  source: string;
  target: string;
  properties: string; // JSON string containing edge properties
}
