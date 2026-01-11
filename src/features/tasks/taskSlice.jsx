// src/features/tasks/taskSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// گرفتن ماموریت‌های کاربر (کارتابل)
export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/tasks/my-tasks/');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت لیست ماموریت‌ها'
      );
    }
  }
);

// ساخت ماموریت فرم حقوق (برای ادمین/مدیر)
export const createPayrollTask = createAsyncThunk(
  'tasks/createPayrollTask',
  async ({ periodId, assigneeId, note }, { rejectWithValue }) => {
    try {
      const payload = { period_id: periodId, assignee_id: assigneeId, note };
      const { data } = await api.post('/tasks/payroll-tasks/', payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ایجاد ماموریت فرم حقوق'
      );
    }
  }
);

const initialState = {
  list: [],
  loading: false,
  error: null,
  createStatus: {
    loading: false,
    error: null,
    success: false,
  },
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    resetCreateStatus(state) {
      state.createStatus = { loading: false, error: null, success: false };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMyTasks
      .addCase(fetchMyTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createPayrollTask
      .addCase(createPayrollTask.pending, (state) => {
        state.createStatus = { loading: true, error: null, success: false };
      })
      .addCase(createPayrollTask.fulfilled, (state, action) => {
        state.createStatus = { loading: false, error: null, success: true };
        // اگر بخواهی، اگر کاربر فعلی همان assignee بود می‌توانی به list هم اضافه کنی
        // state.list.unshift(action.payload);
      })
      .addCase(createPayrollTask.rejected, (state, action) => {
        state.createStatus = {
          loading: false,
          error: action.payload,
          success: false,
        };
      });
  },
});

export const { resetCreateStatus } = taskSlice.actions;

export default taskSlice.reducer;
