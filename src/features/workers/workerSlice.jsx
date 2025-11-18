import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const MAX_IDLE_MS = 5 * 60 * 1000; // ۵ دقیقه برای stale شدن (تشخیص قطعی)

// ==================================================================
// 🌐 Async Thunks (ارتباط با سرور)
// ==================================================================

// ۱) دریافت لیست کارگران (مانند قبل)
export const fetchWorkers = createAsyncThunk(
  'workers/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/workers/');
      return data;
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);

// ۲) دریافت تاریخچه مسیر (مانند قبل)
export const fetchWorkerHistory = createAsyncThunk(
  'workers/fetchHistory',
  async ({ workerId, timeRange = '24h' }, { rejectWithValue }) => {
    try {
      const end = new Date();
      const ranges = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };
      const diff = ranges[timeRange] || ranges['24h'];
      const start = new Date(end.getTime() - diff);

      const params = {
        start: start.toISOString(),
        end: end.toISOString(),
      };

      const { data } = await axiosInstance.get(
        `/workers/${workerId}/history/`,
        { params }
      );

      return { workerId, history: data };
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);

// ۳) دریافت لیست پروژه‌ها (جدید - برای دسته‌بندی) 🆕
// فرض بر این است که اندپوینت /projects/ لیست پروژه‌ها را برمی‌گرداند
export const fetchProjects = createAsyncThunk(
  'workers/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/projects/'); 
      return data;
    } catch (error) {
      // اگر هنوز API پروژه نداری، فعلا یک لیست خالی یا ماک برگردان
      // return []; 
      const message = error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);

// ==================================================================
// 📦 Initial State
// ==================================================================
const initialState = {
  status: 'idle', // وضعیت کلی دریافت کارگران
  error: null,
  
  // دیکشنری کارگران: { [id]: { ...workerData } }
  allWorkers: {}, 
  
  // مدیریت پروژه‌ها (برای فیلترینگ و آمار)
  projects: {
    status: 'idle',
    list: [], // لیست خام پروژه‌ها از سرور
    selectedProjectId: null, // اگر null باشد یعنی نمای کلی (همه پروژه‌ها)
  },

  // تاریخچه مسیر برای نقشه
  history: {
    status: 'idle',
    error: null,
    data: {}, // { [workerId]: [locations...] }
  },
};

// ==================================================================
// ✂️ Slice Definition
// ==================================================================
const workersSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    // 🔄 آپدیت لوکیشن از طریق WebSocket
    updateWorkerLocation: (state, action) => {
      const u = action.payload;
      const workerId = u.id || u.worker_id;
      const lastUpdate = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();

      if (!state.allWorkers[workerId]) {
        // اگر کارگر جدید بود و قبلاً در لیست نبود
        state.allWorkers[workerId] = { id: workerId };
      }

      const worker = state.allWorkers[workerId];

      // بروزرسانی فیلدها
      worker.name = u.name ?? worker.name;
      worker.position = u.position ?? worker.position;
      // مهم: پروژه فعلی کارگر هم باید آپدیت شود
      worker.current_project_id = u.current_project_id ?? worker.current_project_id; 
      
      worker.latitude = u.latitude ?? worker.latitude;
      worker.longitude = u.longitude ?? worker.longitude;
      worker.accuracy = u.accuracy ?? worker.accuracy;
      worker.speed = u.speed ?? worker.speed;
      
      worker.lastUpdate = lastUpdate;
      // اگر وضعیت آفلاین آمده باشد یا دیتای خیلی قدیمی باشد
      worker.stale = u.status === 'offline' ? true : false;
    },

    // 🧹 پاک‌سازی و تشخیص قطعی ارتباط (Stale Check)
    cleanupOldWorkers: (state) => {
      const cutoff = Date.now() - MAX_IDLE_MS;
      Object.values(state.allWorkers).forEach((worker) => {
        if ((worker.lastUpdate || 0) < cutoff) {
          worker.stale = true;
        }
      });
    },

    // 🎯 انتخاب پروژه برای فیلتر کردن داشبورد
    setSelectedProject: (state, action) => {
      state.projects.selectedProjectId = action.payload; // id یا null
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- fetchWorkers ----
      .addCase(fetchWorkers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const workersMap = {};
        action.payload.forEach((w) => {
          // منطق تبدیل دیتای اولیه
          const lastUpdate = w.last_location
            ? new Date(w.last_location.timestamp).getTime()
            : null;
          
          // تشخیص stale بودن اولیه
          const isStale = !(lastUpdate && Date.now() - lastUpdate < MAX_IDLE_MS);

          workersMap[w.id] = {
            ...w,
            latitude: w.last_location?.latitude ?? null,
            longitude: w.last_location?.longitude ?? null,
            lastUpdate,
            stale: isStale,
            // فرض بر این است که در GET /workers/ فیلد current_project_id هم می‌آید
            // اگر نمی‌آید، باید در بک‌اند به WorkerSerializer اضافه شود
          };
        });
        // مرج کردن با دیتای موجود (تا دیتای سوکت نپرد)
        state.allWorkers = { ...state.allWorkers, ...workersMap };
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // ---- fetchWorkerHistory ----
      .addCase(fetchWorkerHistory.fulfilled, (state, action) => {
        const { workerId, history } = action.payload;
        state.history.data[workerId] = history;
        state.history.status = 'succeeded';
      })

      // ---- fetchProjects (جدید) ----
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects.status = 'succeeded';
        state.projects.list = action.payload;
      });
  },
});

