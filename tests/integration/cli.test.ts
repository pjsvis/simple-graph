import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createDatabase, type Database } from '../helpers/database';
import { SimpleGraph } from '../../src/SimpleGraph';

const execPromise = promisify(exec);

const TEST_DB_FILE = 'test-cli-integration.db';
const CLI_PATH = './src/cli.ts'; // Point to the TypeScript file

describe('CLI Integration Tests', () => {
  let db: Database;
  let graph: SimpleGraph;

  beforeAll(async () => {
    // Create a fresh database for integration tests
    db = createDatabase({
      type: 'file',
      filename: TEST_DB_FILE,
      cleanup: true, // Clean up after tests
    });
    graph = await SimpleGraph.connect({ path: TEST_DB_FILE });

    // Insert some initial data for testing (genesis node is created by schema)
    await graph.nodes.add({ id: '1', type: 'person', properties: { name: 'Alice' } });
    await graph.nodes.add({ id: '2', type: 'person', properties: { name: 'Bob' } });
    await graph.edges.add({ from: '1', to: '2', type: 'knows' });
  });

  afterAll(async () => {
    await graph.close();
    db.close(); // Close the database connection
  });

  // Helper function to run cli.js with the test database path
  const runCliCommand = async (command: string) => {
    return execPromise(`npx ts-node ${CLI_PATH} ${command}`, {
      env: { ...process.env, SIMPLE_GRAPH_DB_PATH: TEST_DB_FILE },
    });
  };

  it('should successfully call getNode for genesis node', async () => {
    const { stdout } = await runCliCommand('getNode 0');
    const result = JSON.parse(stdout);
    expect(result).toEqual({ id: '0', label: 'System', body: 'This is the genesis node, the root of the graph.', createdAt: expect.any(String) });
  });

  it('should successfully call find for a node', async () => {
    const { stdout } = await runCliCommand('find Alice');
    const result = JSON.parse(stdout);
    expect(result).toEqual([{ id: '1', type: 'person', properties: { name: 'Alice' } }]);
  });

  it('should successfully call forNode for a node with edges', async () => {
    const { stdout } = await runCliCommand('forNode 1');
    const result = JSON.parse(stdout);
    expect(result).toEqual([{ from: '1', to: '2', type: 'knows' }]);
  });

  it('should return null for getNode if node does not exist', async () => {
    const { stdout } = await runCliCommand('getNode 999');
    const result = JSON.parse(stdout);
    expect(result).toBeNull();
  });

  it('should return empty array for find if no matching node', async () => {
    const { stdout } = await runCliCommand('find NonExistent');
    const result = JSON.parse(stdout);
    expect(result).toEqual([]);
  });

  it('should return empty array for forNode if no edges exist', async () => {
    const { stdout } = await runCliCommand('forNode 0'); // Genesis node has no outgoing edges in test setup
    const result = JSON.parse(stdout);
    expect(result).toEqual([]);
  });

  it('should print error to stderr for unknown command', async () => {
    try {
      await runCliCommand('unknownCommand');
      // If it reaches here, the command did not throw an error as expected
      expect.fail('Command did not throw an error for unknown command.');
    } catch (error: any) {
      expect(error.stderr).toContain("Error: Unknown command 'unknownCommand'.");
      expect(error.code).toBe(1);
    }
  });

  it('should print error to stderr if getNode is missing ID', async () => {
    try {
      await runCliCommand('getNode');
      expect.fail('Command did not throw an error for missing ID.');
    } catch (error: any) {
      expect(error.stderr).toContain('Error: getNode requires an ID.');
      expect(error.code).toBe(1);
    }
  });

  it('should print error to stderr if find is missing query', async () => {
    try {
      await runCliCommand('find');
      expect.fail('Command did not throw an error for missing query.');
    } catch (error: any) {
      expect(error.stderr).toContain('Error: find requires a query string.');
      expect(error.code).toBe(1);
    }
  });

  it('should print error to stderr if forNode is missing ID', async () => {
    try {
      await runCliCommand('forNode');
      expect.fail('Command did not throw an error for missing ID.');
    } catch (error: any) {
      expect(error.stderr).toContain('Error: forNode requires an ID.');
      expect(error.code).toBe(1);
    }
  });
});