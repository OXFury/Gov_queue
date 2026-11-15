const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// Public citizen & kiosk routes
router.post('/generate', tokenController.createToken);
router.get('/services', tokenController.getServiceTypes);
router.get('/status/:tokenNumber', tokenController.getTokenStatus);
router.get('/public-dashboard', tokenController.getPublicDashboardState);
router.put('/cancel/:tokenNumber', tokenController.cancelToken);

module.exports = router;
