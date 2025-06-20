const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "main.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                calming_strategies TEXT,
                CONSTRAINT email_unique UNIQUE (email)
            )`, (err) => {
                if (err) { /* console.log('Users table already exists or error creating it.'); */ }
                else { console.log('Users table checked/created successfully.'); }
            });

            db.run(`CREATE TABLE IF NOT EXISTS coping_box_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_text TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) { /* console.log('Coping box items table already exists or error creating it.'); */ }
                else { console.log('Coping box items table checked/created successfully.'); }
            });

            // Add the new journal_entries table creation here
            db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) { /* console.log('Journal entries table already exists or error creating it.'); */ }
                else { console.log('Journal entries table checked/created successfully.'); }
            });
        });
    }
});

module.exports = db;
