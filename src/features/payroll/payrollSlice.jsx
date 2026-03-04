import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// ----------------------------------------------------------------------
// Async Thunks
// ----------------------------------------------------------------------

// 1. دریافت لیست تمام دوره‌های حقوقی (برای داشبورد)
export const fetchAllPeriods = createAsyncThunk(
  'payroll/fetchAllPeriods',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/payroll/periods/');
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت لیست دوره‌ها'
      );
    }
  }
);

// 2. دریافت جزئیات یک دوره خاص (با بازه زمانی)
export const fetchPeriodPayroll = createAsyncThunk(
  'payroll/fetchPeriodPayroll',
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      
      const { data } = await api.get(`/admin/payroll/period/?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت دوره حقوق'
      );
    }
  }
);

// 3. تولید/بروزرسانی ردیف‌ها از سیستم حضور و غیاب
export const generatePeriodPayroll = createAsyncThunk(
  'payroll/generatePeriodPayroll',
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      params.append('generate', '1');
      
      const { data } = await api.post(`/admin/payroll/period/?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در تولید لیست حقوق'
      );
    }
  }
);

// 4. ایجاد آیتم دستی (پاداش، پیمانکار و ...)
export const createManualPayrollItem = createAsyncThunk(
  'payroll/createManualPayrollItem',
  async ({ periodId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/admin/payroll/periods/${periodId}/items/`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ایجاد ردیف'
      );
    }
  }
);

// 5. ویرایش یک آیتم
export const updatePayrollItem = createAsyncThunk(
  'payroll/updatePayrollItem',
  async ({ itemId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admin/payroll/items/${itemId}/`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ویرایش ردیف'
      );
    }
  }
);

// 6. حذف یک آیتم
export const deletePayrollItem = createAsyncThunk(
  'payroll/deletePayrollItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/payroll/items/${itemId}/delete/`);
      return itemId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در حذف ردیف'
      );
    }
  }
);

// 7. تغییر stage ردیف‌ها (تکی یا گروهی)
export const changeItemStage = createAsyncThunk(
  'payroll/changeItemStage',
  async ({ itemIds, stage }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/admin/payroll/items/change-stage/', {
        item_ids: itemIds,
        stage: stage,
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در تغییر مرحله ردیف'
      );
    }
  }
);

// 8. تغییر وضعیت دوره (نسخه جدید با پارامترهای کامل)
export const changePeriodStatus = createAsyncThunk(
  'payroll/changePeriodStatus',
  async ({ 
    periodId, 
    status, 
    change_type = 'SEND', 
    reason = '', 
    correction_instructions = '', 
    attachment_ids = [], 
    is_final 
  }, { rejectWithValue }) => {
    try {
      const payload = { 
        status, 
        change_type,
        reason,
        correction_instructions,
        attachment_ids,
      };
      
      if (typeof is_final !== 'undefined') payload.is_final = is_final;

      const { data } = await api.post(`/admin/payroll/periods/${periodId}/status/`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در تغییر وضعیت دوره'
      );
    }
  }
);

// 9. آپلود فایل ضمیمه
export const uploadStatusAttachment = createAsyncThunk(
  'payroll/uploadStatusAttachment',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post('/admin/payroll/upload-attachment/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در آپلود فایل'
      );
    }
  }
);

// 10. دریافت تاریخچه تغییرات وضعیت
export const fetchPeriodStatusHistory = createAsyncThunk(
  'payroll/fetchPeriodStatusHistory',
  async (periodId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/admin/payroll/periods/${periodId}/status/history/`);
      return { periodId, data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت تاریخچه تغییرات'
      );
    }
  }
);

// 11. دریافت جزئیات کامل دوره
export const fetchPeriodDetail = createAsyncThunk(
  'payroll/fetchPeriodDetail',
  async (periodId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/admin/payroll/periods/${periodId}/detail/`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت جزئیات دوره'
      );
    }
  }
);

// ----------------------------------------------------------------------
// Slice Definition
// ----------------------------------------------------------------------

