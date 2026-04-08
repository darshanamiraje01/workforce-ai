const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { Attendance, Leave } = require('../models/index');

r.use(protect);

// Overview stats for dashboard KPIs
r.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());

    let empFilter = req.user.role === 'manager' ? { manager: req.user._id } : {};
    let taskFilter = req.user.role === 'employee' ? { assignedTo: req.user._id } : {};
    if (req.user.role === 'manager') {
      const team = await User.find({ manager: req.user._id }).select('_id');
      taskFilter.assignedTo = { $in: [req.user._id, ...team.map(t => t._id)] };
    }

    const [totalEmployees, activeEmployees, totalTasks, completedThisWeek, pendingLeaves, overdueTasks, todayAttendance] = await Promise.all([
      User.countDocuments({ ...empFilter, role: { $ne: 'admin' } }),
      User.countDocuments({ ...empFilter, status: 'active', role: { $ne: 'admin' } }),
      Task.countDocuments({ ...taskFilter, status: { $nin: ['cancelled'] } }),
      Task.countDocuments({ ...taskFilter, status: 'completed', completedAt: { $gte: startOfWeek } }),
      require('../models/index').Leave.countDocuments({ status: 'pending', ...(req.user.role === 'manager' ? {} : {}) }),
      Task.countDocuments({ ...taskFilter, isOverdue: true, status: { $nin: ['completed', 'cancelled'] } }),
      Attendance.countDocuments({ date: { $gte: new Date(now.toDateString()) }, status: { $in: ['present', 'late'] } })
    ]);

    // Task status breakdown
    const taskStatusData = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Monthly task completion trend (last 6 months)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const [completed, assigned] = await Promise.all([
        Task.countDocuments({ ...taskFilter, status: 'completed', completedAt: { $gte: start, $lte: end } }),
        Task.countDocuments({ ...taskFilter, createdAt: { $gte: start, $lte: end } })
      ]);
      trendData.push({ month: start.toLocaleString('default', { month: 'short' }), completed, assigned });
    }

    // Dept performance
    const deptData = await Task.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'users', localField: 'assignedTo', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $group: { _id: '$emp.department', completed: { $sum: 1 } } },
      { $sort: { completed: -1 } }, { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        kpis: { totalEmployees, activeEmployees, totalTasks, completedThisWeek, pendingLeaves, overdueTasks, todayAttendance },
        taskStatusBreakdown: taskStatusData,
        monthlyTrend: trendData,
        departmentPerformance: deptData
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Attendance trends
r.get('/attendance-trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(); since.setDate(since.getDate() - days);
    const empId = req.user.role === 'employee' ? req.user._id : req.query.employeeId;
    const filter = empId ? { employee: empId, date: { $gte: since } } : { date: { $gte: since } };

    const records = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }, late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = r;
