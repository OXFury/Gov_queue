const express = require('express');
const router = express.Router();
const counterController = require('../controllers/counterController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Staff terminal counter management
router.post('/call-next/:counterId', verifyToken, requireRole('staff', 'admin'), counterController.callNextToken);
router.post('/complete/:tokenId', verifyToken, requireRole('staff', 'admin'), counterController.completeToken);
router.post('/no-show/:tokenId', verifyToken, requireRole('staff', 'admin'), counterController.markNoShow);
router.put('/status/:counterId', verifyToken, requireRole('staff', 'admin'), counterController.toggleCounterStatus);

module.exports = router;
