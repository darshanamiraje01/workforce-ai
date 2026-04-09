// store/index.js
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { taskAPI, employeeAPI, notificationAPI, analyticsAPI, aiAPI } from '../utils/api';

// Task slice
export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await taskAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try { const { data } = await taskAPI.create(taskData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateTask = createAsyncThunk('tasks/update', async ({ id, updates }, { rejectWithValue }) => {
  try { const { data } = await taskAPI.update(id, updates); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const deleteTask = createAsyncThunk('tasks/delete', async (id, { rejectWithValue }) => {
  try { await taskAPI.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], pagination: {}, loading: false, error: null },
  reducers: { clearTaskError: s => { s.error = null; } },
  extraReducers: b => {
    b.addCase(fetchTasks.pending, s => { s.loading = true; })
     .addCase(fetchTasks.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.pagination = a.payload.pagination; })
     .addCase(fetchTasks.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(createTask.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(updateTask.fulfilled, (s, a) => { const i = s.items.findIndex(t => t._id === a.payload._id); if (i >= 0) s.items[i] = a.payload; })
     .addCase(deleteTask.fulfilled, (s, a) => { s.items = s.items.filter(t => t._id !== a.payload); });
  }
});

// Employee slice
export const fetchEmployees = createAsyncThunk('employees/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await employeeAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const employeeSlice = createSlice({
  name: 'employees',
  initialState: { items: [], pagination: {}, loading: false, error: null },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchEmployees.pending, s => { s.loading = true; })
     .addCase(fetchEmployees.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.pagination = a.payload.pagination; })
     .addCase(fetchEmployees.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

// Notification slice
export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await notificationAPI.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const markNotifRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try { await notificationAPI.markRead(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try { await notificationAPI.markAllRead(); }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const notifSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchNotifications.fulfilled, (s, a) => { s.items = a.payload.data; s.unreadCount = a.payload.unreadCount; })
     .addCase(markNotifRead.fulfilled, (s, a) => { const n = s.items.find(n => n._id === a.payload); if (n && !n.isRead) { n.isRead = true; s.unreadCount = Math.max(0, s.unreadCount - 1); } })
     .addCase(markAllRead.fulfilled, s => { s.items.forEach(n => n.isRead = true); s.unreadCount = 0; });
  }
});

// Analytics slice
export const fetchAnalyticsOverview = createAsyncThunk('analytics/overview', async (_, { rejectWithValue }) => {
  try { const { data } = await analyticsAPI.getOverview(); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchTeamInsights = createAsyncThunk('analytics/teamInsights', async (_, { rejectWithValue }) => {
  try { const { data } = await aiAPI.getTeamInsights(); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const fetchAtRiskTasks = createAsyncThunk('analytics/atRisk', async (_, { rejectWithValue }) => {
  try { const { data } = await aiAPI.getAtRiskTasks(); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: { overview: null, teamInsights: null, atRiskTasks: [], loading: false },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchAnalyticsOverview.pending, s => { s.loading = true; })
     .addCase(fetchAnalyticsOverview.fulfilled, (s, a) => { s.loading = false; s.overview = a.payload; })
     .addCase(fetchAnalyticsOverview.rejected, s => { s.loading = false; })
     .addCase(fetchTeamInsights.fulfilled, (s, a) => { s.teamInsights = a.payload; })
     .addCase(fetchAtRiskTasks.fulfilled, (s, a) => { s.atRiskTasks = a.payload; });
  }
});

export const { clearTaskError } = taskSlice.actions;

export default configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskSlice.reducer,
    employees: employeeSlice.reducer,
    notifications: notifSlice.reducer,
    analytics: analyticsSlice.reducer,
  }
});
