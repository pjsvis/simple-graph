#!/usr/bin/env node

import { SimpleGraph } from './SimpleGraph';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const id = args[1]; // For getNode, forNode
  const query = args[1]; // For find

  let graph;
  try {
    const dbPath = process.env.SIMPLE_GRAPH_DB_PATH || 'cda-import-test.db';
    graph = await SimpleGraph.connect({ path: dbPath });

    switch (command) {
      case 'getNode':
        if (id === undefined) {
          console.error('Error: getNode requires an ID.');
          process.exit(1);
        }
        const nodeResult = await graph.nodes.get(parseInt(id, 10));
        console.log(JSON.stringify(nodeResult, null, 2));
        break;
      case 'find':
        if (query === undefined) {
          console.error('Error: find requires a query string.');
          process.exit(1);
        }
        const findResult = await graph.nodes.find(query);
        console.log(JSON.stringify(findResult, null, 2));
        break;
      case 'forNode':
        if (id === undefined) {
          console.error('Error: forNode requires an ID.');
          process.exit(1);
        }
        const edgeResult = await graph.edges.forNode(parseInt(id, 10));
        console.log(JSON.stringify(edgeResult, null, 2));
        break;
      default:
        console.error(`Error: Unknown command '${command}'.`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (graph) {
      await graph.close();
    }
  }
}

main();