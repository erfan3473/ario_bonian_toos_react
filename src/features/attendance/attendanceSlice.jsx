// src/features/attendance/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// =========================
// تایم‌شیت
// =========================
export const fetchTimesheetByRange = createAsyncThunk(
  'attendance/fetchTimesheetByRange',
  async (params, { rejectWithValue }) => {
    try {
      const {
        start_date,
        end_date,
        project_id,
        position_id,
        worker_id,
        search,
        night_start,
        night_end,
      } = params;

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

// =========================
// ویرایش اضافه‌کاری
// =========================
export const updateOvertime = createAsyncThunk(
  'attendance/updateOvertime',
  async ({ overtimeId, hours }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/attendance/update-overtime/${overtimeId}/`, {
        approved_minutes: hours,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ویرایش اضافه کار'
      );
    }
  }
);

// =========================
// تایید گروهی اضافه‌کاری
// =========================
export const approveBulkOvertime = createAsyncThunk(
  'attendance/approveBulkOvertime',
  async ({ start_date, end_date, worker_id }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/attendance/bulk-approve-overtime/`, {
        start_date,
        end_date,
        worker_id,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در تایید گروهی');
    }
  }
);

// =========================
// آمار GPS (تکی برای بازه کامل یک کارگر)
// =========================
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
      return {
        worker_id,
        data: response.data,
      };
    } catch (error) {
      return rejectWithValue({
        worker_id: params.worker_id,
        message: error.response?.data?.detail || 'خطا در دریافت آمار موقعیت مکانی',
      });
    }
  }
);

// =========================
// آمار GPS (گروهی تجمیعی)
// =========================
export const fetchBulkWorkerLocationStats = createAsyncThunk(
  'attendance/fetchBulkWorkerLocationStats',
  async ({ worker_ids, start_date, end_date, project_id }, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/worker-location-stats-bulk/', {
        worker_ids,
        start_date,
        end_date,
        project_id: project_id || null,
      });
      return response.data?.results || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در محاسبه گروهی آمار موقعیت مکانی'
      );
    }
  }
);

// =========================
// آمار GPS روزانه (به‌تفکیک کارگر و روز با کش Redis)
// =========================
export const fetchDailyBulkWorkerLocationStats = createAsyncThunk(
  'attendance/fetchDailyBulkWorkerLocationStats',
  async (
    { worker_ids, start_date, end_date, project_id, force_refresh = false },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/attendance/worker-location-stats-daily-bulk/', {
        worker_ids,
        start_date,
        end_date,
        project_id: project_id || null,
        force_refresh,
      });
      return response.data?.daily_results || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت آمار مکانی روزانه'
      );
    }
  }
);

// =========================
// SMS حضور
// =========================
export const sendAttendanceSms = createAsyncThunk(
  'attendance/sendAttendanceSms',
  async ({ worker_id, date }, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/send-attendance-sms/', {
        worker_id,
        date,
      });
      return {
        ...response.data,
        worker_id,
        date,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ارسال پیامک حضور'
      );
    }
  }
);

export const refreshAttendanceSmsStatus = createAsyncThunk(
  'attendance/refreshAttendanceSmsStatus',
  async ({ log_id, worker_id, date }, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/refresh_attendance_sms/', {
        log_id,
      });
      return {
        ...response.data,
        worker_id,
        date,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت پیامک'
      );
    }
  }
);

