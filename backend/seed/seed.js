const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

dotenv.config();

const seedDemo = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    Account.deleteMany({}),
    Transaction.deleteMany({}),
    Payment.deleteMany({}),
    Activity.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);

  const admin = await User.create({
    fullName: 'System Admin',
    email: 'admin@bankdemo.com',
    phone: '+1-555-0101',
    password: adminPassword,
    role: 'ADMIN',
  });

  const manager = await User.create({
    fullName: 'Account Manager',
    email: 'manager@bankdemo.com',
    phone: '+1-555-0102',
    password: managerPassword,
    role: 'ACCOUNT_MANAGER',
  });

  const customers = await Customer.insertMany([
    { customerId: 'CUST-1001', fullName: 'Ava Thompson', email: 'ava@example.com', phone: '+1-555-2001', address: '44 River Ave', city: 'Boston', state: 'MA', country: 'USA', postalCode: '02115', dateOfBirth: '1990-05-12', status: 'Active', createdBy: admin._id },
    { customerId: 'CUST-1002', fullName: 'Liam Patel', email: 'liam@example.com', phone: '+1-555-2002', address: '99 Harbor Rd', city: 'Seattle', state: 'WA', country: 'USA', postalCode: '98101', dateOfBirth: '1987-08-21', status: 'Active', createdBy: manager._id },
    { customerId: 'CUST-1003', fullName: 'Sofia Nguyen', email: 'sofia@example.com', phone: '+1-555-2003', address: '12 Park Lane', city: 'Austin', state: 'TX', country: 'USA', postalCode: '73301', dateOfBirth: '1995-11-02', status: 'Active', createdBy: admin._id },
    { customerId: 'CUST-1004', fullName: 'Noah Carter', email: 'noah@example.com', phone: '+1-555-2004', address: '88 Pine St', city: 'Denver', state: 'CO', country: 'USA', postalCode: '80203', dateOfBirth: '1982-03-18', status: 'Inactive', createdBy: manager._id },
    { customerId: 'CUST-1005', fullName: 'Emma Wilson', email: 'emma@example.com', phone: '+1-555-2005', address: '26 Garden Park', city: 'Miami', state: 'FL', country: 'USA', postalCode: '33101', dateOfBirth: '1992-06-27', status: 'Active', createdBy: admin._id },
  ]);

  const customerObjects = customers.map((customer) => customer._id);

  const accounts = await Account.insertMany([
    { accountNumber: 'ACC-1000000001', customer: customerObjects[0], accountType: 'Savings', balance: 14500, availableBalance: 14500, currency: 'USD', status: 'Active', createdBy: admin._id },
    { accountNumber: 'ACC-1000000002', customer: customerObjects[1], accountType: 'Current', balance: 6200, availableBalance: 6200, currency: 'USD', status: 'Active', createdBy: manager._id },
    { accountNumber: 'ACC-1000000003', customer: customerObjects[2], accountType: 'Business', balance: 22000, availableBalance: 22000, currency: 'USD', status: 'Active', createdBy: admin._id },
    { accountNumber: 'ACC-1000000004', customer: customerObjects[3], accountType: 'Corporate', balance: 34500, availableBalance: 34500, currency: 'USD', status: 'Suspended', createdBy: manager._id },
    { accountNumber: 'ACC-1000000005', customer: customerObjects[4], accountType: 'Savings', balance: 9100, availableBalance: 9100, currency: 'USD', status: 'Active', createdBy: admin._id },
  ]);

  const transactions = await Transaction.insertMany([
    { transactionId: 'TXN-100001', account: accounts[0]._id, customer: customerObjects[0], type: 'Credit', amount: 1500, description: 'Salary deposit', balanceAfter: 16000, status: 'Completed', createdBy: admin._id },
    { transactionId: 'TXN-100002', account: accounts[1]._id, customer: customerObjects[1], type: 'Debit', amount: 350, description: 'Rent payment', balanceAfter: 5850, status: 'Completed', createdBy: manager._id },
    { transactionId: 'TXN-100003', account: accounts[2]._id, customer: customerObjects[2], type: 'Credit', amount: 5000, description: 'Invoice settlement', balanceAfter: 27000, status: 'Completed', createdBy: admin._id },
    { transactionId: 'TXN-100004', account: accounts[3]._id, customer: customerObjects[3], type: 'Debit', amount: 1000, description: 'Equipment purchase', balanceAfter: 33500, status: 'Completed', createdBy: manager._id },
    { transactionId: 'TXN-100005', account: accounts[4]._id, customer: customerObjects[4], type: 'Credit', amount: 1200, description: 'Client refund', balanceAfter: 10300, status: 'Completed', createdBy: admin._id },
  ]);

  await Payment.insertMany([
    { paymentId: 'PAY-100001', customer: customerObjects[0], account: accounts[0]._id, amount: 1200, paymentMethod: 'Bank Transfer', status: 'Completed', reference: 'INV-441', description: 'Office utility bill', createdBy: admin._id },
    { paymentId: 'PAY-100002', customer: customerObjects[1], account: accounts[1]._id, amount: 850, paymentMethod: 'UPI', status: 'Pending', reference: 'PAY-222', description: 'Software renewal', createdBy: manager._id },
    { paymentId: 'PAY-100003', customer: customerObjects[2], account: accounts[2]._id, amount: 2400, paymentMethod: 'Card', status: 'Completed', reference: 'CCD-900', description: 'Vendor payment', createdBy: admin._id },
    { paymentId: 'PAY-100004', customer: customerObjects[3], account: accounts[3]._id, amount: 680, paymentMethod: 'Cash', status: 'Pending', reference: 'CASH-111', description: 'Weekly expenses', createdBy: manager._id },
    { paymentId: 'PAY-100005', customer: customerObjects[4], account: accounts[4]._id, amount: 1500, paymentMethod: 'Bank Transfer', status: 'Completed', reference: 'FT-99', description: 'Service invoice', createdBy: admin._id },
  ]);

  await Activity.insertMany([
    { user: admin._id, action: 'LOGIN', description: 'System Admin logged in successfully.', metadata: { loginSource: 'dashboard' } },
    { user: manager._id, action: 'LOGIN', description: 'Account Manager logged in successfully.', metadata: { loginSource: 'dashboard' } },
    { user: admin._id, action: 'CUSTOMER_CREATED', description: 'Customer records initialized for demo seed.', metadata: { count: customers.length } },
  ]);

  await Notification.insertMany([
    { user: admin._id, title: 'Payment completed', message: 'A payment from Ava Thompson was scheduled successfully.', type: 'success', read: false },
    { user: manager._id, title: 'New customer created', message: 'A new customer profile has been added.', type: 'info', read: false },
    { user: admin._id, title: 'Account created', message: 'A savings account was created for system onboarding.', type: 'success', read: true },
  ]);

  console.log('Demo data seeded successfully.');
  console.log('Demo accounts:');
  console.log('Admin email:', 'admin@bankdemo.com');
  console.log('Admin password:', 'Admin@123');
  console.log('Manager email:', 'manager@bankdemo.com');
  console.log('Manager password:', 'Manager@123');

  await mongoose.disconnect();
};

seedDemo().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
