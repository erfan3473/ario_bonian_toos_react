// src/features/workers/workerSlice.js

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const MAX_IDLE_MS = 5 * 60 * 1000; // ۵ دقیقه (تایمر آفلاین شدن سوکت)
const GRACE_PERIOD_MS = 60 * 60 * 1000; // ۱ ساعت (فرصت اولیه هنگام لود صفحه)

// ۱. دریافت تمام کارگران (ادمین)
export const fetchWorkers = createAsyncThunk(
  'workers/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/workers/');
      return Array.isArray(data) ? data : (data.results || []);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// ۲. تاریخچه لوکیشن کارگر
export const fetchWorkerHistory = createAsyncThunk(
  'workers/fetchHistory',
  async ({ workerId, timeRange = '24h' }, { rejectWithValue }) => {
    try {
      const end = new Date();
      const ranges = { 
        '1h': 3600000, 
        '24h': 86400000, 
        '7d': 604800000,
        '1m': 2592000000,
        '1y': 31536000000
      };
      
      const start = new Date(end.getTime() - (ranges[timeRange] || ranges['24h']));
      
      const { data } = await axiosInstance.get(`/workers/${workerId}/history/`, {
        params: { start: start.toISOString(), end: end.toISOString() }
      });
      return { workerId, history: data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// ۳. لیست حضور و غیاب روزانه یک پروژه
export const fetchDailyAttendance = createAsyncThunk(
  'workers/fetchDailyAttendance',
  async ({ projectId, date }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/workers/attendance/list/', {
        params: { project_id: projectId, date: date }
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت لیست حضور و غیاب');
    }
  }
);

// ۴. دریافت وضعیت حضور و غیاب شخصی جاری
export const fetchWorkerStatus = createAsyncThunk(
  'workers/fetchWorkerStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/workers/status/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت وضعیت حضور و غیاب');
    }
  }
);

// ۵. ثبت ورود/خروج/اضافه‌کاری
export const clockWorkerAction = createAsyncThunk(
  'workers/clockAction',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/workers/clock/', payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در ثبت عملیات');
    }
  }
);

// ۶. دریافت شیفت‌های ماهانه تجمیعی (برای داشبورد شخصی)
export const fetchMonthlyShifts = createAsyncThunk(
  'workers/fetchMonthlyShifts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { year, month } = params;
      const queryParams = {};
      if (year) queryParams.year = year;
      if (month) queryParams.month = month;

      const { data } = await axiosInstance.get('/workers/shifts/monthly/', {
        params: queryParams
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت آمار ماهانه');
    }
  }
);

// ۷. دریافت شیفت‌های سالانه تجمیعی
export const fetchYearlyShifts = createAsyncThunk(
  'workers/fetchYearlyShifts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { year } = params;
      const queryParams = {};
      if (year) queryParams.year = year;

      const { data } = await axiosInstance.get('/workers/shifts/yearly/', {
        params: queryParams
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت آمار سالانه');
    }
  }
);

// ۸. کارتابل زنده مدیران و سرپرستان
export const fetchManagerLiveCartable = createAsyncThunk(
  'workers/fetchManagerLiveCartable',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { date } = params;
      const queryParams = {};
      if (date) queryParams.date = date;

      const { data } = await axiosInstance.get('/workers/attendance/live/', {
        params: queryParams
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت کارتابل روزانه');
    }
  }
);

const processWorkerUpdate = (state, u) => {
  const workerId = u.id || u.worker_id;
  if (!workerId) return;

  const lastUpdate = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();

  if (!state.allWorkers[workerId]) {
    state.allWorkers[workerId] = { id: workerId };
  }

  const worker = state.allWorkers[workerId];

  if (u.type === 'heartbeat_update') {
    worker.lastUpdate = lastUpdate;
    worker.stale = false;
    return;
  }

  if (u.status === 'offline' || u.type === 'offline_update') {
    worker.stale = true;
    return;
  }

  if (u.latitude !== undefined) worker.latitude = u.latitude;
  if (u.longitude !== undefined) worker.longitude = u.longitude;
  if (u.accuracy !== undefined) worker.accuracy = u.accuracy;
  if (u.speed !== undefined) worker.speed = u.speed;
  if (u.location_enabled !== undefined) worker.location_enabled = u.location_enabled;
  if (u.permission_granted !== undefined) worker.permission_granted = u.permission_granted;
  if (u.gps_enabled !== undefined) worker.gps_enabled = u.gps_enabled;

  if (u.full_name !== undefined) worker.full_name = u.full_name;
  if (u.current_project_id !== undefined) worker.current_project_id = u.current_project_id;
  if (u.current_project_name !== undefined) worker.current_project_name = u.current_project_name;
  if (u.position_color_hex !== undefined) worker.position_color_hex = u.position_color_hex;

  if (u.today_attendance_status !== undefined) worker.today_attendance_status = u.today_attendance_status;
  if (u.shift_start !== undefined) worker.shift_start = u.shift_start;
  if (u.shift_end !== undefined) worker.shift_end = u.shift_end;
  if (u.is_shift_open !== undefined) worker.is_shift_open = u.is_shift_open;

  worker.lastUpdate = lastUpdate;
  worker.stale = false;
};

