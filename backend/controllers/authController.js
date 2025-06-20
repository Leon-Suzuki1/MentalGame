const bcrypt = require('bcryptjs');
const db = require('../database');

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

// Updated login function
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Server error during login.', error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'Login failed. User not found.' });
        }

        // Compare password
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Login failed. Incorrect password.' });
            }

            // Login successful
            // For now, just send a success message. Later, we'll implement JWT token generation here.
            res.status(200).json({
                message: 'Login successful!',
                user: {
                    id: user.id,
                    email: user.email,
                    age: user.age,
                    gender: user.gender
                    // Do NOT send password back
                }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error comparing passwords.', error: error.message });
        }
    });
};
