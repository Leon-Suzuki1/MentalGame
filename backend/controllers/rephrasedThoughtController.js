const db = require('../database');

// Save a new rephrased thought pair
exports.saveThoughtPair = (req, res) => {
    const userId = req.user.id; // From authMiddleware
    const { negative_thought, rephrased_thought, category } = req.body;

    if (!negative_thought || negative_thought.trim() === "" || !rephrased_thought || rephrased_thought.trim() === "") {
        return res.status(400).json({ message: "Negative thought and rephrased thought cannot be empty." });
    }

    const sql = `INSERT INTO rephrased_thoughts (user_id, negative_thought, rephrased_thought, category, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`;
    db.run(sql, [userId, negative_thought.trim(), rephrased_thought.trim(), category ? category.trim() : null], function(err) {
        if (err) {
            return res.status(500).json({ message: "Error saving thought pair.", error: err.message });
        }
        res.status(201).json({
            message: "Thought pair saved successfully.",
            data: {
                id: this.lastID,
                user_id: userId,
                negative_thought: negative_thought.trim(),
                rephrased_thought: rephrased_thought.trim(),
                category: category ? category.trim() : null
            }
        });
    });
};

// Get all saved thought pairs for the logged-in user
exports.getAllThoughtPairs = (req, res) => {
    const userId = req.user.id;
    const sql = "SELECT id, negative_thought, rephrased_thought, category, created_at FROM rephrased_thoughts WHERE user_id = ? ORDER BY created_at DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching thought pairs.", error: err.message });
        }
        res.json({ message: "Thought pairs fetched successfully.", data: rows });
    });
};

// Get a specific thought pair by ID
exports.getThoughtPairById = (req, res) => {
    const userId = req.user.id;
    const thoughtId = req.params.id;
    const sql = "SELECT id, negative_thought, rephrased_thought, category, created_at FROM rephrased_thoughts WHERE id = ? AND user_id = ?";
    db.get(sql, [thoughtId, userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching thought pair.", error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: "Thought pair not found or not authorized." });
        }
        res.json({ message: "Thought pair fetched successfully.", data: row });
    });
};

// Update an existing thought pair
exports.updateThoughtPair = (req, res) => {
    const userId = req.user.id;
    const thoughtId = req.params.id;
    const { negative_thought, rephrased_thought, category } = req.body;

    if (!negative_thought || negative_thought.trim() === "" || !rephrased_thought || rephrased_thought.trim() === "") {
        return res.status(400).json({ message: "Negative thought and rephrased thought cannot be empty." });
    }

    const sql = `UPDATE rephrased_thoughts
                 SET negative_thought = ?, rephrased_thought = ?, category = ?
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [negative_thought.trim(), rephrased_thought.trim(), category ? category.trim() : null, thoughtId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Error updating thought pair.", error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Thought pair not found or not authorized to update." });
        }
        res.json({ message: "Thought pair updated successfully." });
    });
};

// Delete a thought pair
exports.deleteThoughtPair = (req, res) => {
    const userId = req.user.id;
    const thoughtId = req.params.id;
    const sql = "DELETE FROM rephrased_thoughts WHERE id = ? AND user_id = ?";
    db.run(sql, [thoughtId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Error deleting thought pair.", error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Thought pair not found or not authorized to delete." });
        }
        res.json({ message: "Thought pair deleted successfully." });
    });
};
