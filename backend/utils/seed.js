const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { Attendance, Leave, Notification } = require('../models/index');

const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Product'];
const positions = {
  Engineering: ['Senior Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'QA Engineer'],
  Design: ['UI/UX Designer', 'Graphic Designer', 'Product Designer'],
  Marketing: ['Marketing Manager', 'Content Strategist', 'SEO Specialist', 'Social Media Manager'],
  Sales: ['Sales Executive', 'Account Manager', 'Business Development'],
  HR: ['HR Manager', 'Talent Acquisition', 'HR Analyst'],
  Finance: ['Financial Analyst', 'Accountant', 'CFO'],
  Product: ['Product Manager', 'Product Owner', 'Business Analyst']
};
const skillSets = {
  Engineering: ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'TypeScript'],
  Design: ['Figma', 'Adobe XD', 'Sketch', 'Illustrator', 'Prototyping'],
  Marketing: ['SEO', 'Content Writing', 'Google Analytics', 'Email Marketing', 'Social Media'],
  Sales: ['CRM', 'Negotiation', 'Lead Generation', 'Salesforce'],
  HR: ['Recruitment', 'HRIS', 'Payroll', 'Employee Relations'],
  Finance: ['Excel', 'QuickBooks', 'Financial Modeling', 'SAP'],
  Product: ['Jira', 'Roadmapping', 'User Research', 'Agile', 'Scrum']
};

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }


// ** changed cz of error showing in duplicate employeeId
function makeEmployeeId(num){
  return `EMP${String(num).padStart(4, '0')}`;
}
//** */


