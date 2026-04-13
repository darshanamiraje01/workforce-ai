// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../utils/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try { const { data } = await authAPI.getMe(); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try { const { data } = await authAPI.updateProfile(formData); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false, error: null, initialized: false
  },
  reducers: {
    logout(state) {
      state.user = null; state.token = null;
      localStorage.removeItem('token'); localStorage.removeItem('user');
    },
    clearError(state) { state.error = null; }
  },
  extraReducers: (b) => {
    b.addCase(login.pending, s => { s.loading = true; s.error = null; })
     .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; })
     .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(getMe.fulfilled, (s, a) => { s.user = a.payload; s.initialized = true; localStorage.setItem('user', JSON.stringify(a.payload)); })
     .addCase(getMe.rejected, s => { s.initialized = true; })
     .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload; localStorage.setItem('user', JSON.stringify(a.payload)); });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
