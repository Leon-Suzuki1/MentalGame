const db = require('../database');

// Get all coping box items for a user
exports.getCopingBoxItems = (req, res) => {
    // Assumes req.user.id is populated by auth middleware
    const userId = req.user ? req.user.id : null;
    if (!userId) return res.status(401).json({ message: "User not authenticated."});

    const sql = "SELECT id, item_text, created_at FROM coping_box_items WHERE user_id = ? ORDER BY created_at DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ message: "Error fetching coping box items.", error: err.message });
            return;
        }
        res.json({
            message: "Coping box items fetched successfully.",
            data: rows
        });
    });
};

// Add a new item to the coping box
exports.addCopingBoxItem = (req, res) => {
    const userId = req.user ? req.user.id : null; // Assumes req.user.id is populated by auth middleware
    if (!userId) return res.status(401).json({ message: "User not authenticated."});
    const { item_text } = req.body;

    if (!item_text || item_text.trim() === "") {
        return res.status(400).json({ message: "Item text cannot be empty." });
    }

    const sql = "INSERT INTO coping_box_items (user_id, item_text) VALUES (?, ?)";
    db.run(sql, [userId, item_text.trim()], function(err) {
        if (err) {
            res.status(500).json({ message: "Error adding coping box item.", error: err.message });
            return;
        }
        res.status(201).json({
            message: "Coping box item added successfully.",
            data: { id: this.lastID, user_id: userId, item_text: item_text.trim(), created_at: new Date().toISOString() }
        });
    });
};

// Delete a coping box item
exports.deleteCopingBoxItem = (req, res) => {
    const userId = req.user ? req.user.id : null; // Assumes req.user.id is populated by auth middleware
    if (!userId) return res.status(401).json({ message: "User not authenticated."});
    const itemId = req.params.itemId;

    const sql = "DELETE FROM coping_box_items WHERE id = ? AND user_id = ?";
    db.run(sql, [itemId, userId], function(err) {
        if (err) {
            res.status(500).json({ message: "Error deleting coping box item.", error: err.message });
            return;
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Item not found or user not authorized to delete." });
        }
        res.json({ message: "Coping box item deleted successfully." });
    });
};
