const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all clinics
router.get('/', clinicController.getAllClinics);

// Get clinic by ID
router.get('/:id', clinicController.getClinicById);

// Get rooms for a specific clinic
router.get('/:id/rooms', clinicController.getClinicRooms);

// Create new clinic (admin only could be added)
router.post('/', clinicController.createClinic);

// Update clinic
router.put('/:id', clinicController.updateClinic);

// Delete (deactivate) clinic
router.delete('/:id', clinicController.deleteClinic);

module.exports = router;
