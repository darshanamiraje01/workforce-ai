const Task = require('../models/Task.model');
const User = require('../models/User.model');
const { Notification } = require('../models/index');
const { predictDeadlineRisk, detectOverload } = require('../services/ai.service');
const { calculateProductivityScore } = require('../services/ai.service');

// @desc    Create task
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, estimatedHours, tags, project, department } = req.body;

    // Check overload before assigning
    const overload = await detectOverload(assignedTo);
    const warnings = [];
    if (overload.isOverloaded) {
      warnings.push(`Warning: ${(await User.findById(assignedTo)).name} is currently overloaded (${overload.activeTasks} active tasks).`);
    }

    const task = await Task.create({
      title, description, assignedTo, assignedBy: req.user._id,
      priority, dueDate, estimatedHours, tags, project, department,
      statusHistory: [{ status: 'todo', changedBy: req.user._id }]
    });

    // Compute initial risk score
    const productivity = await calculateProductivityScore(assignedTo, 30);
    const risk = predictDeadlineRisk(task, productivity.score, overload.activeTasks);
    task.riskScore = risk.riskScore;
    await task.save();

    // Notify assigned employee
    await Notification.create({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned: "${title}" — due ${new Date(dueDate).toDateString()}`,
      link: `/tasks/${task._id}`,
      metadata: { taskId: task._id, priority, dueDate }
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar department' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    res.status(201).json({ success: true, data: populated, warnings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all tasks (role-filtered)
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, search, page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;

    let filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'manager') {
      const team = await User.find({ manager: req.user._id }).select('_id');
      const teamIds = [req.user._id, ...team.map(m => m._id)];
      filter.assignedTo = { $in: teamIds };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo && req.user.role !== 'employee') filter.assignedTo = assignedTo;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { project: { $regex: search, $options: 'i' } }
    ];

    const total = await Task.countDocuments(filter);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar department')
      .populate('assignedBy', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Update overdue status in bulk
    await Task.updateMany(
      { dueDate: { $lt: new Date() }, status: { $nin: ['completed', 'cancelled'] } },
      { $set: { isOverdue: true } }
    );

    res.json({
      success: true,
      data: tasks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar department skills')
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Compute live risk
    const [productivity, overload] = await Promise.all([
      calculateProductivityScore(task.assignedTo._id, 30),
      detectOverload(task.assignedTo._id)
    ]);
    const risk = predictDeadlineRisk(task, productivity.score, overload.activeTasks);

    res.json({ success: true, data: task, risk, employeeProductivity: productivity.score });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const prevStatus = task.status;
    const updates = req.body;

    // Track status changes
    if (updates.status && updates.status !== prevStatus) {
      task.statusHistory.push({ status: updates.status, changedBy: req.user._id, note: updates.statusNote });
      if (updates.status === 'completed') task.completedAt = new Date();

      // Notify assignedBy on completion
      if (updates.status === 'completed' && task.assignedBy.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: task.assignedBy,
          sender: req.user._id,
          type: 'task_completed',
          title: 'Task Completed',
          message: `"${task.title}" has been marked as completed.`,
          link: `/tasks/${task._id}`
        });
      }
    }

    Object.assign(task, updates);
    await task.save();

    // Recompute risk
    const overload = await detectOverload(task.assignedTo);
    const productivity = await calculateProductivityScore(task.assignedTo, 30);
    const risk = predictDeadlineRisk(task, productivity.score, overload.activeTasks);
    task.riskScore = risk.riskScore;
    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email avatar department' },
      { path: 'assignedBy', select: 'name email' }
    ]);

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name avatar');

    res.json({ success: true, data: task.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
