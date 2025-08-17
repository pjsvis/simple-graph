
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ImageType } from '../../types/visualization-types';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

/**
 * Checks if Graphviz is installed by checking for the 'dot' command.
 * @returns {Promise<boolean>} True if Graphviz is installed, false otherwise.
 */
export async function isGraphvizInstalled(): Promise<boolean> {
  try {
    await execAsync('dot -V');
    return true;
  } catch (error) {
    console.error('Graphviz not found. Please install it to render graphs.');
    return false;
  }
}

/**
 * Renders a DOT string to an image file using Graphviz.
 * This implementation writes the DOT string to a temporary file to avoid
 * potential hangs when passing input via stdin to the child process on some platforms.
 * @param {string} dotString The DOT graph content.
 * @param {ImageType} format The output image format ('svg' or 'png').
 * @param {string} outputPath The absolute path to save the output file.
 * @returns {Promise<void>} A promise that resolves when the file is created.
 */
export async function renderDotToImage(
  dotString: string,
  format: ImageType,
  outputPath: string
): Promise<void> {
  const tempDotFile = join(tmpdir(), `simple-graph-temp-${Date.now()}.dot`);
  try {
    writeFileSync(tempDotFile, dotString, 'utf-8');

    const command = `dot -T${format} -o "${outputPath}" "${tempDotFile}"`;
    const { stderr } = await execAsync(command);

    if (stderr) {
      throw new Error(`Graphviz stderr: ${stderr}`);
    }
  } finally {
    if (existsSync(tempDotFile)) {
      unlinkSync(tempDotFile);
    }
  }
}
