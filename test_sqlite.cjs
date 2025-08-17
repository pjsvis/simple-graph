const sqlite3 = require('sqlite3');
const { promisify } = require('util');

const dbPath = ':memory:'; // Use in-memory for simplicity

try {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Connection error:', err.message);
            return;
        }
        console.log('Successfully connected to database.');

        try {
            const run = promisify(db.run.bind(db));
            const get = promisify(db.get.bind(db));
            const all = promisify(db.all.bind(db));
            const exec = promisify(db.exec.bind(db));
            const close = promisify(db.close.bind(db));

            console.log('Promisified methods successfully.');
            db.close(); // Close the connection
        } catch (e) {
            console.error('Error promisifying methods:', e.message);
        }
    });
} catch (e) {
    console.error('Error creating new sqlite3.Database:', e.message);
}
