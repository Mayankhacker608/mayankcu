const express = require('express');
const { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post('/', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), createAccount);
router.put('/:id', roleMiddleware('ADMIN', 'ACCOUNT_MANAGER'), updateAccount);
router.delete('/:id', roleMiddleware('ADMIN'), deleteAccount);

module.exports = router;
