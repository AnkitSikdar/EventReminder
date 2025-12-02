const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Register
router.get('/register', (req, res) => res.render('auth/register'));
router.post('/register', AuthController.register);

// Login
router.get('/login', (req, res) => res.render('auth/login'));
router.post('/login', AuthController.login);

// Logout
router.get('/logout', AuthController.logout);

module.exports = router;
