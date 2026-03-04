// src/features/workers/workerSlice.js

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const MAX_IDLE_MS = 5 * 60 * 1000; // 5 دقیقه (تایمر آفلاین شدن سوکت)
const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 ساعت (فرصت اولیه هنگام لود صفحه)

export const fetchWorkers = createAsyncThunk(
  'workers/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/workers/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchWorkerHistory = createAsyncThunk(
  'workers/fetchHistory',
  async ({ workerId, timeRange = '24h' }, { rejectWithValue }) => {
    try {
      const end = new Date();
      const ranges = { '1h': 3600000, '24h': 86400000, '7d': 604800000 };
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

const processWorkerUpdate = (state, u) => {
  const workerId = u.id || u.worker_id;
  if (!workerId) return;

  const lastUpdate = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();

  if (!state.allWorkers[workerId]) {
    state.allWorkers[workerId] = { id: workerId };
  }

  const worker = state.allWorkers[workerId];

  // Heartbeat
  if (u.type === 'heartbeat_update') {
    worker.lastUpdate = lastUpdate;
    worker.stale = false;
    return;
  }

  // Offline
  if (u.status === 'offline' || u.type === 'offline_update') {
    worker.stale = true;
    return;
  }

  // لوکیشن
  if (u.latitude !== undefined) worker.latitude = u.latitude;
  if (u.longitude !== undefined) worker.longitude = u.longitude;
  if (u.accuracy !== undefined) worker.accuracy = u.accuracy;
  if (u.speed !== undefined) worker.speed = u.speed;

  // 🆕 وضعیت GPS
  if (u.gps_enabled !== undefined) {
    worker.gps_enabled = u.gps_enabled;
  }

  // متا دیتا
  if (u.full_name !== undefined) worker.full_name = u.full_name;
  if (u.current_project_id !== undefined) worker.current_project_id = u.current_project_id;
  if (u.current_project_name !== undefined) worker.current_project_name = u.current_project_name;

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
  },

  reducers: {
    updateWorkerLocation: (state, action) => {
      processWorkerUpdate(state, action.payload);
    },

    // 🚀 آپدیت دسته‌جمعی (Batch Update) - بهینه برای سوکت
    updateWorkersBatch: (state, action) => {
      const updates = action.payload;
      if (Array.isArray(updates)) {
        updates.forEach(u => processWorkerUpdate(state, u));
      }
    },

    cleanupOldWorkers: (state) => {
      const cutoff = Date.now() - MAX_IDLE_MS;
      Object.values(state.allWorkers).forEach((worker) => {
        // فقط اگر lastUpdate خیلی قدیمی باشد، استال می‌شود
        if ((worker.lastUpdate || 0) < cutoff) {
          worker.stale = true;
        }
      });
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const workersMap = {};
        const NOW = Date.now();
        
        console.log('📥 [fetchWorkers] Total workers:', action.payload.length);
        
        action.payload.forEach((w) => {
          // زمان واقعی آخرین لوکیشن ثبت شده در دیتابیس
          const realLastUpdate = w.last_location
            ? new Date(w.last_location.timestamp).getTime()
            : null;

          // ✅ منطق Grace Period:
          // آیا این دیتا مربوط به ۱ ساعت اخیر است؟
          const isRecentEnough = realLastUpdate && (NOW - realLastUpdate < GRACE_PERIOD_MS);
          
          // ✅ جلوگیری از باگ پرپر زدن (Flickering):
          // اگر دیتا "Recent" است، ما lastUpdate لوکال (داخل Redux) را به "الان" تغییر می‌دهیم.
          // چرا؟ چون اگر این کار را نکنیم، تابع cleanupOldWorkers (که ۵ دقیقه مهلت می‌دهد)
          // بلافاصله این کارگر را حذف می‌کند (چون دیتای دیتابیس مثلا ۲۰ دقیقه پیش بوده).
          // با این کار، کارگر تا ۵ دقیقه آینده در لیست سبز می‌ماند تا سوکت وصل شود.
          const effectiveLastUpdate = isRecentEnough ? NOW : realLastUpdate;

          workersMap[w.id] = {
            ...w,
            full_name: w.full_name || 'اسم ثبت نشده',
            user_id: w.user_id || null,
            latitude: w.last_location?.latitude ?? null,
            longitude: w.last_location?.longitude ?? null,
            
            // استفاده از زمان محاسبه شده برای جلوگیری از حذف زودهنگام
            lastUpdate: effectiveLastUpdate, 
            
            // وضعیت آنلاین بودن اولیه بر اساس Grace Period
            stale: !isRecentEnough, 
            
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
            gps_enabled: w.last_location?.gps_enabled ?? true,
            source: 'API'
          };
        });

        state.allWorkers = { ...state.allWorkers, ...workersMap };
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
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
      });
  },
});

const selectAllWorkersObj = (state) => state.workers.allWorkers;
const selectProjectsList = (state) => state.projects.list;
const selectSelectedProjectId = (state) => state.projects.selectedProjectId;

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
    return workers.filter((w) => w.current_project_id === selectedPid);
  }
);

export const { updateWorkerLocation, updateWorkersBatch, cleanupOldWorkers } = workersSlice.actions;
export default workersSlice.reducer;