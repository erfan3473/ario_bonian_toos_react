// src/features/attendance/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// 🔄 گرفتن تایم‌شیت بر اساس بازه تاریخی
// GET /api/attendance/timesheet-range/?start_date=&end_date=&project_id=&position_id=&worker_id=&search=
export const fetchTimesheetByRange = createAsyncThunk(
  'attendance/fetchTimesheetByRange',
  async (params, { rejectWithValue }) => {
    try {
      const { start_date, end_date, project_id, position_id, worker_id, search } = params;

      const query = new URLSearchParams();
      if (start_date) query.append('start_date', start_date);
      if (end_date) query.append('end_date', end_date);
      if (project_id) query.append('project_id', project_id);
      if (position_id) query.append('position_id', position_id);
      if (worker_id) query.append('worker_id', worker_id);
      if (search) query.append('search', search);

      const qs = query.toString();
      const url = `/attendance/timesheet-range/${qs ? `?${qs}` : ''}`;

      const response = await api.get(url);
      return response.data;

    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت گزارش حضور'
      );
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    loading: false,
    error: null,

    meta: null,        // start_date, end_date, total_days, days, ...
    workers: [],       // لیست کارگرها
    byWorker: {},      // برای نما ۱
    byDay: {},         // برای نما ۲

    // فیلترهای فعلی UI
    filters: {
      start_date: null,
      end_date: null,
      projectId: null,
      positionId: null,
      workerId: null,
      search: '',
    },
  },
  reducers: {
    setTimesheetFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetTimesheet(state) {
      state.meta = null;
      state.workers = [];
      state.byWorker = {};
      state.byDay = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimesheetByRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetByRange.fulfilled, (state, action) => {
        state.loading = false;
        state.meta = action.data?.meta || action.payload.meta;
        state.workers = action.data?.workers || action.payload.workers;
        state.byWorker = action.data?.by_worker || action.payload.by_worker;
        state.byDay = action.data?.by_day || action.payload.by_day;
      })
      .addCase(fetchTimesheetByRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'خطا در دریافت گزارش حضور';
      });
  },
});

export const { setTimesheetFilters, resetTimesheet } = attendanceSlice.actions;

export default attendanceSlice.reducer;