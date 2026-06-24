// src/features/attendance/attendanceSlice
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// ... (fetchTimesheetByRange سر جای خود بماند) ...
export const fetchTimesheetByRange = createAsyncThunk(
  'attendance/fetchTimesheetByRange',
  async (params, { rejectWithValue }) => {
    try {
      const { start_date, end_date, project_id, position_id, worker_id, search, night_start, night_end } = params;
      const query = new URLSearchParams();
      if (start_date) query.append('start_date', start_date);
      if (end_date) query.append('end_date', end_date);
      if (project_id) query.append('project_id', project_id);
      if (position_id) query.append('position_id', position_id);
      if (worker_id) query.append('worker_id', worker_id);
      if (search) query.append('search', search);
      if (night_start) query.append('night_start', night_start);
      if (night_end) query.append('night_end', night_end);

      const response = await api.get(`/attendance/timesheet-range/?${query.toString()}`);
       return response.data;
    } catch (error) {
       return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت گزارش');
    }
  }
);

// 🆕 آپدیت تکی اضافه کار
export const updateOvertime = createAsyncThunk(
  'attendance/updateOvertime',
  async ({ overtimeId, hours }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/attendance/update-overtime/${overtimeId}/`, {
        overtime_hours: hours,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ویرایش اضافه کار'
      );
    }
  }
);

// 🆕 تایید گروهی اضافه کار
export const approveBulkOvertime = createAsyncThunk(
  'attendance/approveBulkOvertime',
  async ({ start_date, end_date, worker_id }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/attendance/bulk-approve-overtime/`, {
        start_date,
        end_date,
        worker_id, // اختیاری
      });
      return response.data; // { message, updated_count }
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در تایید گروهی');
    }
  }
);

// 🆕 دریافت آمار و تحلیل GPS کارگر
export const fetchWorkerLocationStats = createAsyncThunk(
  'attendance/fetchWorkerLocationStats',
  async (params, { rejectWithValue }) => {
    try {
      const { start_date, end_date, project_id, worker_id } = params;
      const query = new URLSearchParams();
      if (start_date) query.append('start_date', start_date);
      if (end_date) query.append('end_date', end_date);
      if (project_id) query.append('project_id', project_id);
      if (worker_id) query.append('worker_id', worker_id);

      const response = await api.get(`/attendance/worker-location-stats/?${query.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت آمار موقعیت مکانی'
      );
    }
  }
);


const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    loading: false,
    error: null,
    meta: null,
    workers: [],
    byWorker: {},
    byDay: {},
    
    // 👇 استیت‌های مربوط به آمار GPS اضافه شد
    locationStatsLoading: false,
    locationStats: null,
    locationStatsError: null,

    filters: {
      start_date: null,
      end_date: null,
      projectId: null,
      positionId: null,
      workerId: null,
      search: '',
      night_start: '22:00', 
      night_end: '06:00', 
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
      // 👇 ریست کردن دیتای نقشه
      state.locationStats = null;
      state.locationStatsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTimesheetByRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheetByRange.fulfilled, (state, action) => {
        state.loading = false;
        state.meta = action.payload.meta;
        state.workers = action.payload.workers;
        state.byWorker = action.payload.by_worker;
        state.byDay = action.payload.by_day;
      })
      .addCase(fetchTimesheetByRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
    
      .addCase(updateOvertime.fulfilled, (state, action) => {
        
      })

      // Fetch Worker Location Stats
      .addCase(fetchWorkerLocationStats.pending, (state) => {
        state.locationStatsLoading = true;
        state.locationStatsError = null;
      })
      .addCase(fetchWorkerLocationStats.fulfilled, (state, action) => {
        state.locationStatsLoading = false;
        state.locationStats = action.payload; // دیتای آماده برای چارت
      })
      .addCase(fetchWorkerLocationStats.rejected, (state, action) => {
        state.locationStatsLoading = false;
        state.locationStatsError = action.payload;
      })
      
      // Bulk Approve
      .addCase(approveBulkOvertime.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveBulkOvertime.fulfilled, (state) => {
        state.loading = false;
        // بعد از تایید گروهی، باید دیتا رفرش شود تا اعداد جدید نمایش داده شوند
      })
      .addCase(approveBulkOvertime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setTimesheetFilters, resetTimesheet } = attendanceSlice.actions;
export default attendanceSlice.reducer;