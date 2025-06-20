const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { updateUserStreak } = require('./streaksController'); // Import streak updater

const JWT_SECRET = 'your_very_secret_key_that_should_be_in_env';

// register function remains the same...
// Register function remains the same as before
exports.register = async (req, res) => {
    const { email, password, age, gender, calming_strategies } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const checkUserSql = "SELECT email FROM users WHERE email = ?";
    db.get(checkUserSql, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking user existence.', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertSql = 'INSERT INTO users (email, password, age, gender, calming_strategies) VALUES (?,?,?,?,?)';
            db.run(insertSql, [email, hashedPassword, age, gender, calming_strategies], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Error registering new user.', error: err.message });
                }
                res.status(201).json({
                    message: 'User registered successfully!',
                    userId: this.lastID,
                    email: email,
                    age: age,
                    gender: gender,
                    calming_strategies: calming_strategies
                });
            });
        } catch (error) {
            res.status(500).json({ message: 'Error hashing password.', error: error.message });
        }
    });
};

exports.login = async (req, res) => { // Made async to potentially use await later if needed
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], async (err, user) => { // db.get callback is not async by default
        if (err) {
            return res.status(500).json({ message: 'Server error during login.', error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'Login failed. User not found.' });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Login failed. Incorrect password.' });
            }

            const payload = { user: { id: user.id, email: user.email } };

            jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) {
                        // Handle error in signing token
                        console.error("Error signing JWT:", err);
                        return res.status(500).json({ message: "Error signing token." });
                    }

                    // Update login streak
                    updateUserStreak(user.id, 'login')
                        .then(streakData => {
                            // console.log(`Login streak processed for user ${user.id}:`, streakData);
                            res.status(200).json({
                                message: 'Login successful!',
                                token: token,
                                user: {
                                    id: user.id,
                                    email: user.email,
                                    age: user.age,
                                    gender: user.gender
                                }
                                // Optionally include streakData if frontend needs it immediately
                                // streak: streakData
                            });
                        })
                        .catch(streakError => {
                            console.error(`Failed to update login streak for user ${user.id}:`, streakError);
                            // Decide how to handle: still log in user? Or return an error?
                            // For now, log in user but acknowledge streak error.
                            res.status(200).json({ // Or 207 Multi-Status if part of it failed
                                message: 'Login successful (streak update issue).',
                                token: token,
                                user: {
                                    id: user.id,
                                    email: user.email,
                                    age: user.age,
                                    gender: user.gender
                                },
                                streakError: "Could not update login streak."
                            });
                        });
                }
            );
        } catch (error) { // Catches bcrypt.compare error
            res.status(500).json({ message: 'Error during login password comparison.', error: error.message });
        }
    });
};
