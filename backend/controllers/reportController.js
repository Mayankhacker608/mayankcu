const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

const summaryReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);

    const [customerCount, accountCount, transactionCount, paymentCount, revenue, transactions, payments, accountTypeBreakdown, paymentStatusBreakdown] = await Promise.all([
      Customer.countDocuments(dateFilter),
      Account.countDocuments(dateFilter),
      Transaction.countDocuments(dateFilter),
      Payment.countDocuments(dateFilter),
      Transaction.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.find(dateFilter).populate('customer', 'fullName').limit(10).sort({ createdAt: -1 }),
      Payment.find(dateFilter).populate('customer', 'fullName').limit(10).sort({ createdAt: -1 }),
      Account.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$accountType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Payment.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      customerCount,
      accountCount,
      transactionCount,
      paymentCount,
      revenue: revenue[0]?.total || 0,
      recentTransactions: transactions,
      recentPayments: payments,
      accountTypeBreakdown,
      paymentStatusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Summary report failed.' });
  }
};

const transactionReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = buildDateFilter(startDate, endDate);

    const transactions = await Transaction.find(filter)
      .populate('account', 'accountNumber')
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Transaction report failed.' });
  }
};

module.exports = {
  summaryReports,
  transactionReports,
};
