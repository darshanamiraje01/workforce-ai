/**
 * AI Service - Rule-based intelligence engine
 * All scores and predictions are computed from real database data.
 * No random values. Every metric is deterministic and explainable.
 */

const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { Attendance, Leave } = require('../models/index');

// ─── PRODUCTIVITY SCORE ────────────────────────────────────────────────────────
// Formula: weighted sum of 5 factors (0-100 scale)
// attendance(30%) + task_completion(30%) + overdue_penalty(20%) + consistency(10%) + leave_frequency(10%)

exports.calculateProductivityScore = async (employeeId, periodDays = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  // 1. Attendance score
  const totalWorkdays = getWorkdays(since, new Date());
  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    date: { $gte: since },
    status: { $in: ['present', 'late', 'half_day'] }
  });

  const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'late').length;
  const halfDays = attendanceRecords.filter(a => a.status === 'half_day').length;
  const effectiveDays = presentDays + (lateDays * 0.8) + (halfDays * 0.5);
  const attendanceScore = totalWorkdays > 0 ? Math.min((effectiveDays / totalWorkdays) * 100, 100) : 0;

  // 2. Task completion score
  const assignedTasks = await Task.find({
    assignedTo: employeeId,
    createdAt: { $gte: since }
  });

  const completedTasks = assignedTasks.filter(t => t.status === 'completed').length;
  const totalAssigned = assignedTasks.length;
  const taskCompletionScore = totalAssigned > 0 ? (completedTasks / totalAssigned) * 100 : 70; // Neutral if none

  // 3. Overdue penalty
  const overdueTasks = assignedTasks.filter(t => t.isOverdue || (t.completedAt && t.completedAt > t.dueDate)).length;
  const overdueRate = totalAssigned > 0 ? overdueTasks / totalAssigned : 0;
  const overdueScore = Math.max(0, 100 - (overdueRate * 150)); // -150 per overdue ratio

  // 4. Consistency score (variance in weekly performance)
  const weeklyCompletion = await getWeeklyTaskCompletion(employeeId, since);
  const consistencyScore = calculateConsistency(weeklyCompletion);

  // 5. Leave frequency score
  const leaves = await Leave.find({
    employee: employeeId,
    status: 'approved',
    startDate: { $gte: since }
  });
  const leaveDays = leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
  const leaveScore = Math.max(0, 100 - (leaveDays / periodDays) * 200);

  // Weighted final score
  const finalScore = Math.round(
    (attendanceScore * 0.30) +
    (taskCompletionScore * 0.30) +
    (overdueScore * 0.20) +
    (consistencyScore * 0.10) +
    (leaveScore * 0.10)
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    breakdown: {
      attendance: Math.round(attendanceScore),
      taskCompletion: Math.round(taskCompletionScore),
      overdueManagement: Math.round(overdueScore),
      consistency: Math.round(consistencyScore),
      leaveFrequency: Math.round(leaveScore)
    },
    rawData: {
      presentDays, lateDays, halfDays, totalWorkdays,
      completedTasks, totalAssigned, overdueTasks, leaveDays
    }
  };
};

// ─── DEADLINE RISK PREDICTION ──────────────────────────────────────────────────
// Predicts likelihood of a task being delayed based on multiple signals
exports.predictDeadlineRisk = (task, employeeProductivity, employeeActiveTasks) => {
  let riskScore = 0;
  const factors = [];

  const now = new Date();
  const daysUntilDue = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
  const totalDuration = Math.ceil((new Date(task.dueDate) - new Date(task.startDate || task.createdAt)) / (1000 * 60 * 60 * 24));
  const elapsed = totalDuration - daysUntilDue;
  const timeProgress = totalDuration > 0 ? elapsed / totalDuration : 0;
  const taskProgress = (task.progress || 0) / 100;

  // Factor 1: Progress vs time ratio
  if (timeProgress > 0.5 && taskProgress < 0.25) {
    riskScore += 35;
    factors.push('Task is behind schedule (time > 50%, progress < 25%)');
  } else if (timeProgress > 0.75 && taskProgress < 0.5) {
    riskScore += 30;
    factors.push('Critical lag: 75% time elapsed, <50% complete');
  } else if (timeProgress > taskProgress + 0.2) {
    riskScore += 20;
    factors.push('Progress lagging behind schedule');
  }

  // Factor 2: Days remaining
  if (daysUntilDue < 0) {
    riskScore += 40;
    factors.push('Task is already overdue');
  } else if (daysUntilDue <= 1) {
    riskScore += 30;
    factors.push('Due within 24 hours');
  } else if (daysUntilDue <= 3) {
    riskScore += 15;
    factors.push('Due within 3 days');
  }

  // Factor 3: Priority-based urgency
  if (task.priority === 'critical') riskScore += 10;
  else if (task.priority === 'high') riskScore += 5;

  // Factor 4: Employee workload
  if (employeeActiveTasks > 6) {
    riskScore += 20;
    factors.push(`Employee overloaded (${employeeActiveTasks} active tasks)`);
  } else if (employeeActiveTasks > 4) {
    riskScore += 10;
    factors.push(`High workload (${employeeActiveTasks} active tasks)`);
  }

  // Factor 5: Employee productivity
  if (employeeProductivity < 50) {
    riskScore += 15;
    factors.push('Employee productivity score below 50');
  } else if (employeeProductivity < 65) {
    riskScore += 8;
    factors.push('Employee productivity below average');
  }

  // Factor 6: Already in review/stuck statuses
  if (task.status === 'todo' && daysUntilDue <= 5) {
    riskScore += 15;
    factors.push('Not started yet with deadline approaching');
  }

  const finalRisk = Math.min(100, riskScore);
  const level = finalRisk >= 70 ? 'high' : finalRisk >= 40 ? 'medium' : 'low';

  return { riskScore: finalRisk, riskLevel: level, factors };
};

