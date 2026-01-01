// src/features/workers/workerSlice.js

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const MAX_IDLE_MS = 5 * 60 * 1000; // 5 دقیقه

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
      const u = action.payload;
      const workerId = u.id || u.worker_id;
      const lastUpdate = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();

      if (!state.allWorkers[workerId]) {
        state.allWorkers[workerId] = { id: workerId };
      }

      const worker = state.allWorkers[workerId];

      // ✅ Heartbeat
      if (u.type === 'heartbeat_update') {
        worker.lastUpdate = lastUpdate;
        worker.stale = false;
        return;
      }

      // ✅ Location
      if (u.latitude !== undefined) worker.latitude = u.latitude;
      if (u.longitude !== undefined) worker.longitude = u.longitude;
      if (u.accuracy !== undefined) worker.accuracy = u.accuracy;
      if (u.speed !== undefined) worker.speed = u.speed;

      // ✅ Basic (فقط از REST API میاد - preserve if not in payload)
      if (u.full_name !== undefined) worker.full_name = u.full_name;
      if (u.user_id !== undefined) worker.user_id = u.user_id;
      if (u.position !== undefined) worker.position = u.position;
      if (u.position_color_hex !== undefined) worker.position_color_hex = u.position_color_hex;

      // ✅ Project
      if (u.current_project_id !== undefined) worker.current_project_id = u.current_project_id;
      if (u.current_project_name !== undefined) worker.current_project_name = u.current_project_name;

      // ✅ Attendance (preserve if not in payload)
      if (u.today_attendance_status !== undefined) worker.today_attendance_status = u.today_attendance_status;
      if (u.shift_start !== undefined) worker.shift_start = u.shift_start;
      if (u.shift_end !== undefined) worker.shift_end = u.shift_end;
      
      // ✅ Latest attendance (preserve if not in payload)
      if (u.latest_attendance_date_jalali !== undefined) {
        worker.latest_attendance_date_jalali = u.latest_attendance_date_jalali;
      }
      if (u.latest_shift_in !== undefined) worker.latest_shift_in = u.latest_shift_in;
      if (u.latest_shift_out !== undefined) worker.latest_shift_out = u.latest_shift_out;
      if (u.is_shift_open !== undefined) worker.is_shift_open = u.is_shift_open;

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
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const workersMap = {};
        
        // ✅ Debug
        console.log('📥 [fetchWorkers] Total workers:', action.payload.length);
        
        action.payload.forEach((w) => {
          const lastUpdate = w.last_location
            ? new Date(w.last_location.timestamp).getTime()
            : null;
          const isStale = !(lastUpdate && Date.now() - lastUpdate < MAX_IDLE_MS);

          // ✅ Debug
          console.log(`👤 Worker ${w.id} (${w.full_name}):`, {
            latest_shift_in: w.latest_shift_in,
            latest_shift_out: w.latest_shift_out,
            shift_start: w.shift_start,
            shift_end: w.shift_end,
            stale: isStale,
          });

          workersMap[w.id] = {
            ...w,
            full_name: w.full_name || 'اسم ثبت نشده',
            user_id: w.user_id || null,
            latitude: w.last_location?.latitude ?? null,
            longitude: w.last_location?.longitude ?? null,
            lastUpdate,
            stale: isStale,
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

export const { updateWorkerLocation, cleanupOldWorkers } = workersSlice.actions;
export default workersSlice.reducer;
