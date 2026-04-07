const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const c = require('../controllers/combined.controller');
r.use(protect);
r.get('/', c.getLeaves);
r.post('/', c.requestLeave);
r.put('/:id/review', authorize('admin', 'manager'), c.reviewLeave);
module.exports = r;
