import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance'; // اطمینان از مسیر صحیح api

// ----------------------------------------------------------------------
// Async Thunks
// ----------------------------------------------------------------------

// 1. دریافت لیست تمام دوره‌های حقوقی (برای داشبورد)
export const fetchAllPeriods = createAsyncThunk(
  'payroll/fetchAllPeriods',
  async (_, { rejectWithValue }) => {
    try {
      // url باید با urls.py جنگو هماهنگ باشد
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
// اگر دوره وجود نداشته باشد، بک‌ند آن را می‌سازد (Get or Create)
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
      params.append('generate', '1'); // فلگ تولید
      
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
      const { data } = await api.post(`/admin/payroll/${periodId}/items/`, payload);
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
      return itemId; // برگرداندن آیدی برای حذف از استیت
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

export const changePeriodStatus = createAsyncThunk(
  'payroll/changePeriodStatus',
  async ({ periodId, status, is_final }, { rejectWithValue }) => {
    try {
      const payload = { status };
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


// ----------------------------------------------------------------------
// Slice Definition
// ----------------------------------------------------------------------

const initialState = {
  periodsList: [],   // لیست خلاصه برای صفحه اصلی
  currentPeriod: null, // هدر دوره فعلی (شامل start, end, status)
  items: [],         // لیست ردیف‌های دوره فعلی
  loading: false,
  error: null,
};

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    // پاک کردن دیتای دوره جاری (هنگام بازگشت به داشبورد)
    clearCurrentPeriod(state) {
      state.currentPeriod = null;
      state.items = [];
      state.error = null;
    },
    // آپدیت لوکال برای اینپوت‌های جدول (Optimistic UI)
    updateLocalPayrollItem(state, action) {
      const { id, changes } = action.payload;
      const idx = state.items.findIndex((i) => i.id === id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...changes };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All Periods ---
      .addCase(fetchAllPeriods.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllPeriods.fulfilled, (state, action) => {
        state.loading = false;
        state.periodsList = action.payload;
      })
      .addCase(fetchAllPeriods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch Single Period ---
      .addCase(fetchPeriodPayroll.pending, (state) => { state.loading = true; state.error = null; })
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
      .addCase(generatePeriodPayroll.pending, (state) => { state.loading = true; state.error = null; })
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
      
      // --- Update Item ---
      .addCase(updatePayrollItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload };
        }
      })

      // --- Delete Item ---
      .addCase(deletePayrollItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
            // --- Change Item Stage ---
      .addCase(changeItemStage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeItemStage.fulfilled, (state, action) => {
        state.loading = false;
        
        // بروزرسانی local state برای آیتم‌های تغییر یافته
        action.payload.updated_count; // برای UI feedback
        
        // اگر errors داریم، نمایش ندهیم ولی errors در payload موجود است
        const updated_items = action.payload.updated_count;
        
        // TODO: اگر بخواهید دقیق‌تر بروزرسانی کنید، می‌توانید از backend item data استفاده کنید
        // فعلاً فقط loading را خاموش می‌کنیم
      })
      .addCase(changePeriodStatus.fulfilled, (state, action) => {
        state.loading = false;

        if (state.currentPeriod) {
          state.currentPeriod = { ...state.currentPeriod, ...action.payload };
        }

        const idx = state.periodsList.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) {
          state.periodsList[idx] = { ...state.periodsList[idx], ...action.payload };
        }
      })
      .addCase(changePeriodStatus.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(changePeriodStatus.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(changeItemStage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export const { clearCurrentPeriod, updateLocalPayrollItem } = payrollSlice.actions;
export default payrollSlice.reducer;