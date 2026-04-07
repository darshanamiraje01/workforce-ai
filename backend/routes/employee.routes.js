// routes/employee.routes.js
const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/combined.controller');
r.use(protect);
r.get('/', authorize('admin', 'manager'), c.getAllEmployees);
r.get('/:id', c.getEmployee);
r.put('/:id', authorize('admin', 'manager'), c.updateEmployee);
r.delete('/:id', authorize('admin'), c.deleteEmployee);
r.get('/:id/stats', c.getEmployeeStats);
module.exports = r;
