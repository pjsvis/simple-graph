# sqlite-modern-config

This configuration represents a modern, robust, and production-ready set of best practices for SQLite.

---

## Connection-Based PRAGMAs

These settings are configured per-connection and are not persisted within the database file itself.

- `busy_timeout = 10000`: This is a crucial setting for concurrent environments. It instructs a connection to wait for up to 10,000 milliseconds (10 seconds) if it finds the database is locked by another process, rather than failing immediately. This significantly improves resilience in applications with multiple writers.

## Schema-Based PRAGMAs

These settings are persisted directly in the database file and apply to all connections once set.

- `journal_mode = WAL`: **Write-Ahead Logging** is the most significant PRAGMA for modern performance. It allows for concurrent reads and writes by writing changes into a separate `-wal` file before committing them to the main database file. This provides a substantial performance boost over the default `DELETE` mode.
- `synchronous = FULL`: This setting ensures the highest level of durability. When changes are committed, it pauses until the data is fully written to the disk, guaranteeing that the transaction is saved even in the event of a power failure. While `NORMAL` is slightly faster, `FULL` provides maximum safety.
- `foreign_keys = ON`: This enforces referential integrity between tables. For our `edges` table, it ensures that the `source` and `target` columns must correspond to a valid `id` in the `nodes` table, preventing orphaned edges and maintaining data consistency.
