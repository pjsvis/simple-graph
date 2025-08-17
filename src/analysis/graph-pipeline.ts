
import { createDatabaseConnection, type DatabaseConnection as Database } from '../database/connection';
import { generateCannedDotGraph } from '../visualization/canned-graphs';
import { renderDotToImage, isGraphvizInstalled } from '../visualization/renderers/graphviz-renderer';
import type { GraphType, ImageType } from '../types/visualization-types';
import { writeFileSync } from 'fs';

/**
 * Orchestrates the full pipeline of generating a graph visualization.
 *
 * 1. Connects to the database.
 * 2. Generates the specified canned DOT graph string.
 * 3. If the format is 'dot', it saves the string to a file.
 * 4. If the format is 'svg' or 'png', it renders the DOT string to an image.
 * 5. Closes the database connection.
 *
 * @param {string} dbPath Path to the SQLite database file.
 * @param {GraphType} graphType The type of canned graph to generate.
 * @param {ImageType | 'dot'} format The desired output format.
 * @param {string} outputPath The absolute path to save the output file.
 * @returns {Promise<{ output: string }>} A promise that resolves with the path to the generated file.
 */
export async function generateVisualization(
  dbPath: string,
  graphType: GraphType,
  format: ImageType | 'dot',
  outputPath: string
): Promise<{ output: string }> {
  let db: Database | null = null;
  try {
    // 1. Connect to the database
    db = await createDatabaseConnection({ type: 'file', filename: dbPath });

    // 2. Generate the DOT graph string
    const dotString = await generateCannedDotGraph(graphType, db);

    // 3. Output the result
    if (format === 'dot') {
      writeFileSync(outputPath, dotString, 'utf-8');
    } else {
      // Check for Graphviz dependency before attempting to render
      if (!(await isGraphvizInstalled())) {
        throw new Error('Graphviz is not installed. Cannot render PNG/SVG images.');
      }
      await renderDotToImage(dotString, format, outputPath);
    }

    return { output: outputPath };

  } finally {
    // 5. Close the database connection
    if (db) {
      await db.close();
    }
  }
}