export const fetchAttendanceSmsLogs = createAsyncThunk(
  'attendance/fetchAttendanceSmsLogs',
  async ({ worker_id, date }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/attendance/attendance-sms-logs/?worker_id=${worker_id}&date=${date}`
      );
      return {
        worker_id,
        date,
        logs: response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت لاگ پیامک‌ها'
      );
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  meta: null,
  workers: [],
  byWorker: {},
  byDay: {},

  locationStatsLoading: false,
  locationStats: null,
  locationStatsError: null,

  locationStatsByWorker: {},
  locationStatsLoadingByWorker: {},
  locationStatsErrorByWorker: {},
  bulkLocationStatsLoading: false,
  bulkLocationStatsError: null,

  // آمار مکانی روزانه با کلید `${workerId}:${gregorianDate}`
  dailyLocationStats: {},
  dailyLocationError: null,

  smsLogsByKey: {},
  smsSendingKey: null,
  smsRefreshingId: null,
  smsLogsLoadingKey: null,

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
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
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
      state.locationStats = null;
      state.locationStatsError = null;
      state.locationStatsByWorker = {};
      state.locationStatsLoadingByWorker = {};
      state.locationStatsErrorByWorker = {};
      state.bulkLocationStatsLoading = false;
      state.bulkLocationStatsError = null;
      state.dailyLocationStats = {};
      state.dailyLocationError = null;
      state.smsLogsByKey = {};
      state.smsSendingKey = null;
      state.smsRefreshingId = null;
      state.smsLogsLoadingKey = null;
    },
    clearAttendanceError(state) {
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
        state.meta = action.payload.meta;
        state.workers = action.payload.workers;
        state.byWorker = action.payload.by_worker;
        state.byDay = action.payload.by_day;

        // پاکسازی کش GPS بازه قبلی
        state.locationStats = null;
        state.locationStatsError = null;
        state.locationStatsByWorker = {};
        state.locationStatsLoadingByWorker = {};
        state.locationStatsErrorByWorker = {};
        state.bulkLocationStatsError = null;
        state.dailyLocationStats = {};
        state.dailyLocationError = null;

        const newSmsLogsByKey = { ...state.smsLogsByKey };
        if (action.payload.by_day) {
          Object.entries(action.payload.by_day).forEach(([dateStr, dayData]) => {
            (dayData.workers || []).forEach((w) => {
              const key = `${w.worker_id}-${dateStr}`;
              if (w.sms_logs && w.sms_logs.length > 0) {
                newSmsLogsByKey[key] = w.sms_logs;
              }
            });
          });
        }
        state.smsLogsByKey = newSmsLogsByKey;
      })
      .addCase(fetchTimesheetByRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateOvertime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOvertime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateOvertime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchWorkerLocationStats.pending, (state, action) => {
        const wid = String(action.meta.arg.worker_id);
        state.locationStatsLoading = true;
        state.locationStatsError = null;
        state.locationStatsLoadingByWorker[wid] = true;
        state.locationStatsErrorByWorker[wid] = null;
      })
      .addCase(fetchWorkerLocationStats.fulfilled, (state, action) => {
        const wid = String(action.payload.worker_id);
        state.locationStatsLoading = false;
        state.locationStats = action.payload.data;
        state.locationStatsLoadingByWorker[wid] = false;
        state.locationStatsByWorker[wid] = action.payload.data;
      })
      .addCase(fetchWorkerLocationStats.rejected, (state, action) => {
        const wid = String(action.payload?.worker_id ?? action.meta.arg.worker_id);
        const message = action.payload?.message || 'خطا در دریافت آمار موقعیت مکانی';
        state.locationStatsLoading = false;
        state.locationStatsError = message;
        state.locationStatsLoadingByWorker[wid] = false;
        state.locationStatsErrorByWorker[wid] = message;
      })

      .addCase(fetchBulkWorkerLocationStats.pending, (state) => {
        state.bulkLocationStatsLoading = true;
        state.bulkLocationStatsError = null;
      })
      .addCase(fetchBulkWorkerLocationStats.fulfilled, (state, action) => {
        state.bulkLocationStatsLoading = false;
        state.locationStatsByWorker = {
          ...state.locationStatsByWorker,
          ...action.payload,
        };
      })
      .addCase(fetchBulkWorkerLocationStats.rejected, (state, action) => {
        state.bulkLocationStatsLoading = false;
        state.bulkLocationStatsError = action.payload;
      })

      .addCase(fetchDailyBulkWorkerLocationStats.pending, (state) => {
        state.dailyLocationError = null;
      })
      .addCase(fetchDailyBulkWorkerLocationStats.fulfilled, (state, action) => {
        state.dailyLocationStats = {
          ...state.dailyLocationStats,
          ...action.payload,
        };
      })
      .addCase(fetchDailyBulkWorkerLocationStats.rejected, (state, action) => {
        state.dailyLocationError = action.payload;
      })

      .addCase(approveBulkOvertime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveBulkOvertime.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(approveBulkOvertime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAttendanceSmsLogs.pending, (state, action) => {
        state.error = null;
        state.smsLogsLoadingKey = `${action.meta.arg.worker_id}-${action.meta.arg.date}`;
      })
      .addCase(fetchAttendanceSmsLogs.fulfilled, (state, action) => {
        const { worker_id, date, logs } = action.payload;
        state.smsLogsLoadingKey = null;
        state.smsLogsByKey[`${worker_id}-${date}`] = logs;
      })
      .addCase(fetchAttendanceSmsLogs.rejected, (state, action) => {
        state.smsLogsLoadingKey = null;
        state.error = action.payload;
      })

      .addCase(sendAttendanceSms.pending, (state, action) => {
        state.error = null;
        state.smsSendingKey = `${action.meta.arg.worker_id}-${action.meta.arg.date}`;
      })
      .addCase(sendAttendanceSms.fulfilled, (state, action) => {
        state.smsSendingKey = null;
        const key = `${action.payload.worker_id}-${action.payload.date}`;
        if (!state.smsLogsByKey[key]) state.smsLogsByKey[key] = [];
        state.smsLogsByKey[key].unshift(action.payload);
      })
      .addCase(sendAttendanceSms.rejected, (state, action) => {
        state.smsSendingKey = null;
        state.error = action.payload;
      })

      .addCase(refreshAttendanceSmsStatus.pending, (state, action) => {
        state.error = null;
        state.smsRefreshingId = action.meta.arg.log_id;
      })
      .addCase(refreshAttendanceSmsStatus.fulfilled, (state, action) => {
        state.smsRefreshingId = null;
        const key = `${action.payload.worker_id}-${action.payload.date}`;
        const logs = state.smsLogsByKey[key] || [];
        state.smsLogsByKey[key] = logs.map((log) =>
          log.id === action.payload.id ? action.payload : log
        );
      })
      .addCase(refreshAttendanceSmsStatus.rejected, (state, action) => {
        state.smsRefreshingId = null;
        state.error = action.payload;
      });
  },
});

export const { setTimesheetFilters, resetTimesheet, clearAttendanceError } =
  attendanceSlice.actions;

export default attendanceSlice.reducer;