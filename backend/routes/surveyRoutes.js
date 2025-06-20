const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all survey routes

router.get('/daily', surveyController.getDailySurvey);
router.post('/submit', surveyController.submitSurvey);

module.exports = router;
