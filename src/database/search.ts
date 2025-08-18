/**
 * Full-text search functionality for the knowledge graph
 */

import { DatabaseConnection } from '../types/base-types';

/**
 * Performs a full-text search on the nodes in the knowledge graph.
 *
 * @param connection - The database connection to use.
 * @param query - The search query.
 * @returns A promise that resolves to an array of node IDs that match the search query.
 */
export async function searchNodes(connection: DatabaseConnection, query: string): Promise<string[]> {
  const results = await connection.all(
    `SELECT n.id
     FROM nodes_fts fts
     JOIN nodes n ON fts.rowid = n.rowid
     WHERE fts.body MATCH ?`,
    [query]
  );

  return results.map((row: any) => row.id);
}
