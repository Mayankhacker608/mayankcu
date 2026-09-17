const express = require('express');
const { getDashboardStats, getDashboardTransactions, getDashboardPayments, getDashboardCustomers, getDashboardActivities } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/transactions', getDashboardTransactions);
router.get('/payments', getDashboardPayments);
router.get('/customers', getDashboardCustomers);
router.get('/activities', getDashboardActivities);

module.exports = router;
