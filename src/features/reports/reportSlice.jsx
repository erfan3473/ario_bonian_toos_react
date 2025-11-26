//src/features/reports/reportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// =====================
// دریافت لیست گزارشات با فیلتر
// =====================
export const fetchDailyReports = createAsyncThunk(
  'reports/fetchList',
  async ({ projectId, date } = {}, { rejectWithValue }) => {
    try {
      // پارامترهای فیلتر (Query Params)
      const params = {};
      if (projectId) params.project_id = projectId;
      if (date) params.date = date;

      // درخواست به اندپوینت جدیدی که ساختیم
      const { data } = await axiosInstance.get('/projects/reports/', { params });
      return data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.message ||
        'خطا در دریافت گزارشات';
      return rejectWithValue(message);
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    loading: false,
    reports: [],
    error: null,
  },
  reducers: {
    clearReports: (state) => {
      state.reports = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchDailyReports
      .addCase(fetchDailyReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchDailyReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;