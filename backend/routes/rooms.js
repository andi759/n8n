const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', roomController.getAllRooms);
router.get('/types', roomController.getRoomTypes);
router.get('/:id', roomController.getRoom);
router.post('/', requireAdmin, roomController.createRoom);
router.put('/:id', requireAdmin, roomController.updateRoom);
router.delete('/:id', requireAdmin, roomController.deleteRoom);

module.exports = router;
