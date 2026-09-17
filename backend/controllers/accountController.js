const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const generateAccountNumber = require('../utils/generateAccountNumber');

const logActivity = async (userId, action, description, metadata = {}) => {
  if (!userId) return;
  await Activity.create({ user: userId, action, description, metadata });
};

const getAccounts = async (req, res) => {
  try {
    const { status, accountType, customerId, q } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (accountType) filter.accountType = accountType;
    if (customerId) filter.customer = customerId;
    if (q) {
      filter.accountNumber = { $regex: q, $options: 'i' };
    }

    const accounts = await Account.find(filter)
      .populate('customer', 'fullName email customerId')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load accounts.' });
  }
};

const getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('customer', 'fullName email customerId')
      .populate('createdBy', 'fullName email');

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load account.' });
  }
};

const createAccount = async (req, res) => {
  try {
    const { customer, accountType, currency, status, balance } = req.body;

    if (!customer || !accountType) {
      return res.status(422).json({ message: 'Customer and account type are required.' });
    }

    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    let accountNumber = generateAccountNumber();
    let duplicate = await Account.findOne({ accountNumber });
    while (duplicate) {
      accountNumber = generateAccountNumber();
      duplicate = await Account.findOne({ accountNumber });
    }

    const initialBalance = Number(balance || 0);
    const account = await Account.create({
      accountNumber,
      customer,
      accountType,
      balance: initialBalance,
      availableBalance: initialBalance,
      currency: currency || 'USD',
      status: status || 'Active',
      createdBy: req.user._id,
    });

    await Activity.create({
      user: req.user._id,
      action: 'ACCOUNT_CREATED',
      description: `Account ${account.accountNumber} was created for ${customerExists.fullName}.`,
      metadata: { customerId: customer, accountId: account._id },
    });

    await Notification.create({
      user: req.user._id,
      title: 'Account created',
      message: `A new ${accountType} account was created for ${customerExists.fullName}.`,
      type: 'success',
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Account creation failed.' });
  }
};

const updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && key !== '_id') {
        account[key] = req.body[key];
      }
    });

    if (account.balance !== undefined) account.availableBalance = account.balance;
    await account.save();

    await logActivity(req.user._id, 'ACCOUNT_UPDATED', `${account.accountNumber} account details were updated.`, { accountId: account._id });

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Account update failed.' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    await Account.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'ACCOUNT_DELETED', `${account.accountNumber} was deleted.`, { accountId: account._id });

    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Account deletion failed.' });
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
};
