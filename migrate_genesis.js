const sqlite3 = require('sqlite3');
const path = require('path');

const dbFiles = [
    "D:\\dev\\simple-graph\\cda-import-test.db",
    "D:\\dev\\simple-graph\\temp-db-1755429828299.db",
    "D:\\dev\\simple-graph\\temp-db-1755429829219.db",
    "D:\\dev\\simple-graph\\conceptual-lexicon-import-test.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T17-42-14.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T17-48-00.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T18-02-05.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T18-08-49.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T18-10-08.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T19-01-56.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\cdaImportTest-2025-08-12T19-04-32.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T17-42-25.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T17-48-00.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T18-02-05.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T18-08-49.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T18-10-08.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T19-01-56.db",
    "D:\\dev\\simple-graph\\data\\databases\\archive\\testRun-2025-08-12T19-04-32.db",
    "D:\\dev\\simple-graph\\www\\exports\\the-loom-v2.db"
];

const sql = `INSERT INTO nodes (body)
SELECT json_object(
    'id', '0',
    'label', 'System',
    'body', 'This is the genesis node, the root of the graph.',
    'createdAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE id = '0');`;

console.log('Genesis Node Migration Report');
console.log('=============================');

async function migrateFile(filePath) {
    return new Promise((resolve) => {
        const db = new sqlite3.Database(filePath, (err) => {
            if (err) {
                console.log(`- ${filePath}: SKIPPED (Error connecting: ${err.message})`);
                resolve();
                return;
            }
        });

        db.run(sql, function(err) {
            if (err) {
                console.log(`- ${filePath}: ERROR (INSERT failed: ${err.message})`);
            } else {
                if (this.changes > 0) {
                    console.log(`- ${filePath}: SUCCESS (Genesis node added)`);
                } else {
                    console.log(`- ${filePath}: SUCCESS (Genesis node already exists)`);
                }
            }
            db.close();
            resolve();
        });
    });
}

async function runMigration() {
    for (const file of dbFiles) {
        await migrateFile(file);
    }
    console.log('\nMigration process complete.');
}

runMigration();
