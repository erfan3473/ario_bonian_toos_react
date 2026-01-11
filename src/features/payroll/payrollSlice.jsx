// src/features/payroll/payrollSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// GET: گرفتن لیست حقوق برای یک بازه
export const fetchPeriodPayroll = createAsyncThunk(
  'payroll/fetchPeriodPayroll',
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      const { data } = await api.get(`/admin/payrolls/period/?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت لیست حقوق'
      );
    }
  }
);

// POST: تولید اولیه از حضور برای بازه
export const generatePeriodPayroll = createAsyncThunk(
  'payrolls/generatePeriodPayroll',
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      params.append('generate', '1');
      const { data } = await api.post(`/admin/payrolls/period/?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در تولید لیست حقوق'
      );
    }
  }
);

// ایجاد دستی ردیف
export const createManualPayrollItem = createAsyncThunk(
  'payroll/createManualPayrollItem',
  async ({ periodId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        `/admin/payrolls/${periodId}/items/`,
        payload
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ایجاد ردیف حقوق'
      );
    }
  }
);

// ویرایش ردیف
export const updatePayrollItem = createAsyncThunk(
  'payroll/updatePayrollItem',
  async ({ itemId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/admin/payrolls/items/${itemId}/`,
        payload
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در ویرایش ردیف حقوق'
      );
    }
  }
);

// حذف ردیف
export const deletePayrollItem = createAsyncThunk(
  'payroll/deletePayrollItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/payrolls/items/${itemId}/delete/`);
      return itemId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در حذف ردیف حقوق'
      );
    }
  }
);

const initialState = {
  period: null,
  items: [],
  loading: false,
  error: null,

  // فیلتر/انتخاب بازه
  start: null, // YYYY-MM-DD
  end: null,   // YYYY-MM-DD
};

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setPayrollRange(state, action) {
      state.start = action.payload.start;
      state.end = action.payload.end;
    },
    // آپدیت لوکال یک آیتم (برای inline edit قبل از ارسال به سرور)
    updateLocalPayrollItem(state, action) {
      const { id, changes } = action.payload;
      const idx = state.items.findIndex((i) => i.id === id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...changes };
      }
    },
    resetPayrollState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch بازه
      .addCase(fetchPeriodPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPeriodPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.period = action.payload.period;
        state.items = action.payload.items || [];
      })
      .addCase(fetchPeriodPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // generate بازه
      .addCase(generatePeriodPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generatePeriodPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.period = action.payload.period;
        state.items = action.payload.items || [];
      })
      .addCase(generatePeriodPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create
      .addCase(createManualPayrollItem.pending, (state) => {
        state.error = null;
      })
      .addCase(createManualPayrollItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createManualPayrollItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // update
      .addCase(updatePayrollItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload };
        }
      })
      .addCase(updatePayrollItem.rejected, (state, action) => {
        state.error = action.payload;
      })

      // delete
      .addCase(deletePayrollItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deletePayrollItem.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setPayrollRange, updateLocalPayrollItem, resetPayrollState } =
  payrollSlice.actions;

export default payrollSlice.reducer;
