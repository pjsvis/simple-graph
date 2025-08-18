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
    db.run("PRAGMA busy_timeout = 10000;");
    db.run("PRAGMA synchronous = FULL;");
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

      if (config.type === 'file' && (isTemporaryFile || config.cleanup)) {
        const filesToDelete = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
        for (const file of filesToDelete) {
          for (let i = 0; i < 5; i++) { // Retry up to 5 times
            try {
              if (existsSync(file)) {
                await unlink(file);
              }
              break; // Success, exit retry loop
            } catch (error: any) {
              if (error.code === 'EBUSY' && i < 4) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retrying
              } else {
                console.warn(`Failed to cleanup database file ${file}: ${error}`);
                break; // Give up on this file
              }
            }
          }
        }
      }
    },
  };

  return database;
}