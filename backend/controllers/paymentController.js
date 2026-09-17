const Payment = require('../models/Payment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const generatePaymentId = require('../utils/generatePaymentId');

const logActivity = async (userId, action, description, metadata = {}) => {
  if (!userId) return;
  await Activity.create({ user: userId, action, description, metadata });
};

const getPayments = async (req, res) => {
  try {
    const { customer, account, status, q } = req.query;
    const filter = {};

    if (customer) filter.customer = customer;
    if (account) filter.account = account;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { paymentId: { $regex: q, $options: 'i' } },
        { reference: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const payments = await Payment.find(filter)
      .populate('customer', 'fullName email customerId')
      .populate('account', 'accountNumber')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load payments.' });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'fullName customerId email')
      .populate('account', 'accountNumber')
      .populate('createdBy', 'fullName email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load payment.' });
  }
};

const createPayment = async (req, res) => {
  try {
    const { customer, account, amount, paymentMethod, reference, description } = req.body;

    if (!customer || !account || !amount || !paymentMethod) {
      return res.status(422).json({ message: 'Customer, account, amount and payment method are required.' });
    }

    if (Number(amount) <= 0) {
      return res.status(422).json({ message: 'Payment amount must be greater than zero.' });
    }

    const paymentId = generatePaymentId();
    const payment = await Payment.create({
      paymentId,
      customer,
      account,
      amount: Number(amount),
      paymentMethod,
      reference: reference || '',
      description: description || '',
      status: 'Pending',
      createdBy: req.user._id,
    });

    await logActivity(req.user._id, 'PAYMENT_CREATED', `${paymentId} payment was initiated.`, { paymentId: payment._id, account });
    await Notification.create({
      user: req.user._id,
      title: 'Payment submitted',
      message: `Payment ${paymentId} was submitted successfully.`,
      type: 'info',
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Payment creation failed.' });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    const { status, reference, description } = req.body;
    if (status) payment.status = status;
    if (reference) payment.reference = reference;
    if (description) payment.description = description;

    await payment.save();

    await logActivity(req.user._id, 'PAYMENT_UPDATED', `Payment ${payment.paymentId} was updated to ${payment.status}.`, { paymentId: payment._id });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Payment update failed.' });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
};
