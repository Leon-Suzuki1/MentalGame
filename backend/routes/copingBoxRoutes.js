const express = require('express');
const router = express.Router();
const copingBoxController = require('../controllers/copingBoxController');
const { protect } = require('../middleware/authMiddleware'); // Import the real middleware

// Apply the JWT protection middleware to all routes in this file
router.use(protect);

router.get('/items', copingBoxController.getCopingBoxItems);
router.post('/items', copingBoxController.addCopingBoxItem);
router.delete('/items/:itemId', copingBoxController.deleteCopingBoxItem);

module.exports = router;
