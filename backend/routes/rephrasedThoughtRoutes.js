const express = require('express');
const router = express.Router();
const rephrasedThoughtController = require('../controllers/rephrasedThoughtController');
const { protect } = require('../middleware/authMiddleware'); // Import JWT protection

// Apply JWT protection to all routes
router.use(protect);

router.post('/', rephrasedThoughtController.saveThoughtPair);
router.get('/', rephrasedThoughtController.getAllThoughtPairs);
router.get('/:id', rephrasedThoughtController.getThoughtPairById);
router.put('/:id', rephrasedThoughtController.updateThoughtPair);
router.delete('/:id', rephrasedThoughtController.deleteThoughtPair);

module.exports = router;
