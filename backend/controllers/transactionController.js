const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const generateTransactionId = require('../utils/generateTransactionId');

const getTransactions = async (req, res) => {
  try {
    const { account, customer, type, status, startDate, endDate, q } = req.query;
    const filter = {};

    if (account) filter.account = account;
    if (customer) filter.customer = customer;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (q) {
      filter.$or = [
        { description: { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('account', 'accountNumber accountType balance')
      .populate('customer', 'fullName customerId')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load transactions.' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('account', 'accountNumber accountType balance')
      .populate('customer', 'fullName customerId')
      .populate('createdBy', 'fullName email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load transaction.' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { account: accountId, customer, type, amount, description } = req.body;

    if (!accountId || !type || !amount) {
      return res.status(422).json({ message: 'Account, type and amount are required.' });
    }

    if (!['Credit', 'Debit'].includes(type)) {
      return res.status(422).json({ message: 'Transaction type must be Credit or Debit.' });
    }

    if (Number(amount) <= 0) {
      return res.status(422).json({ message: 'Amount must be greater than zero.' });
    }

    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const account = await Account.findById(accountId).session(session);
      if (!account) {
        throw new Error('Account not found.');
      }

      const currentBalance = Number(account.balance || 0);
      if (type === 'Debit' && currentBalance < Number(amount)) {
        throw new Error('Insufficient balance for this withdrawal.');
      }

      const newBalance = type === 'Credit' ? currentBalance + Number(amount) : currentBalance - Number(amount);
      account.balance = newBalance;
      account.availableBalance = newBalance;
      await account.save({ session });

      const transactionId = generateTransactionId();
      const transaction = await Transaction.create([{ 
        transactionId,
        account: accountId,
        customer: customer || account.customer,
        type,
        amount: Number(amount),
        description: description || `${type} transaction`,
        balanceAfter: newBalance,
        status: 'Completed',
        createdBy: req.user._id,
      }], { session });

      await Activity.create([{ 
        user: req.user._id,
        action: 'TRANSACTION_CREATED',
        description: `${type} transaction of ${Number(amount).toFixed(2)} created for account ${account.accountNumber}.`,
        metadata: { accountId: accountId, transactionId: transaction[0]._id },
      }], { session });

      await Notification.create([{ 
        user: req.user._id,
        title: 'Transaction completed',
        message: `${type} of ${Number(amount).toFixed(2)} has been processed successfully.`,
        type: 'success',
      }], { session });

      res.status(201).json(transaction[0]);
    });

    session.endSession();
  } catch (error) {
    res.status(400).json({ message: error.message || 'Transaction creation failed.' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
};
