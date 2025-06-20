const db = require('../database');
const { awardBadgeIfCriteriaMet } = require('./badgeController'); // Added

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

exports.updateUserStreak = (userId, streakType) => {
    return new Promise((resolve, reject) => {
        const todayStr = getTodayDateString();
        // const streakKey = streakType; // e.g., 'login', 'journaling' // Not used, streakType is used directly

        db.get("SELECT * FROM user_streaks WHERE user_id = ? AND streak_type = ?", [userId, streakType], (err, row) => {
            if (err) {
                console.error(`Error fetching ${streakType} streak for user ${userId}:`, err.message);
                return reject(err);
            }

            let newCurrentStreak, newLongestStreak;

            if (row) {
                // User has an existing streak record
                const lastActivityDate = new Date(row.last_activity_date);
                const today = new Date(todayStr); // Ensure comparison with date part only

                if (row.last_activity_date === todayStr) {
                    // console.log(`${streakType} activity already recorded today for user ${userId}.`);
                    return resolve(row); // No change to streak, already processed today
                }

                const diffTime = Math.abs(today - lastActivityDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                newCurrentStreak = row.current_streak;
                newLongestStreak = row.longest_streak;

                if (diffDays === 1) {
                    newCurrentStreak += 1;
                } else if (diffDays > 1) {
                    newCurrentStreak = 1; // Streak broken, reset to 1
                }
                // If diffDays is 0 it's handled by the row.last_activity_date === todayStr check

                if (newCurrentStreak > newLongestStreak) {
                    newLongestStreak = newCurrentStreak;
                }

                db.run("UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ? AND streak_type = ?",
                    [newCurrentStreak, newLongestStreak, todayStr, userId, streakType], function(updateErr) {
                        if (updateErr) {
                            console.error(`Error updating ${streakType} streak for user ${userId}:`, updateErr.message);
                            return reject(updateErr);
                        }
                        // Check for '5 Day Login Streak' badge
                        if (streakType === 'login' && newCurrentStreak === 5) {
                            awardBadgeIfCriteriaMet(userId, '5 Day Login Streak')
                                .then(badgeResult => console.log(`Badge attempt for '5 Day Login Streak' for user ${userId}: ${badgeResult.message}`))
                                .catch(badgeError => console.error(`Error awarding '5 Day Login Streak' for user ${userId}:`, badgeError));
                        }
                        resolve({user_id: userId, streak_type: streakType, current_streak: newCurrentStreak, longest_streak: newLongestStreak, last_activity_date: todayStr });
                    });

            } else {
                // No existing streak record, create one
                newCurrentStreak = 1;
                newLongestStreak = 1;
                db.run("INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date) VALUES (?, ?, ?, ?, ?)",
                    [userId, streakType, newCurrentStreak, newLongestStreak, todayStr], function(insertErr) {
                        if (insertErr) {
                            console.error(`Error creating ${streakType} streak for user ${userId}:`, insertErr.message);
                            return reject(insertErr);
                        }
                         // Check for '5 Day Login Streak' badge (also on creation, though less likely for login to start at 5)
                        if (streakType === 'login' && newCurrentStreak === 5) {
                             awardBadgeIfCriteriaMet(userId, '5 Day Login Streak')
                                .then(badgeResult => console.log(`Badge attempt for '5 Day Login Streak' for user ${userId}: ${badgeResult.message}`))
                                .catch(badgeError => console.error(`Error awarding '5 Day Login Streak' for user ${userId}:`, badgeError));
                        }
                        resolve({user_id: userId, streak_type: streakType, current_streak: newCurrentStreak, longest_streak: newLongestStreak, last_activity_date: todayStr });
                    });
            }
        });
    });
};

// API endpoint controller (remains as is)
exports.getUserStreaks = async (req, res) => {
    const userId = req.user.id; // from authMiddleware
    const streakType = req.params.streakType;

    if (!streakType) {
        return res.status(400).json({ message: "Streak type parameter is required." });
    }

    db.get("SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = ? AND streak_type = ?",
        [userId, streakType], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching streak data.", error: err.message });
        }
        if (row) {
            res.json({ message: "Streak data fetched successfully.", data: row });
        } else {
            res.json({
                message: "No streak data found, assuming 0.",
                data: { current_streak: 0, longest_streak: 0, last_activity_date: null }
            });
        }
    });
};