const initialState = {
  periodsList: [],           // لیست خلاصه برای صفحه اصلی
  currentPeriod: null,       // هدر دوره فعلی
  items: [],                // لیست ردیف‌های دوره فعلی
  periodDetail: null,       // جزئیات کامل دوره
  statusHistory: [],        // تاریخچه تغییرات وضعیت
  uploadAttachment: {       // وضعیت آپلود فایل
    loading: false,
    error: null,
    data: null,
  },
  loading: false,
  error: null,
};

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    // پاک کردن دیتای دوره جاری
    clearCurrentPeriod(state) {
      state.currentPeriod = null;
      state.items = [];
      state.periodDetail = null;
      state.error = null;
    },
    
    // آپدیت لوکال برای اینپوت‌های جدول
    updateLocalPayrollItem(state, action) {
      const { id, changes } = action.payload;
      const idx = state.items.findIndex((i) => i.id === id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...changes };
      }
    },
    
    // پاک کردن وضعیت آپلود فایل
    clearUploadAttachment(state) {
      state.uploadAttachment = {
        loading: false,
        error: null,
        data: null,
      };
    },
    
    // پاک کردن تاریخچه تغییرات
    clearStatusHistory(state) {
      state.statusHistory = [];
    },
    
    // حالت تست برای بررسی مسیرها
    testEndpoint(state, action) {
      console.log('آزمایش endpoint:', action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All Periods ---
      .addCase(fetchAllPeriods.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchAllPeriods.fulfilled, (state, action) => {
        state.loading = false;
        state.periodsList = action.payload;
      })
      .addCase(fetchAllPeriods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Single Period ---
      .addCase(fetchPeriodPayroll.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchPeriodPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPeriod = action.payload.period;
        state.items = action.payload.items || [];
      })
      .addCase(fetchPeriodPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Generate From Attendance ---
      .addCase(generatePeriodPayroll.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(generatePeriodPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPeriod = action.payload.period;
        state.items = action.payload.items || [];
      })
      .addCase(generatePeriodPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create Item ---
      .addCase(createManualPayrollItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createManualPayrollItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // --- Update Item ---
      .addCase(updatePayrollItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload };
        }
      })
      .addCase(updatePayrollItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- Delete Item ---
      .addCase(deletePayrollItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deletePayrollItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // --- Change Item Stage ---
      .addCase(changeItemStage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeItemStage.fulfilled, (state, action) => {
        state.loading = false;
        // می‌توانیم آیتم‌های تغییر کرده را آپدیت کنیم
        // اگر backend لیست آیتم‌های آپدیت شده را برنگرداند
        // اینجا فقط پیام موفقیت را نشان می‌دهیم
        console.log(`تعداد ${action.payload.updated_count} آیتم تغییر stage دادند`);
      })
      .addCase(changeItemStage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // --- Change Period Status ---
      .addCase(changePeriodStatus.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(changePeriodStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        // آپدیت دوره جاری
        if (state.currentPeriod) {
          state.currentPeriod = { ...state.currentPeriod, ...action.payload };
        }
        
        // آپدیت در لیست دوره‌ها
        const idx = state.periodsList.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) {
          state.periodsList[idx] = { ...state.periodsList[idx], ...action.payload };
        }
        
        // آپدیت جزئیات دوره اگر وجود دارد
        if (state.periodDetail && state.periodDetail.id === action.payload.id) {
          state.periodDetail = { ...state.periodDetail, ...action.payload };
        }
      })
      .addCase(changePeriodStatus.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload; 
      })
      
      // --- Upload Attachment ---
      .addCase(uploadStatusAttachment.pending, (state) => {
        state.uploadAttachment.loading = true;
        state.uploadAttachment.error = null;
      })
      .addCase(uploadStatusAttachment.fulfilled, (state, action) => {
        state.uploadAttachment.loading = false;
        state.uploadAttachment.data = action.payload;
      })
      .addCase(uploadStatusAttachment.rejected, (state, action) => {
        state.uploadAttachment.loading = false;
        state.uploadAttachment.error = action.payload;
      })
      
      // --- Fetch Status History ---
      .addCase(fetchPeriodStatusHistory.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchPeriodStatusHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.statusHistory = action.payload.data;
      })
      .addCase(fetchPeriodStatusHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // --- Fetch Period Detail ---
      .addCase(fetchPeriodDetail.pending, (state) => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(fetchPeriodDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.periodDetail = action.payload;
      })
      .addCase(fetchPeriodDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearCurrentPeriod, 
  updateLocalPayrollItem,
  clearUploadAttachment,
  clearStatusHistory,
  testEndpoint
} = payrollSlice.actions;

export default payrollSlice.reducer;