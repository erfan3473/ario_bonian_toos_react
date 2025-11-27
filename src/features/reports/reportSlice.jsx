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

// =====================
// تغییر وضعیت گزارش (تایید/رد)
// =====================
export const updateReportStatus = createAsyncThunk(
  'reports/updateStatus',
  async ({ reportId, action, reason }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/projects/reports/${reportId}/action/`, {
        action,
        reason
      });
      return { reportId, ...response.data }; // برمی‌گرداند: { reportId, success, new_status }
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در تغییر وضعیت');
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    loading: false,
    reports: [],
    error: null,
    actionLoading: false,
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
      }     
      
      )
    // updateReportStatus
      .addCase(updateReportStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        // گزارش مورد نظر را در لیست پیدا کرده و وضعیتش را آپدیت می‌کنیم
        const { reportId, new_status } = action.payload;
        const report = state.reports.find((r) => r.id === reportId);
        if (report) {
          report.status = new_status;
          report.status_display = getStatusPersian(new_status); // تابع کمکی فرضی یا دریافت از بکند
        }
      })

       .addCase(updateReportStatus.rejected, (state, action) => {
        state.actionLoading = false;
        alert(action.payload); // نمایش خطای ساده
    });
      
  },
});
const getStatusPersian = (status) => {
    const map = {
        'DRAFT': 'پیش‌نویس',
        'SUBMITTED': 'ارسال شده',
        'PM_APPROVED': 'تأیید مدیر پروژه',
        'FINAL_APPROVED': 'تأیید نهایی',
        'REJECTED': 'رد شده'
    };
    return map[status] || status;
};
export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;