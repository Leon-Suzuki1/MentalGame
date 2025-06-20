const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { protect } = require('../middleware/authMiddleware');

// Apply JWT protection to all badge routes for now
router.use(protect);
// Note: /all could potentially be public if needed, but keeping it protected for simplicity.

// Get all badges earned by the logged-in user
router.get('/user', badgeController.getAllUserBadges);

// Get a list of all available badges in the system
router.get('/all', badgeController.getAllSystemBadges);

module.exports = router;
