const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { protect } = require('../middleware/authMiddleware'); // Import JWT protection

// Apply JWT protection to all journal routes
router.use(protect);

router.post('/entries', journalController.createJournalEntry);
router.get('/entries', journalController.getAllJournalEntries);
router.get('/entries/:entryId', journalController.getJournalEntryById);
router.put('/entries/:entryId', journalController.updateJournalEntry);
router.delete('/entries/:entryId', journalController.deleteJournalEntry);

module.exports = router;
