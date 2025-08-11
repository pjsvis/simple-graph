/**
 * Options for generating node search queries
 */
export interface SearchNodeOptions {
  /** Column to return in results ('id' or 'body') */
  resultColumn: 'id' | 'body' | '*';
  /** Whether to use json_tree for searching */
  tree?: boolean;
  /** Key for json_tree search */
  key?: string;
  /** Array of WHERE clause conditions */
  searchClauses?: string[];
}

/**
 * Generates a SELECT query for searching nodes
 * @param options - Configuration options for the search
 * @returns SQL SELECT query string
 */
export function generateSearchNode(options: SearchNodeOptions): string {
  const parts: string[] = [];
  
  // SELECT clause
  parts.push(`SELECT ${options.resultColumn}`);
  
  // FROM clause
  let fromClause = 'FROM nodes';
  if (options.tree) {
    fromClause += ', json_tree(body';
    if (options.key) {
      fromClause += `, '$.${options.key}'`;
    }
    fromClause += ')';
  }
  parts.push(fromClause);
  
  // WHERE clause
  if (options.searchClauses && options.searchClauses.length > 0) {
    parts.push('WHERE');
    parts.push(options.searchClauses.join('\n    '));
  }
  
  return parts.join('\n');
}

/**
 * Convenience function to search nodes by ID
 * @param resultColumn - Column to return ('id', 'body', or '*')
 * @returns SQL query and parameters
 */
export function searchNodeById(resultColumn: 'id' | 'body' | '*' = '*'): { sql: string; params: string[] } {
  const sql = generateSearchNode({
    resultColumn,
    searchClauses: ['id = ?']
  });
  return { sql, params: ['?'] };
}

/**
 * Convenience function to search nodes by JSON key-value
 * @param key - JSON key to search
 * @param predicate - Comparison operator
 * @param resultColumn - Column to return
 * @returns SQL query template
 */
export function searchNodeByKeyValue(
  key: string, 
  predicate: string = '=', 
  resultColumn: 'id' | 'body' | '*' = '*'
): { sql: string; params: string[] } {
  const sql = generateSearchNode({
    resultColumn,
    searchClauses: [`json_extract(body, '$.${key}') ${predicate} ?`]
  });
  return { sql, params: ['?'] };
}
