const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET all specialties
router.get('/', specialtyController.getAllSpecialties);

// GET specialty by ID
router.get('/:id', specialtyController.getSpecialtyById);

// POST create new specialty
router.post('/', specialtyController.createSpecialty);

// PUT update specialty
router.put('/:id', specialtyController.updateSpecialty);

// DELETE specialty
router.delete('/:id', specialtyController.deleteSpecialty);

module.exports = router;
