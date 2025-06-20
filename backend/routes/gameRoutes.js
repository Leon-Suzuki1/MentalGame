const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

// Apply JWT protection to game routes
router.use(protect);

router.get('/matching/new-round', gameController.getNewMatchingRound);
router.post('/matching/complete-round', gameController.completeMatchingRound);

module.exports = router;