// ==================================================================
// 🧠 Selectors (مغز متفکر داشبورد چند پروژه‌ای)
// ==================================================================

// ۱. سلکتور ساده برای گرفتن همه کارگران
const selectAllWorkersObj = (state) => state.workers.allWorkers;
const selectProjectsList = (state) => state.workers.projects.list;
const selectSelectedProjectId = (state) => state.workers.projects.selectedProjectId;

// ۲. تولید ساختار درختی (Dashboard State) که کارفرما نیاز دارد
// این سلکتور به صورت اتوماتیک هر بار که allWorkers تغییر کند، آمار را آپدیت می‌کند.
export const selectProjectDashboardStats = createSelector(
  [selectAllWorkersObj, selectProjectsList],
  (workersObj, projectsList) => {
    const workers = Object.values(workersObj);

    // ساختار اولیه خروجی
    const dashboard = {
      projects: {}, // { [projectId]: { ...stats } }
      globalStats: {
        totalProjectsActive: 0,
        totalWorkers: workers.length,
        activeWorkers: 0, // آنلاین‌ها
        activeAlerts: 0, // مثلا خارج از محدوده
      }
    };

    // الف) آماده‌سازی آبجکت پروژه‌ها
    projectsList.forEach(p => {
      dashboard.projects[p.id] = {
        id: p.id,
        name: p.name,
        location: p.location_boundary, // یا مرکز مختصات
        totalWorkers: 0,
        activeWorkers: 0,
        workers: [], // لیست ID کارگران این پروژه
        status: p.is_active ? 'active' : 'inactive'
      };
    });
    // یک پروژه مجازی برای کارگران بدون پروژه
    dashboard.projects['uncategorized'] = {
        id: 'uncategorized',
        name: 'بدون پروژه',
        totalWorkers: 0, activeWorkers: 0, workers: [], status: 'warning'
    };

    // ب) پر کردن آمار با پیمایش لیست کارگران
    workers.forEach(w => {
      const pid = w.current_project_id || 'uncategorized';
      
      // اگر پروژه‌ای در لیست نیست (شاید حذف شده)، یک آبجکت موقت بساز
      if (!dashboard.projects[pid] && pid !== 'uncategorized') {
         dashboard.projects[pid] = { 
             id: pid, name: `Project ${pid}`, totalWorkers: 0, activeWorkers: 0, workers: [] 
         };
      }

      // افزودن کارگر به پروژه مربوطه
      dashboard.projects[pid].workers.push(w.id);
      dashboard.projects[pid].totalWorkers += 1;

      // چک کردن آنلاین بودن
      if (!w.stale) {
        dashboard.projects[pid].activeWorkers += 1;
        dashboard.globalStats.activeWorkers += 1;
      }

      // اینجا می‌توانید چک Geofence را هم اضافه کنید
      // if (isOutOfZone(w, dashboard.projects[pid].location)) dashboard.globalStats.activeAlerts++;
    });

    dashboard.globalStats.totalProjectsActive = projectsList.filter(p => p.is_active).length;

    return dashboard;
  }
);

// ۳. سلکتور برای فیلتر کردن کارگران بر اساس پروژه انتخاب شده (برای لیست و نقشه)
export const selectVisibleWorkers = createSelector(
  [selectAllWorkersObj, selectSelectedProjectId],
  (workersObj, selectedPid) => {
    const workers = Object.values(workersObj);
    
    if (!selectedPid) return workers; // نمایش همه

    return workers.filter(w => w.current_project_id === selectedPid);
  }
);


export const { 
  updateWorkerLocation, 
  cleanupOldWorkers, 
  setSelectedProject 
} = workersSlice.actions;

export default workersSlice.reducer;