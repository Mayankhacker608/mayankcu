const express = require('express');
const { summaryReports, transactionReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.get('/summary', summaryReports);
router.get('/transactions', transactionReports);

module.exports = router;
