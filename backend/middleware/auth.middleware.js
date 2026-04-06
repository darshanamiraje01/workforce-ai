const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ success: false, message: 'Password recently changed. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired, please log in again' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// Role restriction middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' does not have access to this resource`
      });
    }
    next();
  };
};

// Manager can only access their direct reports
exports.managerGuard = async (req, res, next) => {
  if (req.user.role === 'admin') return next();
  const employeeId = req.params.id || req.body.employeeId;
  if (!employeeId) return next();

  const User = require('../models/User.model');
  const employee = await User.findById(employeeId);

  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

  if (req.user.role === 'manager' && employee.manager?.toString() !== req.user._id.toString()) {
    if (employeeId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: not your direct report' });
    }
  }

  if (req.user.role === 'employee' && employeeId !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  next();
};

// Generate JWT
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};
