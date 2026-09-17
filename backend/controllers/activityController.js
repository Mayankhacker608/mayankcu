const Activity = require('../models/Activity');

const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'fullName email role')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load activities.' });
  }
};

module.exports = {
  getActivities,
};
