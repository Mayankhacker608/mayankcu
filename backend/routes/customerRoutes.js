const express = require('express');
const { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), createCustomer);
router.put('/:id', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), updateCustomer);
router.delete('/:id', roleMiddleware('ADMIN'), deleteCustomer);

module.exports = router;
