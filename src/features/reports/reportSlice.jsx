// src/features/reports/reportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// =====================
// دریافت گزارش‌های در انتظار تایید (برای سرکارگر/سرپرست/مدیر)
// =====================
export const fetchPendingApprovals = createAsyncThunk(
  'reports/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/reports/pending/');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت گزارش‌ها'
      );
    }
  }
);

// =====================
// دریافت خلاصه روزانه (برای مدیر پروژه)
// =====================
export const fetchDailySummary = createAsyncThunk(
  'reports/fetchDailySummary',
  async ({ projectId, date }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/reports/daily/${projectId}/${date}/`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت خلاصه روزانه'
      );
    }
  }
);

// =====================
// تایید یا رد گزارش
// =====================
export const approveReport = createAsyncThunk(
  'reports/approve',
  async ({ reportId, decision, notes = '' }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/reports/${reportId}/approve/`,
        { decision, notes }
      );
      return { reportId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در تایید گزارش'
      );
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    loading: false,
    pendingReports: [],
    dailySummary: null,
    error: null,
    actionLoading: false,
  },
  reducers: {
    clearReports: (state) => {
      state.pendingReports = [];
      state.dailySummary = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPendingApprovals
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingReports = action.payload;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchDailySummary
      .addCase(fetchDailySummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailySummary.fulfilled, (state, action) => {
        state.loading = false;
        state.dailySummary = action.payload;
      })
      .addCase(fetchDailySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // approveReport
      .addCase(approveReport.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(approveReport.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { reportId, new_status } = action.payload;

        // آپدیت در لیست pending
        const report = state.pendingReports.find((r) => r.id === reportId);
        if (report) {
          report.status = new_status;
        }

        // آپدیت در dailySummary
        if (state.dailySummary?.hierarchical_reports) {
          const summaryReport = state.dailySummary.hierarchical_reports.find(
            (r) => r.id === reportId
          );
          if (summaryReport) {
            summaryReport.status = new_status;
          }
        }
      })
      .addCase(approveReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;
