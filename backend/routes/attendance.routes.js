// attendance.routes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/combined.controller');

const attendance = express.Router();
attendance.use(protect);
attendance.post('/', c.markAttendance);
attendance.get('/', c.getAttendance);
module.exports = attendance;

// NOTE: For full project, each of these would be separate files.
// Shown here combined for brevity. In production, split into individual route files.
