const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallbacksecret', {
    expiresIn: '7d',
  });
};

const logActivity = async (userId, action, description, metadata = {}) => {
  if (!userId) return;
  await Activity.create({ user: userId, action, description, metadata });
};

const createNotification = async (userId, title, message, type = 'info') => {
  if (!userId) return;
  await Notification.create({ user: userId, title, message, type });
};

const registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, role } = req.body;

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return res.status(422).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(422).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ message: 'Password must be at least 6 characters long.' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: role || 'ACCOUNT_MANAGER',
    });

    const token = generateToken(user._id);

    await logActivity(user._id, 'LOGIN', `${user.fullName} registered successfully.`);
    await createNotification(user._id, 'Welcome', 'Your account has been created successfully.', 'success');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Registration failed.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    await logActivity(user._id, 'LOGIN', `${user.fullName} logged in successfully.`);

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login failed.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load profile.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    await user.save();

    await logActivity(user._id, 'PROFILE_UPDATED', `${user.fullName} updated profile information.`);

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Profile update failed.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(422).json({ message: 'Current password, new password, and confirmation are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(422).json({ message: 'New password and confirmation do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(422).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logActivity(user._id, 'PASSWORD_CHANGED', `${user.fullName} changed their password.`);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Password update failed.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
};
