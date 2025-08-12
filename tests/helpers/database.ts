import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

// Helper to promisify sqlite3 methods
export interface Database {
  run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>
  get: (sql: string, params?: any[]) => Promise<any>
  all: (sql: string, params?: any[]) => Promise<any[]>
  exec: (sql: string) => Promise<void>
  close: () => Promise<void>
}

export interface DatabaseConfig {
  type: 'memory' | 'file' | 'test-safe'
  filename?: string
  cleanup?: boolean // Whether to delete file after tests
  useTestDatabase?: boolean // Whether to use the safe test database
}

export function createDatabase(config: DatabaseConfig = { type: 'memory' }): Database {
  let dbPath: string

  if (config.type === 'memory') {
    dbPath = ':memory:'
  } else if (config.type === 'test-safe') {
    // Use the safe test database path
    dbPath = config.useTestDatabase ? 'data/databases/test-run.db' : 'cda-import-test.db'
  } else {
    dbPath = config.filename || 'test-graph.db'
  }

  const db = new sqlite3.Database(dbPath)

  // Configure high-concurrency settings immediately after connection
  db.serialize(() => {
    // Enable Write-Ahead Logging for improved concurrency
    db.run("PRAGMA journal_mode=WAL;")

    // Set busy timeout to 5 seconds to handle concurrent access
    db.run("PRAGMA busy_timeout = 5000;")

    // Set synchronous mode to NORMAL for better performance
    db.run("PRAGMA synchronous = NORMAL;")

    // Enable foreign key constraints
    db.run("PRAGMA foreign_keys = ON;")
  })

  const database: Database = {
    run: promisify(db.run.bind(db)),
    get: promisify(db.get.bind(db)),
    all: promisify(db.all.bind(db)),
    exec: promisify(db.exec.bind(db)),
    close: async () => {
      await promisify(db.close.bind(db))()

      // Clean up file if requested
      if (config.type === 'file' && config.cleanup && config.filename) {
        try {
          if (existsSync(config.filename)) {
            await unlink(config.filename)
          }
        } catch (error) {
          console.warn(`Failed to cleanup database file: ${error}`)
        }
      }
    }
  }

  return database
}

export async function cleanupDatabase(filename: string) {
  try {
    if (existsSync(filename)) {
      await unlink(filename)
    }
  } catch (error) {
    console.warn(`Failed to cleanup database file: ${error}`)
  }
}
