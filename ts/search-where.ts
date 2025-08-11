/**
 * Options for generating WHERE clause conditions
 */
export interface SearchWhereOptions {
  /** AND/OR operator to prefix the condition */
  andOr?: 'AND' | 'OR';
  /** Whether to use id lookup (id = ?) */
  idLookup?: boolean;
  /** Key for JSON extraction with key_value mode */
  key?: string;
  /** Whether to use key_value mode (json_extract) */
  keyValue?: boolean;
  /** Whether to use tree mode (json_tree) */
  tree?: boolean;
  /** Predicate operator (=, !=, <, >, LIKE, etc.) */
  predicate?: string;
}

/**
 * Generates a WHERE clause condition based on the provided options
 * @param options - Configuration options for the WHERE clause
 * @returns SQL WHERE clause string
 */
export function generateSearchWhere(options: SearchWhereOptions): string {
  const parts: string[] = [];

  // Add AND/OR prefix if specified
  if (options.andOr) {
    parts.push(options.andOr);
  }

  // Add id lookup condition
  if (options.idLookup) {
    parts.push('id = ?');
  }

  // Add key_value condition (json_extract)
  if (options.keyValue && options.key) {
    const predicate = options.predicate || '=';
    parts.push(`json_extract(body, '$.${options.key}') ${predicate} ?`);
  }

  // Add tree condition (json_tree)
  if (options.tree) {
    const predicate = options.predicate || '=';
    if (options.key) {
      parts.push(`(json_tree.key='${options.key}' AND json_tree.value ${predicate} ?)`);
    } else {
      parts.push(`json_tree.value ${predicate} ?`);
    }
  }

  return parts.join(' ');
}
