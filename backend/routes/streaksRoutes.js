const express = require('express');
const router = express.Router();
const streaksController = require('../controllers/streaksController');
const { protect } = require('../middleware/authMiddleware');

// Apply JWT protection to all streak routes
router.use(protect);

// Get specific streak type for the logged-in user
router.get('/:streakType', streaksController.getUserStreaks);

module.exports = router;
