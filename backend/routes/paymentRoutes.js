const express = require('express');
const { getPayments, getPaymentById, createPayment, updatePayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), createPayment);
router.put('/:id', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), updatePayment);

module.exports = router;
