const db = require('../database');

// Function to award a badge to a user if they haven't earned it already
exports.awardBadgeIfCriteriaMet = (userId, badgeName) => {
    return new Promise((resolve, reject) => {
        // First, get the badge_id from the badge_name
        db.get("SELECT id FROM badges WHERE name = ?", [badgeName], (err, badge) => {
            if (err) {
                console.error(`Error finding badge '${badgeName}':`, err.message);
                return reject(new Error(`Database error finding badge: ${badgeName}`));
            }
            if (!badge) {
                // console.warn(`Badge '${badgeName}' not found in database.`);
                return resolve({ message: `Badge '${badgeName}' not found.`, awarded: false });
            }

            const badgeId = badge.id;

            // Check if user already has this badge
            db.get("SELECT * FROM user_earned_badges WHERE user_id = ? AND badge_id = ?", [userId, badgeId], (err, existingEntry) => {
                if (err) {
                    console.error(`Error checking if user ${userId} has badge ${badgeId}:`, err.message);
                    return reject(new Error('Database error checking existing badge.'));
                }

                if (existingEntry) {
                    // console.log(`User ${userId} already has badge '${badgeName}'.`);
                    return resolve({ message: `User already has badge '${badgeName}'.`, awarded: false, alreadyHad: true });
                } else {
                    // Award the badge
                    db.run("INSERT INTO user_earned_badges (user_id, badge_id, earned_at) VALUES (?, ?, datetime('now'))",
                           [userId, badgeId], function(insertErr) {
                        if (insertErr) {
                            console.error(`Error awarding badge '${badgeName}' to user ${userId}:`, insertErr.message);
                            return reject(new Error(`Database error awarding badge: ${badgeName}`));
                        }
                        console.log(`Badge '${badgeName}' (ID: ${badgeId}) awarded to user ${userId}.`);
                        resolve({ message: `Badge '${badgeName}' awarded!`, awarded: true });
                    });
                }
            });
        });
    });
};

// API Controllers (to be routed later)
exports.getAllUserBadges = (req, res) => {
    const userId = req.user.id;
    const sql = `SELECT b.id, b.name, b.description, b.icon_url, ueb.earned_at
                 FROM user_earned_badges ueb
                 JOIN badges b ON ueb.badge_id = b.id
                 WHERE ueb.user_id = ?
                 ORDER BY ueb.earned_at DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching user badges.", error: err.message });
        }
        res.json({ message: "User badges fetched successfully.", data: rows });
    });
};

exports.getAllSystemBadges = (req, res) => {
    const sql = "SELECT id, name, description, icon_url FROM badges ORDER BY name";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching all system badges.", error: err.message });
        }
        res.json({ message: "All system badges fetched successfully.", data: rows });
    });
};
