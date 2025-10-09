// src/features/dailyReports/dailyReportSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../actions/axios';

// ================== Thunks ==================

// 🟢 گرفتن لیست گزارش‌های یک پروژه
export const fetchDailyReports = createAsyncThunk(
  'dailyReports/fetchDailyReports',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`projects/${projectId}/reports/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 🟢 گرفتن جزئیات یک گزارش
export const fetchReportDetails = createAsyncThunk(
  'dailyReports/fetchReportDetails',
  async (reportId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`projects/reports/${reportId}/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 🟢 ایجاد گزارش جدید (با آپلود فایل)
export const createReport = createAsyncThunk(
  'dailyReports/createReport',
  async ({ projectId, reportData }, { rejectWithValue }) => {
    if (!projectId) return rejectWithValue("شناسه پروژه نامشخص است!");
    try {
      const formData = new FormData();
      Object.keys(reportData).forEach((key) => {
        if (key === 'files') {
          reportData[key].forEach((file) => formData.append('files', file));
        } else {
          formData.append(key, reportData[key]);
        }
      });

      const { data } = await api.post(
        `projects/${projectId}/reports/create/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 🟢 گرفتن گزارش امروز یک پروژه
export const fetchTodayReport = createAsyncThunk(
  'dailyReports/fetchTodayReport',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`projects/${projectId}/today-report/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// ================== Slice ==================

const dailyReportSlice = createSlice({
  name: 'dailyReports',
  initialState: {
    reports: [],
    selectedReport: null,
    todayReport: null,

    loadingReports: false,
    loadingDetails: false,
    loadingCreate: false,
    loadingToday: false,

    error: null,
    success: false,
  },
  reducers: {
    resetReportDetails: (state) => {
      state.selectedReport = null;
      state.error = null;
    },
    resetCreateState: (state) => {
      state.success = false;
      state.error = null;
    },
    resetTodayReport: (state) => {
      state.todayReport = null;
      state.loadingToday = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 📌 لیست گزارش‌ها
      .addCase(fetchDailyReports.pending, (state) => {
        state.loadingReports = true;
        state.error = null;
      })
      .addCase(fetchDailyReports.fulfilled, (state, action) => {
        state.loadingReports = false;
        state.reports = action.payload;
      })
      .addCase(fetchDailyReports.rejected, (state, action) => {
        state.loadingReports = false;
        state.error = action.payload;
      })

      // 📌 جزئیات یک گزارش
      .addCase(fetchReportDetails.pending, (state) => {
        state.loadingDetails = true;
        state.error = null;
      })
      .addCase(fetchReportDetails.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.selectedReport = action.payload;
      })
      .addCase(fetchReportDetails.rejected, (state, action) => {
        state.loadingDetails = false;
        state.error = action.payload;
      })

      // 📌 ایجاد گزارش جدید
      .addCase(createReport.pending, (state) => {
        state.loadingCreate = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.loadingCreate = false;
        state.success = true;
        state.reports.push(action.payload);
      })
      .addCase(createReport.rejected, (state, action) => {
        state.loadingCreate = false;
        state.error = action.payload;
      })

      // 📌 گزارش امروز
      .addCase(fetchTodayReport.pending, (state) => {
        state.loadingToday = true;
        state.error = null;
      })
      .addCase(fetchTodayReport.fulfilled, (state, action) => {
        state.loadingToday = false;
        state.todayReport = action.payload;
      })
      .addCase(fetchTodayReport.rejected, (state, action) => {
        state.loadingToday = false;
        state.todayReport = null;
        state.error = action.payload;
      });
  },
});

export const { resetReportDetails, resetCreateState, resetTodayReport } =
  dailyReportSlice.actions;

export default dailyReportSlice.reducer;
