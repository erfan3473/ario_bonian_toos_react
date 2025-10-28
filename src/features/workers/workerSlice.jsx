import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; // 👈 استفاده از axiosInstance

const MAX_IDLE_MS = 5 * 60 * 1000; // ۵ دقیقه

// Async Thunk برای گرفتن لیست اولیه کارگران
export const fetchWorkers = createAsyncThunk(
  'workers/fetchWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/workers/'); // 👈 نیازی به آدرس کامل نیست
      return data;
    } catch (error) {
      const message =
        error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);

// Async Thunk برای گرفتن تاریخچه موقعیت یک کارگر

export const fetchWorkerHistory = createAsyncThunk(
  'workers/fetchHistory',
  async ({ workerId, timeRange }, { rejectWithValue }) => {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - {
        '1h': 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
      }[timeRange || '24h']);

      const params = { start: start.toISOString(), end: end.toISOString() };
      const { data } = await axiosInstance.get(`/workers/${workerId}/history/`, { params });
      return { workerId, history: data };
    } catch (error) {
      const message =
        error.response?.data?.detail || error.message;
      return rejectWithValue(message);
    }
  }
);


const initialState = {
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  allWorkers: {}, // آبجکتی از کارگران با کلید ID
  history: {
    status: 'idle',
    error: null,
    data: {}, // تاریخچه هر کارگر با کلید ID
  },
};

const workerSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    // Reducer برای آپدیت موقعیت از WebSocket
    updateWorkerLocation: (state, action) => {
      const u = action.payload;
      const workerId = u.id || u.worker_id;

      const lastUpdate = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();
      
      if (!state.allWorkers[workerId]) {
        // اگر کارگر از قبل در لیست نباشد، یک آبجکت پایه برایش بساز
        state.allWorkers[workerId] = { id: workerId };
      }

      const worker = state.allWorkers[workerId];
      worker.latitude = u.latitude;
      worker.longitude = u.longitude;
      worker.accuracy = u.accuracy;
      worker.speed = u.speed;
      worker.lastUpdate = lastUpdate;
      worker.stale = false; // وقتی آپدیت می‌شود، دیگر stale نیست
    },
    // Reducer برای بررسی و آفلاین کردن کارگران قدیمی
    cleanupOldWorkers: (state) => {
      const cutoff = Date.now() - MAX_IDLE_MS;
      Object.values(state.allWorkers).forEach(worker => {
        if ((worker.lastUpdate || 0) < cutoff) {
          worker.stale = true;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Reducer برای fetchWorkers
      .addCase(fetchWorkers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWorkers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const workersMap = {};
        action.payload.forEach((w) => {
          const lastUpdate = w.last_location ? new Date(w.last_location.timestamp).getTime() : null;
          const isStale = !(lastUpdate && Date.now() - lastUpdate < MAX_IDLE_MS);

          workersMap[w.id] = {
            ...w, // تمام اطلاعات دریافتی از API
            latitude: w.last_location?.latitude ?? null,
            longitude: w.last_location?.longitude ?? null,
            lastUpdate,
            stale: isStale,
          };
        });
        state.allWorkers = workersMap;
      })
      .addCase(fetchWorkers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Reducer برای fetchWorkerHistory
      .addCase(fetchWorkerHistory.pending, (state) => {
        state.history.status = 'loading';
      })
      .addCase(fetchWorkerHistory.fulfilled, (state, action) => {
        state.history.status = 'succeeded';
        const { workerId, history } = action.payload;
        state.history.data[workerId] = history;
      })
      .addCase(fetchWorkerHistory.rejected, (state, action) => {
        state.history.status = 'failed';
        state.history.error = action.payload;
      });
  },
});

export const { updateWorkerLocation, cleanupOldWorkers } = workerSlice.actions;

export default workerSlice.reducer;