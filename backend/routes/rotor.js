const express = require('express');
const router = express.Router();
const rotorController = require('../controllers/rotorController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/current-week', rotorController.getCurrentWeek);
router.get('/week-for-date/:date', rotorController.getWeekForDate);

module.exports = router;