const workersSlice = createSlice({
  name: 'workers',
  initialState: {
    status: 'idle',
    error: null,
    allWorkers: {},
    history: { status: 'idle', error: null, data: {} },
    dailyAttendance: { list: [], loading: false, error: null },
    workerStatus: { data: null, loading: false, error: null },
    clockActionLoading: false,
    monthlyShifts: { data: null, loading: false, error: null },
    yearlyShifts: { data: null, loading: false, error: null },
    managerLiveCartable: { data: null, loading: false, error: null },
  },
  reducers: {
    updateWorkerLocation: (state, action) => {
      processWorkerUpdate(state, action.payload);
    },
    updateWorkersBatch: (state, action) => {
      const updates = action.payload;
      if (Array.isArray(updates)) {
        updates.forEach(u => processWorkerUpdate(state, u));
      }
    },
    cleanupOldWorkers: (state) => {
      const cutoff = Date.now() - MAX_IDLE_MS;
      Object.values(state.allWorkers).forEach((worker) => {
        if ((worker.lastUpdate || 0) < cutoff) {
          worker.stale = true;
        }
      });
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchWorkers
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const NOW = Date.now();
        const fetchedWorkers = action.payload || [];

        fetchedWorkers.forEach((w) => {
          const realLastUpdate = w.last_location
            ? new Date(w.last_location.timestamp).getTime()
            : null;
          const isRecentEnough = realLastUpdate && (NOW - realLastUpdate < GRACE_PERIOD_MS);
          const effectiveLastUpdate = isRecentEnough ? NOW : realLastUpdate;
          const existingWorker = state.allWorkers[w.id] || {};
          const keepSocketData = existingWorker.lastUpdate && effectiveLastUpdate && (existingWorker.lastUpdate > effectiveLastUpdate);

          state.allWorkers[w.id] = {
            ...existingWorker,
            id: w.id,
            full_name: w.full_name || 'اسم ثبت نشده',
            user_id: w.user_id || null,
            position: w.position || null,
            profile_image: w.profile_image || null,
            current_project_id: w.current_project_id || null,
            current_project_name: w.current_project_name || null,
            position_color_hex: w.position_color_hex || null,
            today_attendance_status: w.today_attendance_status || 'NOT_STARTED',
            shift_start: w.shift_start || null,
            shift_end: w.shift_end || null,
            latest_attendance_date_jalali: w.latest_attendance_date_jalali || null,
            latest_shift_in: w.latest_shift_in || null,
            latest_shift_out: w.latest_shift_out || null,
            is_shift_open: w.is_shift_open || false,
            latitude: keepSocketData ? existingWorker.latitude : (w.last_location?.latitude ?? null),
            longitude: keepSocketData ? existingWorker.longitude : (w.last_location?.longitude ?? null),
            speed: keepSocketData ? existingWorker.speed : (w.last_location?.speed || 0),
            gps_enabled: keepSocketData ? existingWorker.gps_enabled : (w.last_location?.gps_enabled ?? true),
            location_enabled: keepSocketData ? existingWorker.location_enabled : (w.last_location?.location_enabled ?? true),
            permission_granted: keepSocketData ? existingWorker.permission_granted : (w.last_location?.permission_granted ?? true),
            lastUpdate: keepSocketData ? existingWorker.lastUpdate : effectiveLastUpdate,
            stale: keepSocketData ? existingWorker.stale : !isRecentEnough,
            source: 'API_MERGED'
          };
        });
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // fetchWorkerHistory
      .addCase(fetchWorkerHistory.pending, (state) => {
        state.history.status = 'loading';
        state.history.error = null;
      })
      .addCase(fetchWorkerHistory.fulfilled, (state, action) => {
        const { workerId, history } = action.payload;
        state.history.data[workerId] = history;
        state.history.status = 'succeeded';
      })
      .addCase(fetchWorkerHistory.rejected, (state, action) => {
        state.history.status = 'failed';
        state.history.error = action.payload;
      })

      // fetchDailyAttendance
      .addCase(fetchDailyAttendance.pending, (state) => {
        state.dailyAttendance.loading = true;
        state.dailyAttendance.error = null;
      })
      .addCase(fetchDailyAttendance.fulfilled, (state, action) => {
        state.dailyAttendance.loading = false;
        state.dailyAttendance.list = action.payload;
      })
      .addCase(fetchDailyAttendance.rejected, (state, action) => {
        state.dailyAttendance.loading = false;
        state.dailyAttendance.error = action.payload;
      })

      // fetchWorkerStatus
      .addCase(fetchWorkerStatus.pending, (state) => {
        state.workerStatus.loading = true;
        state.workerStatus.error = null;
      })
      .addCase(fetchWorkerStatus.fulfilled, (state, action) => {
        state.workerStatus.loading = false;
        state.workerStatus.data = action.payload;
      })
      .addCase(fetchWorkerStatus.rejected, (state, action) => {
        state.workerStatus.loading = false;
        state.workerStatus.error = action.payload;
      })

      // clockWorkerAction
      .addCase(clockWorkerAction.pending, (state) => {
        state.clockActionLoading = true;
      })
      .addCase(clockWorkerAction.fulfilled, (state) => {
        state.clockActionLoading = false;
      })
      .addCase(clockWorkerAction.rejected, (state) => {
        state.clockActionLoading = false;
      })

      // fetchMonthlyShifts
      .addCase(fetchMonthlyShifts.pending, (state) => {
        state.monthlyShifts.loading = true;
        state.monthlyShifts.error = null;
      })
      .addCase(fetchMonthlyShifts.fulfilled, (state, action) => {
        state.monthlyShifts.loading = false;
        state.monthlyShifts.data = action.payload;
      })
      .addCase(fetchMonthlyShifts.rejected, (state, action) => {
        state.monthlyShifts.loading = false;
        state.monthlyShifts.error = action.payload;
      })

      // fetchYearlyShifts
      .addCase(fetchYearlyShifts.pending, (state) => {
        state.yearlyShifts.loading = true;
        state.yearlyShifts.error = null;
      })
      .addCase(fetchYearlyShifts.fulfilled, (state, action) => {
        state.yearlyShifts.loading = false;
        state.yearlyShifts.data = action.payload;
      })
      .addCase(fetchYearlyShifts.rejected, (state, action) => {
        state.yearlyShifts.loading = false;
        state.yearlyShifts.error = action.payload;
      })

      // fetchManagerLiveCartable
      .addCase(fetchManagerLiveCartable.pending, (state) => {
        state.managerLiveCartable.loading = true;
        state.managerLiveCartable.error = null;
      })
      .addCase(fetchManagerLiveCartable.fulfilled, (state, action) => {
        state.managerLiveCartable.loading = false;
        state.managerLiveCartable.data = action.payload;
      })
      .addCase(fetchManagerLiveCartable.rejected, (state, action) => {
        state.managerLiveCartable.loading = false;
        state.managerLiveCartable.error = action.payload;
      });
  },
});

const selectAllWorkersObj = (state) => state.workers.allWorkers;
const selectProjectsList = (state) => state.projects?.list || [];
const selectSelectedProjectId = (state) => state.projects?.selectedProjectId;

export const selectProjectDashboardStats = createSelector(
  [selectAllWorkersObj, selectProjectsList],
  (workersObj, projectsList) => {
    const workers = Object.values(workersObj);
    const dashboard = {
      projects: {},
      globalStats: { totalProjectsActive: 0, totalWorkers: workers.length, activeWorkers: 0 },
    };

    projectsList.forEach((p) => {
      dashboard.projects[p.id] = { id: p.id, name: p.name, totalWorkers: 0, activeWorkers: 0 };
    });
    dashboard.projects['uncategorized'] = { id: 'uncategorized', name: 'بدون پروژه', totalWorkers: 0, activeWorkers: 0 };

    workers.forEach((w) => {
      const pid = w.current_project_id || 'uncategorized';
      if (!dashboard.projects[pid] && pid !== 'uncategorized') {
        dashboard.projects[pid] = { id: pid, name: 'Unknown Project', totalWorkers: 0, activeWorkers: 0 };
      }
      dashboard.projects[pid].totalWorkers++;
      if (!w.stale) {
        dashboard.projects[pid].activeWorkers++;
        dashboard.globalStats.activeWorkers++;
      }
    });

    dashboard.globalStats.totalProjectsActive = projectsList.length;
    return dashboard;
  }
);

export const selectVisibleWorkers = createSelector(
  [selectAllWorkersObj, selectSelectedProjectId],
  (workersObj, selectedPid) => {
    const workers = Object.values(workersObj);
    if (!selectedPid) return workers; 
    if (selectedPid === 'uncategorized') {
      return workers.filter((w) => !w.current_project_id);
    }
    return workers.filter((w) => w.current_project_id === selectedPid);
  }
);

export const { updateWorkerLocation, updateWorkersBatch, cleanupOldWorkers } = workersSlice.actions;
export default workersSlice.reducer;