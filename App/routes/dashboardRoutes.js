const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/DashboardController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

router.get('/', AuthMiddleware.verifyToken, DashboardController.showDashboard);

module.exports = router;
