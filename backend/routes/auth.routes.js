// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.post('/register', protect, authorize('admin'), ctrl.register);
router.get('/me', protect, ctrl.getMe);
router.put('/update-profile', protect, ctrl.updateProfile);
router.put('/update-password', protect, ctrl.updatePassword);

module.exports = router;
