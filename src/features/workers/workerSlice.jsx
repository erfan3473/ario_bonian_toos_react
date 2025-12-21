// src/features/workers/workerSlice.js

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const MAX_IDLE_MS = 5 * 60 * 1000; // 5 دقیقه

// ═══════════════════════════════════════════════════════════
// 📋 Async Thunks
// ═══════════════════════════════════════════════════════════

// 1️⃣ دریافت لیست کارگران
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

// 2️⃣ تاریخچه مکان کارگر
export const fetchWorkerHistory = createAsyncThunk(
  'workers/fetchHistory',
  async ({ workerId, timeRange = '24h' }, { rejectWithValue }) => {
    try {
      const end = new Date();
      const ranges = {
        '1h': 3600000,
        '24h': 86400000,
        '7d': 604800000,
      };
      const start = new Date(end.getTime() - (ranges[timeRange] || ranges['24h']));

      const { data } = await axiosInstance.get(
        `/workers/${workerId}/history/`,
        { params: { start: start.toISOString(), end: end.toISOString() } }
      );
      return { workerId, history: data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 3️⃣ حضور و غیاب روزانه
export const fetchDailyAttendance = createAsyncThunk(
  'workers/fetchDailyAttendance',
  async ({ projectId, date }, { rejectWithValue }) => {
    try {
      const config = {
        params: { project_id: projectId, date: date },
      };
      const { data } = await axiosInstance.get('/workers/attendance/list/', config);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت لیست حضور و غیاب');
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slice
// ═══════════════════════════════════════════════════════════

const workersSlice = createSlice({
  name: 'workers',
  initialState: {
    status: 'idle',
    error: null,
    allWorkers: {},

    history: {
      status: 'idle',
      error: null,
      data: {},
    },

    dailyAttendance: {
      list: [],
      loading: false,
      error: null,
    },
  },

  reducers: {
    updateWorkerLocation: (state, action) => {
      const u = action.payload;
      const workerId = u.id || u.worker_id;
      const lastUpdate = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();

      if (!state.allWorkers[workerId]) {
        state.allWorkers[workerId] = { id: workerId };
      }

      const worker = state.allWorkers[workerId];

      // اطلاعات پروفایل / شغلی
      worker.name = u.name ?? worker.name;
      worker.position = u.position ?? worker.position;
      worker.position_color_hex = u.position_color_hex ?? worker.position_color_hex;

      // هماهنگ با backend + موبایل
      if (u.current_project_id !== undefined) {
        worker.current_project_id = u.current_project_id;
      }
      if (u.current_project_name !== undefined) {
        worker.current_project_name = u.current_project_name;
      }
      if (u.today_attendance_status !== undefined) {
        worker.today_attendance_status = u.today_attendance_status;
      }

      // لوکیشن
      worker.latitude = u.latitude ?? worker.latitude;
      worker.longitude = u.longitude ?? worker.longitude;
      worker.accuracy = u.accuracy ?? worker.accuracy;
      worker.speed = u.speed ?? worker.speed;

      // وضعیت آنلاین/آفلاین
      worker.lastUpdate = lastUpdate;
      worker.stale = u.status === 'offline';
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
      .addCase(fetchWorkers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const workersMap = {};
        action.payload.forEach((w) => {
          const lastUpdate = w.last_location
            ? new Date(w.last_location.timestamp).getTime()
            : null;
          const isStale = !(lastUpdate && Date.now() - lastUpdate < MAX_IDLE_MS);

          workersMap[w.id] = {
            ...w,
            latitude: w.last_location?.latitude ?? null,
            longitude: w.last_location?.longitude ?? null,
            lastUpdate,
            stale: isStale,
            current_project_id: w.current_project_id || null,
            current_project_name: w.current_project_name || null,
             position_color_hex: w.position_color_hex || null, // ✅
          };
        });
        state.allWorkers = { ...state.allWorkers, ...workersMap };
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
      });
  },
});

// ═══════════════════════════════════════════════════════════
// 🔍 Selectors
// ═══════════════════════════════════════════════════════════

const selectAllWorkersObj = (state) => state.workers.allWorkers;
const selectProjectsList = (state) => state.projects.list; // ✅ از projects می‌خونیم
const selectSelectedProjectId = (state) => state.projects.selectedProjectId; // ✅ از projects

export const selectProjectDashboardStats = createSelector(
  [selectAllWorkersObj, selectProjectsList],
  (workersObj, projectsList) => {
    const workers = Object.values(workersObj);

    const dashboard = {
      projects: {},
      globalStats: {
        totalProjectsActive: 0,
        totalWorkers: workers.length,
        activeWorkers: 0,
      },
    };

    projectsList.forEach((p) => {
      dashboard.projects[p.id] = {
        id: p.id,
        name: p.name,
        totalWorkers: 0,
        activeWorkers: 0,
      };
    });

    dashboard.projects['uncategorized'] = {
      id: 'uncategorized',
      name: 'بدون پروژه',
      totalWorkers: 0,
      activeWorkers: 0,
    };

    workers.forEach((w) => {
      const pid = w.current_project_id || 'uncategorized';

      if (!dashboard.projects[pid] && pid !== 'uncategorized') {
        dashboard.projects[pid] = {
          id: pid,
          name: 'Unknown Project',
          totalWorkers: 0,
          activeWorkers: 0,
        };
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

export const {
  updateWorkerLocation,
  cleanupOldWorkers,
} = workersSlice.actions;

export default workersSlice.reducer;