// ─── OVERLOAD DETECTION ────────────────────────────────────────────────────────
exports.detectOverload = async (employeeId) => {
  const activeTasks = await Task.find({
    assignedTo: employeeId,
    status: { $in: ['todo', 'in_progress', 'in_review'] }
  });

  const criticalCount = activeTasks.filter(t => t.priority === 'critical').length;
  const highCount = activeTasks.filter(t => t.priority === 'high').length;
  const totalEstimatedHours = activeTasks.reduce((sum, t) => sum + (t.estimatedHours || 2), 0);

  // Weighted task score
  const weightedCount = activeTasks.length + (criticalCount * 1.5) + (highCount * 0.5);

  const isOverloaded = weightedCount > 8 || totalEstimatedHours > 60;
  const overloadLevel = weightedCount > 12 ? 'critical' : weightedCount > 8 ? 'high' : weightedCount > 5 ? 'medium' : 'normal';

  return {
    isOverloaded,
    overloadLevel,
    activeTasks: activeTasks.length,
    criticalTasks: criticalCount,
    highPriorityTasks: highCount,
    estimatedHoursInQueue: totalEstimatedHours,
    weightedScore: Math.round(weightedCount)
  };
};

// ─── TASK RECOMMENDATION ───────────────────────────────────────────────────────
// Recommends best employee for a task based on workload, skills, and past performance
exports.recommendEmployeesForTask = async (task, candidateEmployeeIds) => {
  const scores = await Promise.all(candidateEmployeeIds.map(async (empId) => {
    const [productivity, overload] = await Promise.all([
      exports.calculateProductivityScore(empId, 30),
      exports.detectOverload(empId)
    ]);

    let score = 0;

    // Skill match (if task has required skills)
    const employee = await User.findById(empId).select('skills name department');
    if (task.tags && employee.skills) {
      const matchedSkills = task.tags.filter(tag =>
        employee.skills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()))
      );
      score += matchedSkills.length * 15;
    }

    // Productivity bonus
    score += (productivity.score / 100) * 30;

    // Workload penalty
    if (overload.overloadLevel === 'critical') score -= 40;
    else if (overload.overloadLevel === 'high') score -= 25;
    else if (overload.overloadLevel === 'medium') score -= 10;
    else score += 10; // Bonus for available capacity

    // Department match
    if (employee.department && task.department === employee.department) score += 10;

    return {
      employeeId: empId,
      employeeName: employee.name,
      department: employee.department,
      score: Math.round(Math.max(0, score)),
      productivityScore: productivity.score,
      currentActiveTasks: overload.activeTasks,
      overloadLevel: overload.overloadLevel,
      reason: buildRecommendationReason(score, productivity.score, overload, employee)
    };
  }));

  return scores.sort((a, b) => b.score - a.score);
};

