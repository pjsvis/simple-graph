import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

// Helper to promisify sqlite3 methods
export interface Database {
  run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
  dbPath?: string; // Expose path for reference
}

export interface DatabaseConfig {
  type: 'memory' | 'file';
  filename?: string; // Required for type 'file' unless a temp name is desired
  cleanup?: boolean; // Whether to delete file after tests
}

export function createDatabase(config: DatabaseConfig): Database {
  let dbPath: string;
  let isTemporaryFile = false;

  if (config.type === 'memory') {
    dbPath = ':memory:';
  } else { // type is 'file'
    if (config.filename) {
      dbPath = config.filename;
    } else {
      // Create a unique temporary filename for ingestion tests
      dbPath = `temp-db-${Date.now()}.db`;
      isTemporaryFile = true;
    }
  }

  const db = new sqlite3.Database(dbPath);

  // Configure high-concurrency settings
  db.serialize(() => {
    db.run("PRAGMA journal_mode=WAL;");
    db.run("PRAGMA busy_timeout = 5000;");
    db.run("PRAGMA synchronous = NORMAL;");
    db.run("PRAGMA foreign_keys = ON;");
  });

  const database: Database = {
    run: promisify(db.run.bind(db)),
    get: promisify(db.get.bind(db)),
    all: promisify(db.all.bind(db)),
    exec: promisify(db.exec.bind(db)),
    dbPath: dbPath,
    close: async () => {
      await promisify(db.close.bind(db))();

      // Clean up file if it's a temporary file or if cleanup is explicitly requested
      if (config.type === 'file' && (isTemporaryFile || config.cleanup)) {
        try {
          if (existsSync(dbPath)) {
            await unlink(dbPath);
          }
          // Also clean up WAL and SHM files if they exist
          const walPath = `${dbPath}-wal`;
          const shmPath = `${dbPath}-shm`;
          if (existsSync(walPath)) {
            await unlink(walPath);
          }
          if (existsSync(shmPath)) {
            await unlink(shmPath);
          }
        } catch (error) {
          console.warn(`Failed to cleanup database file: ${error}`);
        }
      }
    },
  };

  return database;
}