// src/features/dailyReports/dailyReportSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk برای گرفتن لیست گزارش‌های یک پروژه
export const fetchDailyReports = createAsyncThunk(
  'dailyReports/fetchDailyReports',
  async (projectId, { getState }) => {
    try {
      const { data } = await axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/reports/`);
      return data;
    } catch (error) {
      throw error.response && error.response.data.detail
        ? error.response.data.detail
        : error.message;
    }
  }
);

// Thunk جدید برای گرفتن جزئیات یک گزارش خاص
export const fetchReportDetails = createAsyncThunk(
  'dailyReports/fetchReportDetails',
  async (reportId, { getState }) => {
    try {
      const { data } = await axios.get(`http://127.0.0.1:8000/api/projects/reports/${reportId}/`);
      return data;
    } catch (error) {
      throw error.response && error.response.data.detail
        ? error.response.data.detail
        : error.message;
    }
  }
);

const dailyReportSlice = createSlice({
  name: 'dailyReports',
  initialState: {
    reports: [],         // برای لیست گزارش‌ها
    selectedReport: null, // برای نگهداری جزئیات گزارش انتخاب شده
    loading: false,
    error: null,
  },
  reducers: {
      // برای پاک کردن جزئیات گزارش قبلی وقتی از صفحه خارج می‌شیم
      resetReportDetails: (state) => {
          state.selectedReport = null;
      }
  },
  extraReducers: (builder) => {
    builder
      // Reducers برای لیست گزارش‌ها
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
        state.error = action.error.message;
      })
      // Reducers جدید برای جزئیات گزارش
      .addCase(fetchReportDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReport = action.payload;
      })
      .addCase(fetchReportDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { resetReportDetails } = dailyReportSlice.actions;
export default dailyReportSlice.reducer;