// ─── PERFORMANCE SUMMARY ───────────────────────────────────────────────────────
exports.generatePerformanceSummary = async (employeeId, period = 'monthly') => {
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 90;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [productivity, overload, tasks, attendance, leaves] = await Promise.all([
    exports.calculateProductivityScore(employeeId, days),
    exports.detectOverload(employeeId),
    Task.find({ assignedTo: employeeId, createdAt: { $gte: since } }),
    Attendance.find({ employee: employeeId, date: { $gte: since } }),
    Leave.find({ employee: employeeId, startDate: { $gte: since }, status: 'approved' })
  ]);

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.isOverdue);
  const onTimeTasks = completedTasks.filter(t => t.completedAt <= t.dueDate);

  const onTimeRate = completedTasks.length > 0
    ? Math.round((onTimeTasks.length / completedTasks.length) * 100)
    : 0;

  const avgTaskTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => {
        const hrs = t.actualHours || t.estimatedHours || 0;
        return sum + hrs;
      }, 0) / completedTasks.length
    : 0;

  const presentDays = attendance.filter(a => ['present', 'late'].includes(a.status)).length;
  const workdays = getWorkdays(since, new Date());
  const attendanceRate = workdays > 0 ? Math.round((presentDays / workdays) * 100) : 0;

  // Determine performance tier
  const tier = productivity.score >= 85 ? 'exceptional' :
               productivity.score >= 70 ? 'good' :
               productivity.score >= 55 ? 'average' : 'needs_improvement';

  // Build natural language insights
  const insights = [];
  if (attendanceRate >= 95) insights.push('Excellent attendance record this period.');
  else if (attendanceRate < 80) insights.push('Attendance needs improvement - consider discussing with manager.');

  if (onTimeRate >= 90) insights.push('Consistently delivers tasks on time.');
  else if (onTimeRate < 60) insights.push('Deadline management needs attention.');

  if (overload.isOverloaded) insights.push('Currently managing a heavy workload - consider task redistribution.');
  if (completedTasks.length >= 10) insights.push(`High task throughput: ${completedTasks.length} tasks completed.`);

  const strengths = [];
  const improvements = [];

  if (productivity.breakdown.attendance >= 80) strengths.push('Attendance & punctuality');
  else improvements.push('Attendance consistency');
  if (productivity.breakdown.taskCompletion >= 80) strengths.push('Task completion rate');
  else improvements.push('Task completion rate');
  if (productivity.breakdown.overdueManagement >= 80) strengths.push('Meeting deadlines');
  else improvements.push('Deadline management');
  if (productivity.breakdown.consistency >= 75) strengths.push('Consistent performance');
  else improvements.push('Performance consistency');

  return {
    period,
    generatedAt: new Date(),
    productivityScore: productivity.score,
    performanceTier: tier,
    summary: {
      tasksAssigned: tasks.length,
      tasksCompleted: completedTasks.length,
      tasksOverdue: overdueTasks.length,
      onTimeDeliveryRate: onTimeRate,
      avgTaskCompletionHours: Math.round(avgTaskTime * 10) / 10,
      attendanceRate,
      presentDays,
      totalWorkdays: workdays,
      leaveDaysTaken: leaves.reduce((s, l) => s + (l.totalDays || 0), 0),
      activeTasksNow: overload.activeTasks
    },
    scoreBreakdown: productivity.breakdown,
    insights,
    strengths,
    areasForImprovement: improvements,
    rawData: productivity.rawData
  };
};

// ─── WORKLOAD BALANCE SUGGESTIONS ─────────────────────────────────────────────
exports.getWorkloadBalanceSuggestions = async (managerId) => {
  const team = await User.find({ manager: managerId, status: 'active' });
  const teamData = await Promise.all(team.map(async (emp) => {
    const [overload, productivity] = await Promise.all([
      exports.detectOverload(emp._id),
      exports.calculateProductivityScore(emp._id, 30)
    ]);
    return { employee: emp, overload, productivity };
  }));

  const overloaded = teamData.filter(d => d.overload.isOverloaded);
  const underutilized = teamData.filter(d => d.overload.activeTasks < 2 && d.overload.overloadLevel === 'normal');

  const suggestions = [];
  overloaded.forEach(over => {
    const targets = underutilized.filter(u => u.employee._id.toString() !== over.employee._id.toString());
    if (targets.length > 0) {
      suggestions.push({
        type: 'redistribute',
        from: { id: over.employee._id, name: over.employee.name, activeTasks: over.overload.activeTasks },
        to: targets.map(t => ({ id: t.employee._id, name: t.employee.name, activeTasks: t.overload.activeTasks })),
        message: `${over.employee.name} is overloaded with ${over.overload.activeTasks} tasks. Consider reassigning 1-2 tasks.`
      });
    }
  });

  return {
    teamSize: team.length,
    overloadedCount: overloaded.length,
    underutilizedCount: underutilized.length,
    suggestions,
    teamWorkloadData: teamData.map(d => ({
      employeeId: d.employee._id,
      name: d.employee.name,
      activeTasks: d.overload.activeTasks,
      overloadLevel: d.overload.overloadLevel,
      productivityScore: d.productivity.score
    }))
  };
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWorkdays(start, end) {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

async function getWeeklyTaskCompletion(employeeId, since) {
  const tasks = await Task.find({ assignedTo: employeeId, status: 'completed', completedAt: { $gte: since } });
  const weeks = {};
  tasks.forEach(t => {
    const week = getWeekNumber(t.completedAt);
    weeks[week] = (weeks[week] || 0) + 1;
  });
  return Object.values(weeks);
}

function calculateConsistency(weeklyValues) {
  if (!weeklyValues.length) return 60;
  const avg = weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length;
  if (avg === 0) return 30;
  const variance = weeklyValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / weeklyValues.length;
  const cv = Math.sqrt(variance) / avg; // coefficient of variation
  return Math.max(0, Math.round(100 - cv * 50));
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function buildRecommendationReason(score, productivity, overload, employee) {
  if (overload.overloadLevel === 'critical') return 'Currently overloaded - not recommended';
  if (productivity >= 80 && overload.overloadLevel === 'normal') return 'High performer with available capacity';
  if (productivity >= 70) return 'Good performer with manageable workload';
  if (overload.activeTasks < 2) return 'Has significant available capacity';
  return 'Available for assignment';
}
