const Task = require('../models/Task.model');
const User = require('../models/User.model');
const { Notification, Leave } = require('../models/index');

/**
 * Called by cron job every weekday at 9am
 * Sends deadline reminder notifications for tasks due within 2 days
 */
exports.sendDeadlineReminders = async () => {
  try {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const now = new Date();

    const upcomingTasks = await Task.find({
      dueDate: { $gte: now, $lte: twoDaysFromNow },
      status: { $nin: ['completed', 'cancelled'] },
      isOverdue: false,
    }).populate('assignedTo', 'name email').populate('assignedBy', 'name');

    let sent = 0;
    for (const task of upcomingTasks) {
      if (!task.assignedTo?._id) continue;

      // Check if we already sent a reminder today
      const existingToday = await Notification.findOne({
        recipient: task.assignedTo._id,
        type: 'deadline_risk',
        'metadata.taskId': task._id,
        createdAt: { $gte: new Date(now.toDateString()) },
      });
      if (existingToday) continue;

      const daysLeft = Math.ceil((task.dueDate - now) / (1000 * 60 * 60 * 24));
      await Notification.create({
        recipient: task.assignedTo._id,
        type: 'deadline_risk',
        title: `⏰ Deadline Approaching`,
        message: `"${task.title}" is due ${daysLeft === 0 ? 'today' : `in ${daysLeft} day(s)`}. Current progress: ${task.progress || 0}%.`,
        link: `/tasks/${task._id}`,
        metadata: { taskId: task._id, daysLeft },
      });
      sent++;
    }

    console.log(`📬 Sent ${sent} deadline reminder notifications`);
    return sent;
  } catch (err) {
    console.error('Failed to send deadline reminders:', err.message);
    return 0;
  }
};

/**
 * Mark overdue tasks and notify assignees
 */
exports.processOverdueTasks = async () => {
  try {
    const overdueTasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] },
      isOverdue: false,
    }).populate('assignedTo').populate('assignedBy');

    let processed = 0;
    for (const task of overdueTasks) {
      task.isOverdue = true;
      await task.save();

      // Notify employee
      if (task.assignedTo?._id) {
        await Notification.create({
          recipient: task.assignedTo._id,
          type: 'task_overdue',
          title: '🔴 Task Overdue',
          message: `"${task.title}" is now overdue. Please update the status or contact your manager.`,
          link: `/tasks/${task._id}`,
          metadata: { taskId: task._id },
        });
      }
      // Notify manager
      if (task.assignedBy?._id && task.assignedBy._id.toString() !== task.assignedTo?._id?.toString()) {
        await Notification.create({
          recipient: task.assignedBy._id,
          type: 'task_overdue',
          title: '🔴 Task Overdue Alert',
          message: `"${task.title}" assigned to ${task.assignedTo?.name} is now overdue.`,
          link: `/tasks/${task._id}`,
          metadata: { taskId: task._id },
        });
      }
      processed++;
    }

    if (processed > 0) console.log(`⚠️  Marked ${processed} tasks as overdue`);
    return processed;
  } catch (err) {
    console.error('Failed to process overdue tasks:', err.message);
    return 0;
  }
};

/**
 * Create notification helper (used by controllers)
 */
exports.createNotification = async ({ recipient, sender, type, title, message, link, metadata }) => {
  try {
    return await Notification.create({ recipient, sender, type, title, message, link, metadata });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};
