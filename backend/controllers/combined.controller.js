// ─── EMPLOYEE CONTROLLER ─────────────────────────────────────────────────────
const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { Attendance, Leave, Notification } = require('../models/index');
const { calculateProductivityScore, detectOverload, generatePerformanceSummary } = require('../services/ai.service');

exports.getAllEmployees = async (req, res) => {
  try {
    const { department, status, role, search, page = 1, limit = 20, sortBy = 'name' } = req.query;
    let filter = {};

    if (req.user.role === 'manager') {
      filter.manager = req.user._id;
    }
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];

    const total = await User.countDocuments(filter);
    const employees = await User.find(filter)
      .populate('manager', 'name email')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: employees,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).populate('manager', 'name email department avatar');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const allowedFields = ['name', 'department', 'position', 'phone', 'skills', 'salary', 'location', 'bio', 'status', 'manager', 'role'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (req.file) { updates.avatar = req.file.path; updates.avatarPublicId = req.file.filename; }

    const employee = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status: 'inactive' });
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const id = req.params.id;
    const [productivity, overload, summary] = await Promise.all([
      calculateProductivityScore(id, 30),
      detectOverload(id),
      generatePerformanceSummary(id, 'monthly')
    ]);
    res.json({ success: true, data: { productivity, overload, summary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ATTENDANCE CONTROLLER ────────────────────────────────────────────────────
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes, location } = req.body;
    const targetEmployee = employeeId || req.user._id;
    const targetDate = new Date(date || new Date().toDateString());

    const existing = await Attendance.findOne({ employee: targetEmployee, date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 86400000) } });

    let record;
    if (existing) {
      Object.assign(existing, { status, checkIn, checkOut, notes, location, markedBy: req.user._id, isManualEntry: req.user.role !== 'employee' });
      record = await existing.save();
    } else {
      record = await Attendance.create({ employee: targetEmployee, date: targetDate, status, checkIn, checkOut, notes, location, markedBy: req.user._id, isManualEntry: req.user.role !== 'employee' });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Attendance already marked for this date' });
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, month, year, startDate, endDate } = req.query;
    let filter = {};

    if (req.user.role === 'employee') filter.employee = req.user._id;
    else if (employeeId) filter.employee = employeeId;

    if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) };
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name email avatar department')
      .sort({ date: -1 });

    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      totalHours: records.reduce((s, r) => s + (r.workingHours || 0), 0)
    };

    res.json({ success: true, data: records, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LEAVE CONTROLLER ─────────────────────────────────────────────────────────
exports.requestLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, isUrgent } = req.body;
    const leave = await Leave.create({ employee: req.user._id, leaveType, startDate, endDate, reason, isUrgent });

    // Notify manager
    if (req.user.manager) {
      await Notification.create({
        recipient: req.user.manager,
        sender: req.user._id,
        type: 'leave_request',
        title: 'Leave Request',
        message: `${req.user.name} requested ${leave.totalDays} day(s) leave (${leaveType}) from ${new Date(startDate).toDateString()}`,
        link: `/leaves/${leave._id}`,
        metadata: { leaveId: leave._id, leaveType, totalDays: leave.totalDays }
      });
    }

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    const { status, employeeId, page = 1, limit = 20 } = req.query;
    let filter = {};

    if (req.user.role === 'employee') filter.employee = req.user._id;
    else if (employeeId) filter.employee = employeeId;
    else if (req.user.role === 'manager') {
      const team = await User.find({ manager: req.user._id }).select('_id');
      filter.employee = { $in: team.map(t => t._id) };
    }

    if (status) filter.status = status;

    const total = await Leave.countDocuments(filter);
    const leaves = await Leave.find(filter)
      .populate('employee', 'name email avatar department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: leaves, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewLeave = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const leave = await Leave.findById(req.params.id).populate('employee');

    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote;
    await leave.save();

    // Notify employee
    await Notification.create({
      recipient: leave.employee._id,
      sender: req.user._id,
      type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
      title: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your ${leave.leaveType} leave request has been ${status}.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
      link: `/leaves/${leave._id}`
    });

    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── AI CONTROLLER ────────────────────────────────────────────────────────────
const aiService = require('../services/ai.service');

exports.getProductivityScore = async (req, res) => {
  try {
    const employeeId = req.params.id || req.user._id;
    const period = parseInt(req.query.days) || 30;
    const result = await aiService.calculateProductivityScore(employeeId, period);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAtRiskTasks = async (req, res) => {
  try {
    let taskFilter = { status: { $nin: ['completed', 'cancelled'] } };
    if (req.user.role === 'employee') taskFilter.assignedTo = req.user._id;
    else if (req.user.role === 'manager') {
      const team = await User.find({ manager: req.user._id }).select('_id');
      taskFilter.assignedTo = { $in: [req.user._id, ...team.map(t => t._id)] };
    }

    const tasks = await Task.find(taskFilter).populate('assignedTo', 'name email');

    const riskyTasks = await Promise.all(tasks.map(async (task) => {
      const [prod, overload] = await Promise.all([
        aiService.calculateProductivityScore(task.assignedTo._id, 30),
        aiService.detectOverload(task.assignedTo._id)
      ]);
      const risk = aiService.predictDeadlineRisk(task, prod.score, overload.activeTasks);
      return { task, ...risk };
    }));

    const filtered = riskyTasks.filter(r => r.riskLevel !== 'low').sort((a, b) => b.riskScore - a.riskScore);
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWorkloadBalance = async (req, res) => {
  try {
    const managerId = req.user.role === 'admin' ? (req.query.managerId || req.user._id) : req.user._id;
    const result = await aiService.getWorkloadBalanceSuggestions(managerId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPerformanceSummary = async (req, res) => {
  try {
    const employeeId = req.params.id || req.user._id;
    const period = req.query.period || 'monthly';
    const summary = await aiService.generatePerformanceSummary(employeeId, period);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeamAIInsights = async (req, res) => {
  try {
    let employees;
    if (req.user.role === 'admin') {
      employees = await User.find({ status: 'active', role: { $ne: 'admin' } });
    } else {
      employees = await User.find({ manager: req.user._id, status: 'active' });
    }

    const insights = await Promise.all(employees.map(async (emp) => {
      const [prod, overload] = await Promise.all([
        aiService.calculateProductivityScore(emp._id, 30),
        aiService.detectOverload(emp._id)
      ]);
      return { employee: { _id: emp._id, name: emp.name, email: emp.email, avatar: emp.avatar, department: emp.department }, productivityScore: prod.score, overload, breakdown: prod.breakdown };
    }));

    const topPerformers = [...insights].sort((a, b) => b.productivityScore - a.productivityScore).slice(0, 5);
    const overloadedEmployees = insights.filter(i => i.overload.isOverloaded);
    const avgProductivity = insights.length > 0 ? Math.round(insights.reduce((s, i) => s + i.productivityScore, 0) / insights.length) : 0;

    res.json({ success: true, data: { insights, topPerformers, overloadedEmployees, avgProductivity, totalEmployees: employees.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
