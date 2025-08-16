import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMemoryDatabase } from '../../src/database/connection';
import { createSchema } from '../../src/database/schema';
import { fullTextSearch } from '../../src/database/search';
import { DatabaseConnection } from '../../src/types/base-types';


describe('Full-text search', () => {
  let connection: DatabaseConnection;

  beforeAll(async () => {
    connection = await createMemoryDatabase();
    await connection.exec(createSchema());

    // Insert some sample data
    await connection.run("INSERT INTO nodes (body) VALUES (?)", [JSON.stringify({ id: 'node-1', content: 'This is a test node with some interesting content.' })]);
    await connection.run("INSERT INTO nodes (body) VALUES (?)", [JSON.stringify({ id: 'node-2', content: 'Another node, this one is about cats.' })]);
    await connection.run("INSERT INTO nodes (body) VALUES (?)", [JSON.stringify({ id: 'node-3', content: 'A third node, this one is about dogs and cats.' })]);
  });

  afterAll(async () => {
    await connection.close();
  });

  it('should return nodes that match the search query', async () => {
    const results = await fullTextSearch(connection, 'cats');
    expect(results).toHaveLength(2);
    expect(results).toContain('node-2');
    expect(results).toContain('node-3');
  });

  it('should return an empty array if no nodes match the search query', async () => {
    const results = await fullTextSearch(connection, 'zebras');
    expect(results).toHaveLength(0);
  });

  it('should handle complex queries', async () => {
    const results = await fullTextSearch(connection, 'dogs AND cats');
    expect(results).toHaveLength(1);
    expect(results).toContain('node-3');
  });
});
