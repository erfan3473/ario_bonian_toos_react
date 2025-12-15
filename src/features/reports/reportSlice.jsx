// src/features/reports/reportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 📋 Async Thunks
// ═══════════════════════════════════════════════════════════

// ✅ دریافت گزارش‌های در انتظار تایید
export const fetchPendingApprovals = createAsyncThunk(
  'reports/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        '/reports/hierarchical-reports/pending_approvals/'
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.error || 'خطا در دریافت گزارش‌ها'
      );
    }
  }
);

// ✅ دریافت خلاصه روزانه (برای مدیر پروژه)
export const fetchDailySummary = createAsyncThunk(
  'reports/fetchDailySummary',
  async ({ projectId, date }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/reports/daily-reports/summary/${projectId}/${date}/`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.response?.data?.error || 'خطا در دریافت خلاصه روزانه'
      );
    }
  }
);

// ✅ تایید یا رد گزارش
export const approveReport = createAsyncThunk(
  'reports/approve',
  async ({ reportId, decision, notes = '' }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/reports/hierarchical-reports/${reportId}/approve_reject/`,
        { decision, notes }
      );
      return { reportId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.detail || 'خطا در تایید گزارش'
      );
    }
  }
);

// ✅ ارسال گزارش جدید
export const submitReport = createAsyncThunk(
  'reports/submit',
  async ({ projectId, textContent, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('text_content', textContent);
      
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      const { data } = await axiosInstance.post(
        '/reports/hierarchical-reports/submit_report/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.detail || 'خطا در ارسال گزارش'
      );
    }
  }
);

// ✅ ارسال فهرست بها
export const submitBOQ = createAsyncThunk(
  'reports/submitBOQ',
  async ({ projectId, workSummary, boqEntries }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        '/reports/daily-boq-reports/submit_boq/',
        {
          project_id: projectId,
          work_summary: workSummary,
          boq_entries: boqEntries
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.detail || 'خطا در ارسال فهرست بها'
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slice
// ═══════════════════════════════════════════════════════════

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    // لیست گزارش‌های pending
    pendingReports: [],
    loading: false,
    error: null,

    // خلاصه روزانه
    dailySummary: null,
    summaryLoading: false,
    summaryError: null,

    // عملیات تایید/رد
    actionLoading: false,
    actionError: null,

    // ارسال گزارش جدید
    submitLoading: false,
    submitError: null,
    lastSubmittedReport: null,

    // ارسال BOQ
    boqLoading: false,
    boqError: null,
  },

  reducers: {
    // پاک کردن گزارش‌ها
    clearReports: (state) => {
      state.pendingReports = [];
      state.dailySummary = null;
      state.error = null;
      state.summaryError = null;
    },

    // پاک کردن خطاها
    clearErrors: (state) => {
      state.error = null;
      state.summaryError = null;
      state.actionError = null;
      state.submitError = null;
      state.boqError = null;
    },

    // پاک کردن گزارش آخر ارسال شده
    clearLastSubmitted: (state) => {
      state.lastSubmittedReport = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ═══════════════════════════════════════════════════════════
      // fetchPendingApprovals
      // ═══════════════════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════════════════
      // fetchDailySummary
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchDailySummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchDailySummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.dailySummary = action.payload;
      })
      .addCase(fetchDailySummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // approveReport
      // ═══════════════════════════════════════════════════════════
      .addCase(approveReport.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveReport.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { reportId, new_status } = action.payload;

        // ✅ آپدیت در لیست pending
        const reportIndex = state.pendingReports.findIndex((r) => r.id === reportId);
        if (reportIndex !== -1) {
          state.pendingReports[reportIndex].status = new_status;
          // اگر تایید شد، از لیست حذف می‌شود
          if (new_status === 'APPROVED' || new_status === 'REJECTED') {
            state.pendingReports.splice(reportIndex, 1);
          }
        }

        // ✅ آپدیت در dailySummary
        if (state.dailySummary?.hierarchical_reports) {
          const summaryReport = state.dailySummary.hierarchical_reports.find(
            (r) => r.id === reportId
          );
          if (summaryReport) {
            summaryReport.status = new_status;
            summaryReport.approved_by = action.payload.approved_by;
            summaryReport.approved_at = action.payload.approved_at;
          }
        }
      })
      .addCase(approveReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // submitReport
      // ═══════════════════════════════════════════════════════════
      .addCase(submitReport.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
      })
      .addCase(submitReport.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.lastSubmittedReport = action.payload;
      })
      .addCase(submitReport.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // submitBOQ
      // ═══════════════════════════════════════════════════════════
      .addCase(submitBOQ.pending, (state) => {
        state.boqLoading = true;
        state.boqError = null;
      })
      .addCase(submitBOQ.fulfilled, (state, action) => {
        state.boqLoading = false;
        // می‌توانید BOQ را در state ذخیره کنید
      })
      .addCase(submitBOQ.rejected, (state, action) => {
        state.boqLoading = false;
        state.boqError = action.payload;
      });
  },
});

export const { clearReports, clearErrors, clearLastSubmitted } = reportSlice.actions;
export default reportSlice.reducer;
