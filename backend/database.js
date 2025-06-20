const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database. Creates the file if it does not exist.
const DBSOURCE = "main.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            calming_strategies TEXT,
            CONSTRAINT email_unique UNIQUE (email)
        )`, (err) => {
            if (err) {
                // Table already created or other error
                console.log('Users table already exists or error creating it.');
            } else {
                // Table just created, creating some rows
                console.log('Users table created successfully.');
            }
        });
    }
});

module.exports = db;
