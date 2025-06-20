const db = require('../database');

// Create a new journal entry
exports.createJournalEntry = (req, res) => {
    const userId = req.user.id; // From authMiddleware
    const { title, content } = req.body;

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Journal entry content cannot be empty." });
    }

    const sql = `INSERT INTO journal_entries (user_id, title, content, created_at, updated_at)
                 VALUES (?, ?, ?, datetime('now'), datetime('now'))`;
    db.run(sql, [userId, title ? title.trim() : null, content.trim()], function(err) {
        if (err) {
            return res.status(500).json({ message: "Error creating journal entry.", error: err.message });
        }
        res.status(201).json({
            message: "Journal entry created successfully.",
            data: { id: this.lastID, user_id: userId, title: title ? title.trim() : null, content: content.trim() }
        });
    });
};

// Get all journal entries for the logged-in user
exports.getAllJournalEntries = (req, res) => {
    const userId = req.user.id;
    // Simple pagination: ?page=1&limit=10 (optional for now, but good to consider)
    // For now, just sort by newest first
    const sql = "SELECT id, title, content, created_at, updated_at FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching journal entries.", error: err.message });
        }
        res.json({ message: "Journal entries fetched successfully.", data: rows });
    });
};

// Get a specific journal entry
exports.getJournalEntryById = (req, res) => {
    const userId = req.user.id;
    const entryId = req.params.entryId;
    const sql = "SELECT id, title, content, created_at, updated_at FROM journal_entries WHERE id = ? AND user_id = ?";
    db.get(sql, [entryId, userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching journal entry.", error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: "Journal entry not found or not authorized." });
        }
        res.json({ message: "Journal entry fetched successfully.", data: row });
    });
};

// Update a specific journal entry
exports.updateJournalEntry = (req, res) => {
    const userId = req.user.id;
    const entryId = req.params.entryId;
    const { title, content } = req.body;

    if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Journal entry content cannot be empty." });
    }

    const sql = `UPDATE journal_entries
                 SET title = ?, content = ?, updated_at = datetime('now')
                 WHERE id = ? AND user_id = ?`;
    db.run(sql, [title ? title.trim() : null, content.trim(), entryId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Error updating journal entry.", error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Journal entry not found or not authorized to update." });
        }
        res.json({ message: "Journal entry updated successfully." });
    });
};

// Delete a specific journal entry
exports.deleteJournalEntry = (req, res) => {
    const userId = req.user.id;
    const entryId = req.params.entryId;
    const sql = "DELETE FROM journal_entries WHERE id = ? AND user_id = ?";
    db.run(sql, [entryId, userId], function(err) {
        if (err) {
            return res.status(500).json({ message: "Error deleting journal entry.", error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Journal entry not found or not authorized to delete." });
        }
        res.json({ message: "Journal entry deleted successfully." });
    });
};
