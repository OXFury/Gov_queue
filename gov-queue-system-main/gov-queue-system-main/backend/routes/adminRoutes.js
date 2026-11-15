const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/analytics', verifyToken, requireRole('admin'), adminController.getAnalytics);
router.get('/optimization-report', verifyToken, requireRole('admin'), adminController.getOptimizationReport);
router.post('/rebalance', verifyToken, requireRole('admin'), adminController.rebalanceCounters);
router.get('/counters', verifyToken, requireRole('admin', 'staff'), adminController.getAllCounters);
router.post('/counters', verifyToken, requireRole('admin'), adminController.createCounter);
router.delete('/counters/:counterId', verifyToken, requireRole('admin'), adminController.deleteCounter);
router.get('/staff', verifyToken, requireRole('admin'), adminController.getAllStaff);

module.exports = router;
