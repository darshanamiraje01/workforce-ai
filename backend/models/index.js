const mongoose = require('mongoose');

// ─── ATTENDANCE ─────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'holiday', 'weekend'], default: 'absent' },
  workingHours: { type: Number, default: 0 },
  notes: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String },
  isManualEntry: { type: Boolean, default: false }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.workingHours = Math.round(diff * 100) / 100;
  }
  next();
});

// ─── LEAVE ───────────────────────────────────────────────────────────────────
const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String },
  attachments: [{ name: String, url: String }],
  isUrgent: { type: Boolean, default: false }
}, { timestamps: true });

leaveSchema.pre('save', function(next) {
  const diff = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
  this.totalDays = Math.ceil(diff) + 1;
  next();
});

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['task_assigned', 'task_completed', 'task_overdue', 'leave_request', 'leave_approved',
           'leave_rejected', 'attendance_reminder', 'deadline_risk', 'overload_alert',
           'performance_report', 'system', 'mention'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────
const documentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['id_proof', 'offer_letter', 'contract', 'certificate', 'payslip', 'appraisal', 'other'], required: true },
  url: { type: String, required: true },
  publicId: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  description: { type: String },
  isConfidential: { type: Boolean, default: false },
  expiryDate: { type: Date }
}, { timestamps: true });

module.exports = {
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Leave: mongoose.model('Leave', leaveSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Document: mongoose.model('Document', documentSchema)
};
