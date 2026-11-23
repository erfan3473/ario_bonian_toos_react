// src/features/reports/reportSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const extractError = (error, fallback = 'خطایی رخ داد') =>
  error?.response?.data?.error ||
  error?.response?.data?.detail ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  fallback;

// ═══════════════════════════════════════════════════════════
// 📋 Async Thunks — گزارش‌ها
// ═══════════════════════════════════════════════════════════

export const fetchPendingApprovals = createAsyncThunk(
  'reports/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/reports/hierarchical-reports/pending_approvals/');
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در دریافت گزارش‌های در انتظار'));
    }
  }
);

export const fetchDailySummary = createAsyncThunk(
  'reports/fetchDailySummary',
  async ({ projectId, date }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/reports/daily-reports/summary/${projectId}/${date}/`);
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در دریافت خلاصه روزانه'));
    }
  }
);

export const fetchFlexibleSummary = createAsyncThunk(
  'reports/fetchFlexibleSummary',
  async ({ projectId, date, dateFrom, dateTo, status, hasBoq, limit = 30 } = {}, { rejectWithValue }) => {
    try {
      const params = { limit };
      if (projectId) params.project_id = projectId;
      if (date) params.date = date;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (status && status !== 'ALL') params.status = status;
      if (hasBoq) params.has_boq = 'true';

      const { data } = await axiosInstance.get('/reports/daily-reports/summary/', { params });
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در دریافت لیست گزارش‌ها'));
    }
  }
);

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
      return rejectWithValue(extractError(error, 'خطا در ثبت تصمیم روی گزارش'));
    }
  }
);

export const updateHierarchicalReport = createAsyncThunk(
  'reports/updateHierarchicalReport',
  async ({ reportId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/reports/hierarchical-reports/${reportId}/`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در ویرایش گزارش'));
    }
  }
);

export const deleteHierarchicalReport = createAsyncThunk(
  'reports/deleteHierarchicalReport',
  async (reportId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/reports/hierarchical-reports/${reportId}/`);
      return reportId;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در حذف گزارش'));
    }
  }
);

export const dailyReportWorkflowAction = createAsyncThunk(
  'reports/dailyReportWorkflowAction',
  async ({ dailyReportId, actionName }, { rejectWithValue }) => {
    try {
      // actionName: 'submit' | 'pm_approve' | 'ceo_approve'
      const { data } = await axiosInstance.post(`/reports/daily-reports/${dailyReportId}/${actionName}/`);
      return { dailyReportId, actionName, ...data };
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در تغییر وضعیت گزارش روزانه'));
    }
  }
);

export const submitUnifiedReport = createAsyncThunk(
  'reports/submitUnified',
  async ({ projectId, workSummary = '', files = [], boqEntries = [] }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('work_summary', workSummary);

      files.forEach((file) => {
        formData.append('files', file);
      });

      boqEntries.forEach((entry, idx) => {
        formData.append(`boq_entries[${idx}][boq_item_id]`, entry.boq_item_id);
        formData.append(`boq_entries[${idx}][quantity]`, entry.quantity);
        if (entry.notes) {
          formData.append(`boq_entries[${idx}][notes]`, entry.notes);
        }
      });

      const { data } = await axiosInstance.post(
        '/reports/hierarchical-reports/submit_unified_report/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در ثبت گزارش یکپارچه'));
    }
  }
);

export const submitReport = createAsyncThunk(
  'reports/submit',
  async ({ projectId, textContent, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('text_content', textContent);
      if (files?.length) {
        files.forEach((file) => formData.append('files', file));
      }
      const { data } = await axiosInstance.post(
        '/reports/hierarchical-reports/submit_report/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در ارسال گزارش'));
    }
  }
);

export const submitBOQ = createAsyncThunk(
  'reports/submitBOQ',
  async ({ projectId, workSummary, boqEntries }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/reports/daily-boq-reports/submit_boq/', {
        project_id: projectId,
        work_summary: workSummary,
        boq_entries: boqEntries,
      });
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در ارسال فهرست بها'));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 💰 Async Thunks — ردیف‌های BOQ و بانک فهرست بها
// ═══════════════════════════════════════════════════════════

export const approveBoqEntry = createAsyncThunk(
  'reports/approveBoqEntry',
  async (entryId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/reports/daily-boq-entries/${entryId}/approve/`);
      return { entryId, ...data };
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در تایید ردیف فهرست بها'));
    }
  }
);

export const createBoqEntry = createAsyncThunk(
  'reports/createBoqEntry',
  async ({ hierarchicalReportId, boqReportId, boq_item, quantity, notes = '' }, { rejectWithValue }) => {
    try {
      let targetBoqReportId = boqReportId;
      if (!targetBoqReportId) {
        const { data: createdReport } = await axiosInstance.post('/reports/daily-boq-reports/', {
          hierarchical_report: hierarchicalReportId,
          notes: '',
        });
        targetBoqReportId = createdReport.id;
      }
      const { data } = await axiosInstance.post('/reports/daily-boq-entries/', {
        boq_report: targetBoqReportId,
        boq_item,
        quantity,
        notes,
      });
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در افزودن ردیف فهرست بها'));
    }
  }
);

