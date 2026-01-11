// src/features/attendance/attendanceSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// 🔄 ۱) گرفتن تایم‌شیت ماهانه
// GET /api/attendance/timesheet/?year=&month=&project_id=&position_id=&worker_id=&search=
export const fetchMonthlyTimesheet = createAsyncThunk(
  'attendance/fetchMonthlyTimesheet',
  async (params, { rejectWithValue }) => {
    try {
      const { year, month, projectId, positionId, workerId, search } = params;

      const query = new URLSearchParams();
      if (year) query.append('year', year);
      if (month) query.append('month', month);
      if (projectId) query.append('project_id', projectId);
      if (positionId) query.append('position_id', positionId);
      if (workerId) query.append('worker_id', workerId);
      if (search) query.append('search', search);

      const qs = query.toString();
      const url = `/attendance/timesheet/${qs ? `?${qs}` : ''}`;

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

    meta: null,        // year, month, days, ...
    workers: [],       // لیست کارگرها
    byWorker: {},      // برای نما ۱
    byDay: {},         // برای نما ۲

    // فیلترهای فعلی UI
    filters: {
      year: null,
      month: null,
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
      .addCase(fetchMonthlyTimesheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyTimesheet.fulfilled, (state, action) => {
        state.loading = false;
        state.meta = action.data?.meta || action.payload.meta;
        state.workers = action.data?.workers || action.payload.workers;
        state.byWorker = action.data?.by_worker || action.payload.by_worker;
        state.byDay = action.data?.by_day || action.payload.by_day;
      })
      .addCase(fetchMonthlyTimesheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'خطا در دریافت گزارش حضور';
      });
  },
});

export const { setTimesheetFilters, resetTimesheet } = attendanceSlice.actions;

export default attendanceSlice.reducer;
