import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createDatabase, type Database } from '../helpers/database';
import { SimpleGraph } from '../../src/SimpleGraph'; // Single import
import { unlink, mkdir, rm } from 'fs/promises'; // Import unlink, mkdir, and rm for file cleanup

const execPromise = promisify(exec);

const CLI_PATH = './src/cli.ts'; // Point to the TypeScript file

describe('CLI Integration Tests', () => {
  let db: Database;
  let graph: SimpleGraph;
  let testDbFile: string;
  let compiledCliPath: string; // Declare compiledCliPath here

  beforeAll(async () => {
    // Compile cli.ts to a temporary JS file
    compiledCliPath = `temp-cli-${Date.now()}.js`; // Assign unique name here
    console.log(`[DEBUG] compiledCliPath in beforeAll: ${compiledCliPath}`);
    try {
      await execPromise(`bun build ${CLI_PATH} --outfile ${compiledCliPath}`);
    } catch (error) {
      console.error('CLI compilation failed:', error);
      process.exit(1);
    }
  });

  beforeEach(async () => {
    // Create a unique database file for each test
    testDbFile = `test-cli-integration-${Date.now()}.db`;
    db = createDatabase({
      type: 'file',
      filename: testDbFile,
      cleanup: true, // Clean up after tests
    });
    graph = await SimpleGraph.connect({ path: testDbFile });

    // Insert some initial data for testing (genesis node is created by schema)
    await graph.nodes.add({ id: '1', type: 'person', properties: { name: 'Alice' } });
    await graph.nodes.add({ id: '2', type: 'person', properties: { name: 'Bob' } });
    await graph.edges.add({ from: '1', to: '2', type: 'knows' });
  });

  afterEach(async () => {
    await graph.close();
    // Add a small delay to ensure file handle is released before cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    db.close(); // Close the database connection and clean up file
  });

  afterAll(async () => {
    // Clean up the temporary compiled JS file
    try {
      await rm(compiledCliPath, { force: true }); // Use rm for the temporary file
    } catch (error) {
      console.warn(`Failed to cleanup compiled CLI file: ${error}`);
    }
  });

  // Helper function to run cli.js with the test database path
  const runCliCommand = async (command: string) => {
    return execPromise(`node ${compiledCliPath} ${command}`, {
      env: { ...process.env, SIMPLE_GRAPH_DB_PATH: testDbFile },
    });
  };

  test('should successfully call getNode for genesis node', async () => {
    const { stdout } = await runCliCommand('getNode 0');
    const result = JSON.parse(stdout);
    expect(result).toEqual({ id: '0', label: 'System', body: 'This is the genesis node, the root of the graph.', createdAt: expect.any(String) });
  });

  test('should successfully call find for a node', async () => {
    const { stdout } = await runCliCommand('find Alice');
    const result = JSON.parse(stdout);
    expect(result).toEqual([{ id: '1', type: 'person', properties: { name: 'Alice' } }]);
  });

  test('should successfully call forNode for a node with edges', async () => {
    const { stdout } = await runCliCommand('forNode 1');
    const result = JSON.parse(stdout);
    expect(result).toEqual([{ from: '1', to: '2', type: 'knows' }]);
  });

  test('should return null for getNode if node does not exist', async () => {
    const { stdout } = await runCliCommand('getNode 999');
    const result = JSON.parse(stdout);
    expect(result).toBeNull();
  });

  test('should return empty array for find if no matching node', async () => {
    const { stdout } = await runCliCommand('find NonExistent');
    const result = JSON.parse(stdout);
    expect(result).toEqual([]);
  });

  test('should return empty array for forNode if no edges exist', async () => {
    const { stdout } = await runCliCommand('forNode 0'); // Genesis node has no outgoing edges in test setup
    const result = JSON.parse(stdout);
    expect(result).toEqual([]);
  });

  test('should print error to stderr for unknown command', async () => {
    try {
      await runCliCommand('unknownCommand');
      // If it reaches here, the command did not throw an error as expected
      expect.fail('Command did not throw an error for unknown command.');
    } catch (error: any) {
      expect(error.stderr).toContain("Error: Unknown command 'unknownCommand'.");
      expect(error.code).toBe(1);
    }
  });

  test('should print error to stderr if getNode is missing ID', async () => {
    try {
      await runCliCommand('getNode');
      expect.fail('Command did not throw an error for missing ID.');
    } catch (error: any) {
      expect(error.stderr).toContain('Error: getNode requires an ID.');
      expect(error.code).toBe(1);
    }
  });

  test('should print error to stderr if find is missing query', async () => {
    try {
      await runCliCommand('find');
      expect.fail('Command did not throw an error for missing query.');
    } catch (error: any) {
      expect(error.stderr).toContain('Error: find requires a query string.');
      expect(error.code).toBe(1);
    }
  });

  test('should print error to stderr if forNode is missing ID', async () => {
    try {
      await runCliCommand('forNode');
      expect.fail('Command did not throw an error for missing ID.');
    } catch (error: any) {
      expect(error.stderr).toContain('Error: forNode requires an ID.');
      expect(error.code).toBe(1);
    }
  });
});