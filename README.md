# 🚀 WorkForce AI — Employee Management Platform

A production-grade full-stack MERN application with real AI-powered workforce intelligence.

## ✨ Features

### Core Functionality
- **JWT Authentication** with role-based access (Admin / Manager / Employee)
- **Employee Management** — directory, profiles, CRUD, department filtering
- **Task System** — Kanban & list views, status workflows, comments, progress tracking
- **Attendance Tracking** — daily records, check-in/out, monthly summaries
- **Leave Management** — request, approval/rejection workflow with notifications
- **Document Management** — upload, categorize, download employee files
- **Notifications** — real-time alerts for tasks, leaves, deadlines

### 🧠 Real AI Features (Rule-Based Logic)
All AI features compute scores from **actual database data** — no random values.

| Feature | Logic |
|---------|-------|
| **Productivity Score** | Attendance(30%) + Task completion(30%) + Overdue management(20%) + Consistency(10%) + Leave frequency(10%) |
| **Deadline Risk** | Progress vs time ratio, days remaining, employee workload, productivity baseline |
| **Overload Detection** | Active tasks count, critical/high priority weighting, estimated hours in queue |
| **Task Recommendations** | Skill match + productivity score + current workload capacity |
| **Performance Summary** | Auto-generated monthly report with strengths and improvement areas |

### 📊 Analytics
- Monthly task completion trends
- Department performance comparison  
- Team productivity radar charts
- At-risk task identification
- Workload redistribution suggestions

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Redux Toolkit |
| Routing | React Router v6 |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Uploads | Multer |
| Scheduler | node-cron |

## 📁 Project Structure

```
workforce/
├── backend/
│   ├── config/         # DB config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── services/       # AI service (core logic)
│   ├── utils/          # Seed script
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── common/     # Badge, Modal, Avatar, etc.
        │   └── layout/     # Sidebar, Topbar, AppLayout
        ├── pages/          # All page components
        ├── store/          # Redux slices
        ├── utils/          # API client
        └── styles/         # Global CSS
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Backend
cd workforce/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Frontend
cd ../frontend
npm install
```

### 2. Seed Database

```bash
cd backend
npm run seed
```

This creates:
- 1 Admin, 3 Managers, 18 Employees
- 24 Tasks with realistic data
- 30 days of attendance records
- Sample leaves and notifications

### 3. Run Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

## 🔑 Demo Credentials (Seeded Sample Data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workforce.ai | Admin@123 |
| Manager | manager1@workforce.ai | Manager@123 |
| Employee | james.wilson@workforce.ai | Employee@123 |

## 🔌 API Endpoints

```
POST   /api/auth/login
POST   /api/auth/register         (Admin only)
GET    /api/auth/me
PUT    /api/auth/update-profile
PUT    /api/auth/update-password

GET    /api/employees             (Admin/Manager)
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
GET    /api/employees/:id/stats

GET    /api/tasks
POST   /api/tasks                 (Admin/Manager)
GET    /api/tasks/:id
PUT    /api/tasks/:id
POST   /api/tasks/:id/comments

POST   /api/attendance
GET    /api/attendance

GET    /api/leaves
POST   /api/leaves
PUT    /api/leaves/:id/review     (Admin/Manager)

GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/mark-all-read

GET    /api/analytics/overview
GET    /api/analytics/attendance-trends

GET    /api/ai/productivity/:id
GET    /api/ai/at-risk-tasks
GET    /api/ai/workload-balance
GET    /api/ai/performance-summary/:id
GET    /api/ai/team-insights
```

## 🚀 Production Deployment

### Backend (Railway / Render)
```bash
# Set environment variables:
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```bash
# Set environment variable:
VITE_API_URL=https://your-backend.railway.app
```

Update `frontend/src/utils/api.js` baseURL to use `import.meta.env.VITE_API_URL`.

## 📝 License

MIT — free to use for any purpose.
