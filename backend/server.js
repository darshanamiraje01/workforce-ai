const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many login attempts.' } });

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', limiter);

// Static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/leaves', require('./routes/leave.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/documents', require('./routes/document.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` }));

// Error handler
const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

// Start
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`\n🚀 WorkForce AI Backend → http://localhost:${PORT}`);
      console.log(`📊 Env: ${process.env.NODE_ENV || 'development'}\n`);
    });
    // Cron jobs
    try {
      const cron = require('node-cron');
      const { sendDeadlineReminders, processOverdueTasks } = require('./services/notification.service');
      cron.schedule('0 9 * * 1-5', () => sendDeadlineReminders());
      cron.schedule('0 * * * *', () => processOverdueTasks());
      console.log('📅 Cron jobs running');
    } catch (e) { console.warn('⚠️  Cron jobs skipped:', e.message); }
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err.message); process.exit(1); });

module.exports = app;
