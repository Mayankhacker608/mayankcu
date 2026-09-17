const express = require('express');
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect);
router.get('/', roleMiddleware('ADMIN'), getActivities);

module.exports = router;
