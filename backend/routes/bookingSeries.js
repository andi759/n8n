const express = require('express');
const router = express.Router();
const bookingSeriesController = require('../controllers/bookingSeriesController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', bookingSeriesController.getAllSeries);
router.post('/preview', bookingSeriesController.previewSeries);
router.get('/:id', bookingSeriesController.getSeries);
router.post('/', bookingSeriesController.createSeries);
router.put('/:id', bookingSeriesController.updateSeries);
router.post('/:id/extend/preview', bookingSeriesController.previewExtendSeries);
router.post('/:id/extend', bookingSeriesController.extendSeries);
router.delete('/:id', bookingSeriesController.deleteSeries);

module.exports = router;
