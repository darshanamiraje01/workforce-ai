// routes/notification.routes.js
const express = require('express');
const r = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { Notification } = require('../models/index');

r.use(protect);

r.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;