export const updateBoqEntry = createAsyncThunk(
  'reports/updateBoqEntry',
  async ({ entryId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/reports/daily-boq-entries/${entryId}/`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در ویرایش ردیف فهرست بها'));
    }
  }
);

export const deleteBoqEntry = createAsyncThunk(
  'reports/deleteBoqEntry',
  async (entryId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/reports/daily-boq-entries/${entryId}/`);
      return entryId;
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در حذف ردیف فهرست بها'));
    }
  }
);

export const fetchBoqCatalog = createAsyncThunk(
  'reports/fetchBoqCatalog',
  async (_, { rejectWithValue }) => {
    try {
      const [priceListsRes, categoriesRes, itemsRes] = await Promise.all([
        axiosInstance.get('/reports/price-lists/'),
        axiosInstance.get('/reports/boq-categories/'),
        axiosInstance.get('/reports/boq-items/'),
      ]);
      const unwrap = (res) => (Array.isArray(res.data) ? res.data : res.data?.results || []);
      return {
        priceLists: unwrap(priceListsRes),
        categories: unwrap(categoriesRes),
        items: unwrap(itemsRes),
      };
    } catch (error) {
      return rejectWithValue(extractError(error, 'خطا در بارگذاری بانک فهرست بها'));
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slice
// ═══════════════════════════════════════════════════════════

const summaryPending = (state) => {
  state.summaryLoading = true;
  state.summaryError = null;
};

const summaryFulfilled = (state, action) => {
  state.summaryLoading = false;
  state.dailySummary = action.payload;
};

const summaryListFulfilled = (state, action) => {
  state.summaryLoading = false;
  state.dailySummaryList = action.payload.results || [];
  state.dailySummaryCount = action.payload.count || 0;
};

const summaryRejected = (state, action) => {
  state.summaryLoading = false;
  state.summaryError = action.payload;
};

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    pendingReports: [],
    loading: false,
    error: null,

    dailySummary: null,
    dailySummaryList: [],
    dailySummaryCount: 0,
    summaryLoading: false,
    summaryError: null,

    actionLoading: false,
    actionError: null,

    submitLoading: false,
    submitError: null,
    lastSubmittedReport: null,

    boqLoading: false,
    boqError: null,

    // کاتالوگ فهرست بها
    priceLists: [],
    boqCategories: [],
    boqItems: [],
    catalogLoading: false,
  },
  reducers: {
    clearReports: (state) => {
      state.pendingReports = [];
      state.dailySummary = null;
      state.dailySummaryList = [];
      state.dailySummaryCount = 0;
      state.summaryError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.summaryError = null;
      state.actionError = null;
      state.submitError = null;
      state.boqError = null;
    },
    clearLastSubmitted: (state) => {
      state.lastSubmittedReport = null;
    },
  },
  extraReducers: (builder) => {
    builder
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

      .addCase(fetchDailySummary.pending, summaryPending)
      .addCase(fetchDailySummary.fulfilled, summaryFulfilled)
      .addCase(fetchDailySummary.rejected, summaryRejected)

      .addCase(fetchFlexibleSummary.pending, summaryPending)
      .addCase(fetchFlexibleSummary.fulfilled, summaryListFulfilled)
      .addCase(fetchFlexibleSummary.rejected, summaryRejected)

      .addCase(approveReport.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(approveReport.fulfilled, (state, action) => {
        state.actionLoading = false;
        const { reportId, new_status } = action.payload;
        if (state.dailySummary?.hierarchical_reports) {
          const target = state.dailySummary.hierarchical_reports.find((r) => r.id === reportId);
          if (target) target.status = new_status;
        }
      })
      .addCase(approveReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      .addCase(submitUnifiedReport.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
      })
      .addCase(submitUnifiedReport.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.lastSubmittedReport = action.payload;
      })
      .addCase(submitUnifiedReport.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload;
      })

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

      .addCase(submitBOQ.pending, (state) => {
        state.boqLoading = true;
        state.boqError = null;
      })
      .addCase(submitBOQ.fulfilled, (state) => {
        state.boqLoading = false;
      })
      .addCase(submitBOQ.rejected, (state, action) => {
        state.boqLoading = false;
        state.boqError = action.payload;
      })

      .addCase(fetchBoqCatalog.pending, (state) => {
        state.catalogLoading = true;
      })
      .addCase(fetchBoqCatalog.fulfilled, (state, action) => {
        state.catalogLoading = false;
        state.priceLists = action.payload.priceLists;
        state.boqCategories = action.payload.categories;
        state.boqItems = action.payload.items;
      })
      .addCase(fetchBoqCatalog.rejected, (state) => {
        state.catalogLoading = false;
      });
  },
});

export const { clearReports, clearErrors, clearLastSubmitted } = reportSlice.actions;
export default reportSlice.reducer;