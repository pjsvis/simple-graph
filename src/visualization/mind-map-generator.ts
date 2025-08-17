
import { connectToTheLoom } from '../database/connection';
import { Node, Edge, DatabaseConnection } from '../types/base-types';

/**
 * Generates a DOT language string for a mind-map style visualization of the graph data.
 *
 * @param startNodeId The ID of the node to start the traversal from.
 * @param depth The maximum depth to traverse from the start node.
 * @param dbConnection Optional database connection to use. If not provided, a new one will be created.
 * @returns A string of valid DOT language source code.
 */
export async function generateMindMap(
  startNodeId: string,
  depth: number,
  dbConnection?: DatabaseConnection
): Promise<string> {
  const db = dbConnection || (await connectToTheLoom());
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const visited = new Set<string>();

  // BFS traversal to get nodes and edges
  const queue: [string, number][] = [[startNodeId, 0]];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const [currentId, currentDepth] = queue.shift()!;

    const node = await db.get('SELECT * FROM nodes WHERE id = ?', [currentId]);
    if (node) {
      nodes.push(node);
    }

    if (currentDepth < depth) {
      const connectedEdges = await db.all('SELECT * FROM edges WHERE source = ?', [currentId]);
      for (const edge of connectedEdges) {
        edges.push(edge);
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push([edge.target, currentDepth + 1]);
        }
      }
    }
  }

  // Generate DOT code
  let dot = 'digraph G {\n';
  dot += '  rankdir="LR";\n';
  dot += '  layout="twopi";\n';
  dot += '  node [shape="box", style="rounded,filled"];\n';

  for (const node of nodes) {
    const parsedBody = JSON.parse(node.body);
    dot += `  "${node.id}" [label="${parsedBody.label}"];\n`;
  }

  for (const edge of edges) {
    dot += `  "${edge.source}" -> "${edge.target}";\n`;
  }

  dot += '}';

  // If we created a new connection, we should close it.
  if (!dbConnection) {
    await db.close();
  }

  return dot;
}
