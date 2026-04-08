// routes/document.routes.js
const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { Document } = require('../models/index');
const multer = require('multer');
const storage = multer.diskStorage({ destination: 'uploads/', filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) });
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

r.use(protect);

r.post('/', upload.single('file'), async (req, res) => {
  try {
    const { employeeId, name, type, description, isConfidential } = req.body;
    const doc = await Document.create({
      employee: employeeId || req.user._id,
      uploadedBy: req.user._id,
      name, type, description,
      isConfidential: isConfidential === 'true',
      url: req.file ? `/uploads/${req.file.filename}` : req.body.url,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.get('/', async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = req.user.role === 'employee' ? { employee: req.user._id } : employeeId ? { employee: employeeId } : {};
    const docs = await Document.find(filter).populate('employee', 'name email').populate('uploadedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

r.delete('/:id', async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;
