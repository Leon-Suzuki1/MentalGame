const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "main.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Existing table creations (users, coping_box_items, journal_entries)
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

            db.run(`CREATE TABLE IF NOT EXISTS user_streaks (
                user_id INTEGER NOT NULL,
                streak_type TEXT NOT NULL,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_activity_date DATE,
                PRIMARY KEY (user_id, streak_type),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) { /* console.log('User streaks table already exists or error creating it.'); */ }
                else { console.log('User streaks table checked/created successfully.'); }
            });

            // Create badges table
            db.run(`CREATE TABLE IF NOT EXISTS badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                icon_url TEXT,
                criteria TEXT
            )`, (err) => {
                if (err) {
                    console.error('Error creating badges table:', err.message);
                } else {
                    console.log('Badges table checked/created successfully.');
                    // Pre-populate badges after table creation
                    const badgesToInsert = [
                        { name: 'First Coping Item', description: 'Added your first item to the Coping Box.', icon_url: 'icons/badge_coping_first.png', criteria: 'ADD_FIRST_COPING_ITEM' },
                        { name: 'First Journal Entry', description: 'Wrote your first journal entry.', icon_url: 'icons/badge_journal_first.png', criteria: 'CREATE_FIRST_JOURNAL_ENTRY' },
                        { name: '5 Day Login Streak', description: 'Logged in 5 days in a row.', icon_url: 'icons/badge_login_5_day.png', criteria: 'LOGIN_STREAK_5' },
                        { name: 'Mindful Start', description: 'Completed your first mindfulness exercise.', icon_url: 'icons/badge_mindful_start.png', criteria: 'MINDFULNESS_FIRST_EXERCISE'}
                    ];
                    // Using a loop with db.run for simplicity here, prepare statement is better for many inserts
                    badgesToInsert.forEach(badge => {
                        db.run("INSERT OR IGNORE INTO badges (name, description, icon_url, criteria) VALUES (?, ?, ?, ?)",
                               [badge.name, badge.description, badge.icon_url, badge.criteria],
                               (insertErr) => {
                                   if (insertErr) console.error("Error inserting badge:", badge.name, insertErr.message);
                               });
                    });
                    console.log("Initial badges checked/inserted.");
                }
            });

            // Create user_earned_badges table
            db.run(`CREATE TABLE IF NOT EXISTS user_earned_badges (
                user_id INTEGER NOT NULL,
                badge_id INTEGER NOT NULL,
                earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, badge_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) {
                    console.error('Error creating user_earned_badges table:', err.message);
                } else {
                    console.log('User earned badges table checked/created successfully.');
                }
            });
        });
    }
});

module.exports = db;
