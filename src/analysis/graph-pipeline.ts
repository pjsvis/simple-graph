import { SimpleGraph } from '../SimpleGraph';
import { GraphType, ImageType } from '../types/visualization-types';
import { writeFileSync } from 'fs';

export async function generateVisualization(
  dbPath: string,
  graphType: GraphType,
  format: ImageType | 'dot',
  outputPath: string
): Promise<{ output: string }> {
  const graph = await SimpleGraph.connect({ path: dbPath });
  try {
    const dotString = await graph.visualize.cannedGraph(graphType);

    if (format === 'dot') {
      writeFileSync(outputPath, dotString, 'utf-8');
    } else {
      await graph.visualize.render(dotString, { format, path: outputPath });
    }

    return { output: outputPath };
  } finally {
    await graph.close();
  }
}