async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🌱 Connected to MongoDB, seeding...');

  // Clear
  await Promise.all([User.deleteMany(), Task.deleteMany(), Attendance.deleteMany(), Leave.deleteMany(), Notification.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // Admin
  const admin = await User.create({
    name: 'Sarah Chen', 
    email: 'admin@workforce.ai', 
    password: 'Admin@123',
    role: 'admin', 
    department: 'Management', 
    position: 'CEO',
    // employeeId: 'EMP0001', 
    employeeId: makeEmployeeId(1),
    skills: ['Leadership', 'Strategy'], 
    joiningDate: daysAgo(730)
  });

  // Managers
  const managers = await User.create([
    { 
      name: 'Alex Rivera', 
      email: 'manager1@workforce.ai', 
      password: 'Manager@123', 
      role: 'manager', 
      department: 'Engineering', 
      position: 'Engineering Manager', 
      employeeId: makeEmployeeId(2),
      skills: ['React', 'Node.js', 'AWS'], 
      joiningDate: daysAgo(540), 
      salary: 120000, 
      location: 'San Francisco' },
    { 
      name: 'Priya Sharma', 
      email: 'manager2@workforce.ai', 
      password: 'Manager@123', role: 'manager', 
      department: 'Design', 
      position: 'Design Lead',
      employeeId: makeEmployeeId(3), 
      skills: ['Figma', 'Prototyping', 'User Research'], 
      joiningDate: daysAgo(480), 
      salary: 110000, 
      location: 'New York' },
    { 
      name: 'Marcus Johnson', 
      email: 'manager3@workforce.ai', 
      password: 'Manager@123', 
      role: 'manager', 
      department: 'Marketing', 
      position: 'Marketing Director', 
      employeeId: makeEmployeeId(4),
      skills: ['SEO', 'Content Strategy', 'Analytics'], 
      joiningDate: daysAgo(390), 
      salary: 105000, 
      location: 'Austin' },
  ]);

  // Employees (18 total)
  const employeeData = [];
  const names = ['James Wilson', 'Emma Davis', 'Liam Martinez', 'Olivia Taylor', 'Noah Anderson', 'Ava Thomas', 'Ethan Jackson', 'Isabella White', 'Lucas Harris', 'Mia Thompson', 'Mason Garcia', 'Sophie Lee', 'Aiden Clark', 'Charlotte Walker', 'Elijah Hall', 'Amelia Young', 'Logan King', 'Harper Scott'];

  names.forEach((name, i) => {
    const dept = departments[i % departments.length];
    const mgr = managers[i % managers.length];
    employeeData.push({
      name, 
      email: `${name.toLowerCase().replace(' ', '.')}@workforce.ai`,
      password: 'Employee@123', 
      role: 'employee',
      employeeId: makeEmployeeId(i+5),
      department: dept, 
      position: randItem(positions[dept] || ['Analyst']),
      skills: (skillSets[dept] || []).slice(0, randInt(2, 4)),
      manager: mgr._id, joiningDate: daysAgo(randInt(30, 600)),
      salary: randInt(55000, 95000), 
      location: randItem(['San Francisco', 'New York', 'Austin', 'Remote', 'Chicago']),
      status: i < 16 ? 'active' : 'on_leave'
    });
  });

  const employees = await User.create(employeeData);
  console.log(`✅ Created ${employees.length} employees`);

  // Tasks
  const taskTitles = [
    'Redesign dashboard UI', 'Fix authentication bug', 'Write API documentation',
    'Set up CI/CD pipeline', 'Performance optimization audit', 'Mobile app wireframes',
    'Q4 marketing campaign', 'Database migration script', 'User testing session',
    'Security vulnerability scan', 'Onboarding flow redesign', 'Analytics integration',
    'Email template system', 'SEO content audit', 'Payment gateway integration',
    'Employee handbook update', 'Sales funnel analysis', 'Feature flag implementation',
    'Accessibility audit', 'Data backup automation', 'Client presentation deck',
    'Code review guidelines', 'Hiring process revamp', 'API rate limiting setup'
  ];

  const statuses = ['todo', 'in_progress', 'in_review', 'completed', 'completed', 'completed'];
  const priorities = ['low', 'medium', 'medium', 'high', 'critical'];
  const projects = ['Platform v2', 'Mobile App', 'Internal Tools', 'Marketing Site', 'Data Pipeline', 'HR Portal'];

  const tasks = [];
  for (let i = 0; i < taskTitles.length; i++) {
    const emp = employees[i % employees.length];
    const mgr = managers[i % managers.length];
    const status = randItem(statuses);
    const dueOffset = randInt(-5, 20);
    const task = {
      title: taskTitles[i],
      description: `Complete ${taskTitles[i].toLowerCase()} as per specifications and requirements.`,
      assignedTo: emp._id, assignedBy: mgr._id,
      status, priority: randItem(priorities),
      dueDate: daysFromNow(dueOffset),
      startDate: daysAgo(randInt(3, 15)),
      estimatedHours: randInt(2, 20),
      progress: status === 'completed' ? 100 : status === 'in_review' ? randInt(80, 95) : status === 'in_progress' ? randInt(20, 75) : randInt(0, 15),
      project: randItem(projects),
      department: emp.department,
      tags: (skillSets[emp.department] || []).slice(0, 2),
      isOverdue: dueOffset < 0 && status !== 'completed',
      completedAt: status === 'completed' ? daysAgo(randInt(1, 5)) : undefined,
      actualHours: status === 'completed' ? randInt(2, 25) : undefined,
    };
    tasks.push(task);
  }
  await Task.create(tasks);
  console.log(`✅ Created ${tasks.length} tasks`);

  // Attendance (last 30 days for all employees)
  const attendanceRecords = [];
  const allEmployees = [...managers, ...employees];
  for (const emp of allEmployees) {
    for (let d = 29; d >= 0; d--) {
      const date = daysAgo(d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // Skip weekends

      const rand = Math.random();
      let status, checkIn, checkOut;
      if (rand < 0.75) {
        status = 'present';
        const h = randInt(8, 9), m = randInt(0, 30);
        checkIn = new Date(date); checkIn.setHours(h, m, 0);
        checkOut = new Date(date); checkOut.setHours(h + randInt(8, 9), randInt(0, 59), 0);
      } else if (rand < 0.87) {
        status = 'late';
        checkIn = new Date(date); checkIn.setHours(randInt(10, 11), randInt(0, 59), 0);
        checkOut = new Date(date); checkOut.setHours(randInt(18, 19), randInt(0, 59), 0);
      } else if (rand < 0.92) {
        status = 'half_day';
        checkIn = new Date(date); checkIn.setHours(9, 0, 0);
        checkOut = new Date(date); checkOut.setHours(13, 0, 0);
      } else {
        status = 'absent';
      }

      attendanceRecords.push({ employee: emp._id, date, status, checkIn, checkOut, markedBy: admin._id });
    }
  }
  await Attendance.insertMany(attendanceRecords, { ordered: false }).catch(() => {});
  console.log(`✅ Created ${attendanceRecords.length} attendance records`);

  // Leaves
  const leaveTypes = ['annual', 'sick', 'casual'];
  const leaveRecords = employees.slice(0, 8).map((emp, i) => ({
    employee: emp._id,
    leaveType: randItem(leaveTypes),
    startDate: daysFromNow(randInt(2, 15)),
    endDate: daysFromNow(randInt(16, 20)),
    reason: randItem(['Medical appointment', 'Family event', 'Personal reasons', 'Vacation', 'Child care']),
    status: randItem(['pending', 'pending', 'approved', 'rejected']),
    reviewedBy: managers[i % managers.length]._id
  }));
  await Leave.create(leaveRecords);
  console.log(`✅ Created ${leaveRecords.length} leave records`);

  // Notifications for admin
  await Notification.create([
    { recipient: admin._id, type: 'task_overdue', title: '3 Tasks Overdue', message: 'There are 3 overdue tasks requiring attention.', isRead: false },
    { recipient: admin._id, type: 'leave_request', title: 'Pending Leave Approvals', message: '5 leave requests are pending your review.', isRead: false },
    { recipient: admin._id, type: 'overload_alert', title: 'Overload Detected', message: 'James Wilson has 9 active tasks assigned.', isRead: false },
    { recipient: admin._id, type: 'system', title: 'Weekly Report Ready', message: 'The weekly performance report is now available.', isRead: true },
  ]);

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login credentials:');
  console.log('  Admin:    admin@workforce.ai      / Admin@123');
  console.log('  Manager:  manager1@workforce.ai   / Manager@123');
  console.log('  Employee: james.wilson@workforce.ai / Employee@123');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
