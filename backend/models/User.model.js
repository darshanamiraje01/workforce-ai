const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
  department: { type: String, trim: true },
  position: { type: String, trim: true },
  phone: { type: String },
  avatar: { type: String },
  avatarPublicId: { type: String },
  employeeId: { type: String, unique: true, sparse: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  joiningDate: { type: Date, default: Date.now },
  skills: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  salary: { type: Number },
  location: { type: String },
  bio: { type: String },
  address: { type: String },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now();
  next();
});

// Auto-generate employee ID
userSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('User').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    return parseInt(this.passwordChangedAt.getTime() / 1000, 10) > JWTTimestamp;
  }
  return false;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
