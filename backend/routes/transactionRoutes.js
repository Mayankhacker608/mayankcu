const express = require('express');
const { getTransactions, getTransactionById, createTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.post('/', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), createTransaction);

module.exports = router;
