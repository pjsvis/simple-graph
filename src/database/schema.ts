/**
 * Returns the SQL schema for creating the graph database tables, FTS virtual table, and indexes
 * @returns SQL string for creating nodes, edges, and nodes_fts tables with their indexes and triggers
 */
export function createSchema(): string {
  return `
-- Main table for storing graph nodes
CREATE TABLE IF NOT EXISTS nodes (
    body TEXT,
    id   TEXT GENERATED ALWAYS AS (json_extract(body, '$.id')) VIRTUAL NOT NULL UNIQUE
);

-- Index on the virtual 'id' column for fast lookups
CREATE INDEX IF NOT EXISTS id_idx ON nodes(id);

-- Main table for storing graph edges
CREATE TABLE IF NOT EXISTS edges (
    source     TEXT,
    target     TEXT,
    properties TEXT,
    UNIQUE(source, target, properties) ON CONFLICT REPLACE,
    FOREIGN KEY(source) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Indexes on source and target for fast edge traversal
CREATE INDEX IF NOT EXISTS source_idx ON edges(source);
CREATE INDEX IF NOT EXISTS target_idx ON edges(target);

-- FTS5 virtual table for full-text search on the 'body' of nodes
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
    body,
    content='nodes',
    content_rowid='rowid'
);

-- Triggers to keep the FTS table synchronized with the nodes table
CREATE TRIGGER IF NOT EXISTS nodes_after_insert AFTER INSERT ON nodes BEGIN
    INSERT INTO nodes_fts(rowid, body) VALUES (new.rowid, new.body);
END;

CREATE TRIGGER IF NOT EXISTS nodes_after_delete AFTER DELETE ON nodes BEGIN
    INSERT INTO nodes_fts(nodes_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
END;

CREATE TRIGGER IF NOT EXISTS nodes_after_update AFTER UPDATE ON nodes BEGIN
    INSERT INTO nodes_fts(nodes_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
    INSERT INTO nodes_fts(rowid, body) VALUES (new.rowid, new.body);
END;
`;
}
