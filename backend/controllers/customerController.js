const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const logActivity = async (userId, action, description, metadata = {}) => {
  if (!userId) return;
  await Activity.create({ user: userId, action, description, metadata });
};

const withNotification = async (userId, title, message, type = 'info') => {
  if (!userId) return;
  await Notification.create({ user: userId, title, message, type });
};

const getCustomers = async (req, res) => {
  try {
    const { q, status, sort = 'newest' } = req.query;
    const query = {};

    if (q) {
      query.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { customerId: { $regex: q, $options: 'i' } },
      ];
    }

    if (status) query.status = status;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { fullName: 1 },
      active: { status: 1 },
    };

    const customers = await Customer.find(query)
      .populate('createdBy', 'fullName email')
      .sort(sortMap[sort] || { createdAt: -1 });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load customers.' });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'fullName email');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load customer.' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { fullName, email, phone, address, city, state, country, postalCode, dateOfBirth, status } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(422).json({ message: 'Full name, email and phone are required.' });
    }

    const customerId = `CUST-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const customer = await Customer.create({
      customerId,
      fullName,
      email: email.toLowerCase(),
      phone,
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || '',
      postalCode: postalCode || '',
      dateOfBirth: dateOfBirth || null,
      status: status || 'Active',
      createdBy: req.user._id,
    });

    await logActivity(req.user._id, 'CUSTOMER_CREATED', `${fullName} was created as a new customer.`, { customerId: customer._id });
    await withNotification(req.user._id, 'New customer created', `${fullName} has been added to the customer database.`, 'success');

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Customer creation failed.' });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && key !== '_id') {
        customer[key] = req.body[key];
      }
    });

    await customer.save();

    await logActivity(req.user._id, 'CUSTOMER_UPDATED', `${customer.fullName} customer information was updated.`, { customerId: customer._id });

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Customer update failed.' });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    await Account.deleteMany({ customer: customer._id });
    await Transaction.deleteMany({ customer: customer._id });
    await Payment.deleteMany({ customer: customer._id });
    await Customer.findByIdAndDelete(req.params.id);

    await logActivity(req.user._id, 'CUSTOMER_DELETED', `${customer.fullName} was deleted from the system.`, { customerId: customer._id });

    res.json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Customer deletion failed.' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
