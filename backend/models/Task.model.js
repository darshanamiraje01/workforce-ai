const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'in_review', 'completed', 'cancelled'],
    default: 'todo'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: String, trim: true },
  department: { type: String },
  dueDate: { type: Date, required: true },
  startDate: { type: Date, default: Date.now },
  completedAt: { type: Date },
  estimatedHours: { type: Number, default: 1 },
  actualHours: { type: Number },
  tags: [{ type: String }],
  attachments: [{ name: String, url: String, publicId: String }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  progress: { type: Number, min: 0, max: 100, default: 0 },
  isOverdue: { type: Boolean, default: false },
  riskScore: { type: Number, min: 0, max: 100, default: 0 }, // AI-computed
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

// Auto-detect overdue
taskSchema.pre('save', function(next) {
  if (this.dueDate && new Date() > this.dueDate && this.status !== 'completed' && this.status !== 'cancelled') {
    this.isOverdue = true;
  }
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.isOverdue = false;
  }
  next();
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  const diff = new Date(this.dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Task', taskSchema);
