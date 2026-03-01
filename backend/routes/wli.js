const express = require('express');
const router = express.Router();
const { createWLIRequest } = require('../controllers/wliController');

// Public route - no authentication required
router.post('/', createWLIRequest);

module.exports = router;
