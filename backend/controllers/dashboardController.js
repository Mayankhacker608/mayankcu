const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');

const getDashboardStats = async (req, res) => {
  try {
    const [
      customerCount,
      accountCount,
      transactionCount,
      paymentCount,
      totalBalance,
      pendingPayments,
      monthlyRevenue,
      accountTypeBreakdown,
      paymentStatusBreakdown,
    ] = await Promise.all([
      Customer.countDocuments(),
      Account.countDocuments(),
      Transaction.countDocuments(),
      Payment.countDocuments(),
      Account.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
      Payment.countDocuments({ status: 'Pending' }),
      Transaction.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Account.aggregate([
        { $group: { _id: '$accountType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const totals = totalBalance[0]?.total || 0;
    const revenue = monthlyRevenue[0]?.total || 0;

    const stats = {
      totalCustomers: customerCount,
      totalAccounts: accountCount,
      totalBalance: totals,
      totalTransactions: transactionCount,
      pendingPayments: pendingPayments,
      monthlyRevenue: revenue,
      accountTypeBreakdown,
      paymentStatusBreakdown,
      paymentCount,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Dashboard stats failed.' });
  }
};

const getDashboardTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('account', 'accountNumber')
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load recent transactions.' });
  }
};

const getDashboardPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'fullName')
      .populate('account', 'accountNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load recent payments.' });
  }
};

const getDashboardCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 }).limit(10);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load customer summaries.' });
  }
};

const getDashboardActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'fullName role')
      .sort({ timestamp: -1 })
      .limit(8);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load activity feed.' });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardTransactions,
  getDashboardPayments,
  getDashboardCustomers,
  getDashboardActivities,
};
