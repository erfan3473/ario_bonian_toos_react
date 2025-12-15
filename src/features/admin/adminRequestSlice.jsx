// src/features/admin/adminRequestSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; // ✅

// ═══════════════════════════════════════════════════════════
// 📊 Async Thunks
// ═══════════════════════════════════════════════════════════

export const fetchFinancialRequests = createAsyncThunk(
  'adminRequests/fetchFinancial',
  async ({ status = null, search = '' } = {}, { rejectWithValue }) => {
    try {
      let url = '/admin/requests/financial/';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await axiosInstance.get(url); // ✅ تغییر داد
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت درخواست‌های مالی'
      );
    }
  }
);

export const fetchEquipmentRequests = createAsyncThunk(
  'adminRequests/fetchEquipment',
  async ({ status = null, projectId = null } = {}, { rejectWithValue }) => {
    try {
      let url = '/admin/requests/equipment/';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (projectId) params.append('project', projectId);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await axiosInstance.get(url); // ✅
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت درخواست‌های تجهیزات'
      );
    }
  }
);

export const fetchLeaveRequests = createAsyncThunk(
  'adminRequests/fetchLeave',
  async ({ status = null, leaveType = null } = {}, { rejectWithValue }) => {
    try {
      let url = '/admin/requests/leave/';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (leaveType) params.append('leave_type', leaveType);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await axiosInstance.get(url); // ✅
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت درخواست‌های مرخصی'
      );
    }
  }
);

export const updateFinancialStatus = createAsyncThunk(
  'adminRequests/updateFinancialStatus',
  async ({ id, status, admin_note = '' }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/requests/financial/${id}/`, { // ✅
        status,
        admin_note,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت'
      );
    }
  }
);

export const updateEquipmentStatus = createAsyncThunk(
  'adminRequests/updateEquipmentStatus',
  async ({ id, status, admin_note = '' }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/requests/equipment/${id}/`, { // ✅
        status,
        admin_note,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت'
      );
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'adminRequests/updateLeaveStatus',
  async ({ id, status, admin_note = '' }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/requests/leave/${id}/`, { // ✅
        status,
        admin_note,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت'
      );
    }
  }
);

export const fetchRequestsStats = createAsyncThunk(
  'adminRequests/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/requests/stats/'); // ✅
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت آمار'
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slice (بدون تغییر)
// ═══════════════════════════════════════════════════════════

const adminRequestSlice = createSlice({
  name: 'adminRequests',
  initialState: {
    financial: { loading: false, data: [], error: null },
    equipment: { loading: false, data: [], error: null },
    leave: { loading: false, data: [], error: null },
    stats: { loading: false, data: null, error: null },
    updating: false,
    updateError: null,
    updateSuccess: false,
  },
  
  reducers: {
    resetUpdateStatus: (state) => {
      state.updating = false;
      state.updateError = null;
      state.updateSuccess = false;
    },
    clearErrors: (state) => {
      state.financial.error = null;
      state.equipment.error = null;
      state.leave.error = null;
      state.updateError = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinancialRequests.pending, (state) => {
        state.financial.loading = true;
        state.financial.error = null;
      })
      .addCase(fetchFinancialRequests.fulfilled, (state, action) => {
        state.financial.loading = false;
        state.financial.data = action.payload;
      })
      .addCase(fetchFinancialRequests.rejected, (state, action) => {
        state.financial.loading = false;
        state.financial.error = action.payload;
      })
      
      .addCase(fetchEquipmentRequests.pending, (state) => {
        state.equipment.loading = true;
        state.equipment.error = null;
      })
      .addCase(fetchEquipmentRequests.fulfilled, (state, action) => {
        state.equipment.loading = false;
        state.equipment.data = action.payload;
      })
      .addCase(fetchEquipmentRequests.rejected, (state, action) => {
        state.equipment.loading = false;
        state.equipment.error = action.payload;
      })
      
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.leave.loading = true;
        state.leave.error = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.leave.loading = false;
        state.leave.data = action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.leave.loading = false;
        state.leave.error = action.payload;
      })
      
      .addCase(fetchRequestsStats.pending, (state) => {
        state.stats.loading = true;
        state.stats.error = null;
      })
      .addCase(fetchRequestsStats.fulfilled, (state, action) => {
        state.stats.loading = false;
        state.stats.data = action.payload;
      })
      .addCase(fetchRequestsStats.rejected, (state, action) => {
        state.stats.loading = false;
        state.stats.error = action.payload;
      })
      
      .addCase(updateFinancialStatus.pending, (state) => {
        state.updating = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateFinancialStatus.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        const index = state.financial.data.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.financial.data[index] = action.payload;
        }
      })
      .addCase(updateFinancialStatus.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      })
      
      .addCase(updateEquipmentStatus.pending, (state) => {
        state.updating = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateEquipmentStatus.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        const index = state.equipment.data.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.equipment.data[index] = action.payload;
        }
      })
      .addCase(updateEquipmentStatus.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      })
      
      .addCase(updateLeaveStatus.pending, (state) => {
        state.updating = true;
        state.updateError = null;
        state.updateSuccess = false;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        const index = state.leave.data.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.leave.data[index] = action.payload;
        }
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      });
  },
});

export const { resetUpdateStatus, clearErrors } = adminRequestSlice.actions;
export default adminRequestSlice.reducer;
