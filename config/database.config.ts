export const DatabaseConfig = {
  defaultPath: 'data/databases/',
  archivePath: 'data/databases/archive/',

  // Production databases
  theLoomV2: 'the-loom-v2.db',
  conceptualLexicon: 'conceptual-lexicon.db',
  cdaEnhanced: 'cda-enhanced.db',
  unified: 'unified-knowledge.db',

  // Test databases
  testRun: 'test-run.db',
  cdaImportTest: 'cda-import-test.db',

  // High-concurrency options
  options: {
    verbose: false,
    timeout: 30000,
    readonly: false,

    // High-concurrency PRAGMA settings
    pragmas: {
      journal_mode: 'WAL',
      busy_timeout: 5000,
      synchronous: 'NORMAL',
      foreign_keys: 'ON'
    }
  }
}
