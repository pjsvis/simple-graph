/**
 * Options for generating graph traversal queries
 */
export interface TraverseOptions {
  /** Whether to include bodies/objects in the result */
  withBodies?: boolean;
  /** Whether to include inbound edges in traversal */
  inbound?: boolean;
  /** Whether to include outbound edges in traversal */
  outbound?: boolean;
}

/**
 * Generates a recursive CTE query for graph traversal
 * @param options - Configuration options for the traversal
 * @returns SQL query string for graph traversal
 */
export function generateTraverse(options: TraverseOptions = {}): string {
  const { withBodies = false, inbound = false, outbound = false } = options;
  
  const parts: string[] = [];
  
  // CTE header
  let cteColumns = 'x';
  if (withBodies) {
    cteColumns += ', y, obj';
  }
  parts.push(`WITH RECURSIVE traverse(${cteColumns}) AS (`);
  
  // Base case - starting node
  let baseSelect = '  SELECT id';
  if (withBodies) {
    baseSelect += ", '()', body";
  }
  baseSelect += ' FROM nodes WHERE id = ?';
  parts.push(baseSelect);
  
  // Recursive case - self-join
  parts.push('  UNION');
  let recursiveSelect = '  SELECT id';
  if (withBodies) {
    recursiveSelect += ", '()', body";
  }
  recursiveSelect += ' FROM nodes JOIN traverse ON id = x';
  parts.push(recursiveSelect);
  
  // Inbound edges
  if (inbound) {
    parts.push('  UNION');
    let inboundSelect = '  SELECT source';
    if (withBodies) {
      inboundSelect += ", '<-', properties";
    }
    inboundSelect += ' FROM edges JOIN traverse ON target = x';
    parts.push(inboundSelect);
  }
  
  // Outbound edges
  if (outbound) {
    parts.push('  UNION');
    let outboundSelect = '  SELECT target';
    if (withBodies) {
      outboundSelect += ", '->', properties";
    }
    outboundSelect += ' FROM edges JOIN traverse ON source = x';
    parts.push(outboundSelect);
  }
  
  // Final SELECT
  let finalSelect = ') SELECT x';
  if (withBodies) {
    finalSelect += ', y, obj';
  }
  finalSelect += ' FROM traverse;';
  parts.push(finalSelect);
  
  return parts.join('\n');
}

/**
 * Convenience function to traverse all connected nodes (inbound and outbound)
 * @param withBodies - Whether to include node/edge data
 * @returns SQL query for full traversal
 */
export function traverseAll(withBodies: boolean = false): string {
  return generateTraverse({
    withBodies,
    inbound: true,
    outbound: true
  });
}

/**
 * Convenience function to traverse only outbound connections
 * @param withBodies - Whether to include node/edge data
 * @returns SQL query for outbound traversal
 */
export function traverseOutbound(withBodies: boolean = false): string {
  return generateTraverse({
    withBodies,
    outbound: true
  });
}

/**
 * Convenience function to traverse only inbound connections
 * @param withBodies - Whether to include node/edge data
 * @returns SQL query for inbound traversal
 */
export function traverseInbound(withBodies: boolean = false): string {
  return generateTraverse({
    withBodies,
    inbound: true
  });
}
