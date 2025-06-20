const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "main.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                calming_strategies TEXT,
                CONSTRAINT email_unique UNIQUE (email)
            )`, (err) => {
                if (err) { console.error('Error creating users table:', err.message); }
                else { console.log('Users table checked/created successfully.'); }
            });

            // Coping Box Items table
            db.run(`CREATE TABLE IF NOT EXISTS coping_box_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_text TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) { console.error('Error creating coping_box_items table:', err.message); }
                else { console.log('Coping box items table checked/created successfully.'); }
            });

            // Journal Entries table
            db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) { console.error('Error creating journal_entries table:', err.message); }
                else { console.log('Journal entries table checked/created successfully.'); }
            });

            // User Streaks table
            db.run(`CREATE TABLE IF NOT EXISTS user_streaks (
                user_id INTEGER NOT NULL,
                streak_type TEXT NOT NULL,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_activity_date DATE,
                PRIMARY KEY (user_id, streak_type),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) { console.error('Error creating user_streaks table:', err.message); }
                else { console.log('User streaks table checked/created successfully.'); }
            });

            // Badges table
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
                    const badgesToInsert = [
                        { name: 'First Coping Item', description: 'Added your first item to the Coping Box.', icon_url: 'icons/badge_coping_first.png', criteria: 'ADD_FIRST_COPING_ITEM' },
                        { name: 'First Journal Entry', description: 'Wrote your first journal entry.', icon_url: 'icons/badge_journal_first.png', criteria: 'CREATE_FIRST_JOURNAL_ENTRY' },
                        { name: '5 Day Login Streak', description: 'Logged in 5 days in a row.', icon_url: 'icons/badge_login_5_day.png', criteria: 'LOGIN_STREAK_5' },
                        { name: 'Mindful Start', description: 'Completed your first mindfulness exercise.', icon_url: 'icons/badge_mindful_start.png', criteria: 'MINDFULNESS_FIRST_EXERCISE'},
                        { name: 'First Game Played', description: 'Completed your first round of the Thought Matching Game.', icon_url: 'icons/badge_game_first.png', criteria: 'GAME_FIRST_ROUND_COMPLETE' } // Added
                    ];
                    const stmt = db.prepare("INSERT OR IGNORE INTO badges (name, description, icon_url, criteria) VALUES (?, ?, ?, ?)");
                    badgesToInsert.forEach(badge => {
                        stmt.run(badge.name, badge.description, badge.icon_url, badge.criteria, (insertErr) => {
                            if (insertErr) console.error("Error inserting badge:", badge.name, insertErr.message);
                        });
                    });
                    stmt.finalize((finalizeErr) => {
                        if (finalizeErr) console.error("Error finalizing badge insertion statement:", finalizeErr.message);
                        else console.log("Initial badges checked/inserted (including First Game Played).");
                    });
                }
            });

            // User Earned Badges table
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

            // Rephrased Thoughts table
            db.run(`CREATE TABLE IF NOT EXISTS rephrased_thoughts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                negative_thought TEXT NOT NULL,
                rephrased_thought TEXT NOT NULL,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) {
                    console.error('Error creating rephrased_thoughts table:', err.message);
                } else {
                    console.log('Rephrased thoughts table checked/created successfully.');
                }
            });

            // Game Matching Pairs table
            db.run(`CREATE TABLE IF NOT EXISTS game_matching_pairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                negative_thought TEXT UNIQUE NOT NULL,
                healthy_alternative TEXT NOT NULL,
                difficulty INTEGER DEFAULT 1,
                category TEXT
            )`, (err) => {
                if (err) {
                    console.error("Error creating game_matching_pairs table:", err.message);
                } else {
                    console.log('Game matching pairs table checked/created successfully.');

                    const gamePairsToInsert = [
                        { negative: "I'm a failure at everything I try.", healthy: "I've had setbacks, but I've also succeeded. I can learn from this.", category: "Self-esteem" },
                        { negative: "Everyone is probably judging me.", healthy: "Most people are focused on themselves. I can't control others' thoughts, only my reactions.", category: "Social Anxiety" },
                        { negative: "This is too hard, I'll never get it.", healthy: "This is challenging, but I can break it down and ask for help if needed.", category: "Perfectionism" },
                        { negative: "I always mess things up.", healthy: "I make mistakes sometimes, like everyone. It's an opportunity to grow.", category: "Self-esteem" },
                        { negative: "No one understands me.", healthy: "It can feel lonely, but I can try to communicate my feelings more clearly.", category: "Relationships" },
                        { negative: "What if something terrible happens?", healthy: "I can focus on what I can control and deal with challenges as they come.", category: "General Anxiety" },
                        { negative: "I'm not good enough.", healthy: "I have inherent worth, and my value doesn't depend on external achievements.", category: "Self-esteem" },
                        { negative: "It's all my fault.", healthy: "I can take responsibility for my part, but many factors are usually involved.", category: "Guilt" },
                        { negative: "I'll never be happy.", healthy: "Happiness isn't constant, but I can find moments of joy and work towards contentment.", category: "Depressive Thoughts" },
                        { negative: "I shouldn't feel this way.", healthy: "My feelings are valid, even if uncomfortable. It's okay to feel what I feel.", category: "Emotional Regulation" }
                    ];

                    const stmt = db.prepare("INSERT OR IGNORE INTO game_matching_pairs (negative_thought, healthy_alternative, category, difficulty) VALUES (?, ?, ?, 1)");
                    gamePairsToInsert.forEach(pair => {
                        stmt.run(pair.negative, pair.healthy, pair.category, (insertErr) => {
                            if (insertErr) console.error(`Error inserting game pair '${pair.negative}':`, insertErr.message);
                        });
                    });
                    stmt.finalize((finalizeErr) => {
                        if (finalizeErr) console.error("Error finalizing game pair insertion statement:", finalizeErr.message);
                        else console.log("Initial game matching pairs checked/inserted.");
                    });
                }
            });

        });
    }
});

module.exports = db;
