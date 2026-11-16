import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchFinancialRequests = createAsyncThunk(
  'adminRequests/fetchFinancial',
  async ({ status = null, inProgress = false, requestType = null, search = '' } = {}, { rejectWithValue }) => {
    try {
      let url = '/admin/requests/financial/';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (inProgress) params.append('in_progress', 'true');
      if (requestType) params.append('request_type', requestType);
      if (search) params.append('search', search);

      if (params.toString()) url += `?${params.toString()}`;

      const { data } = await axiosInstance.get(url);
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
  async ({ status = null, inProgress = false, projectId = null, search = '' } = {}, { rejectWithValue }) => {
    try {
      let url = '/admin/requests/equipment/';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (inProgress) params.append('in_progress', 'true');
      if (projectId) params.append('project', projectId);
      if (search) params.append('search', search);

      if (params.toString()) url += `?${params.toString()}`;

      const { data } = await axiosInstance.get(url);
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
  async ({ status = null, inProgress = false, leaveType = null, search = '' } = {}, { rejectWithValue }) => {
    try {
      let url = '/admin/requests/leave/';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (inProgress) params.append('in_progress', 'true');
      if (leaveType) params.append('leave_type', leaveType);
      if (search) params.append('search', search);

      if (params.toString()) url += `?${params.toString()}`;

      const { data } = await axiosInstance.get(url);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت درخواست‌های مرخصی'
      );
    }
  }
);

export const fetchLeaveTypes = createAsyncThunk(
  'adminRequests/fetchLeaveTypes',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/requests/leave-types/');
      return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت انواع مرخصی'
      );
    }
  }
);

export const updateFinancialStatus = createAsyncThunk(
  'adminRequests/updateFinancialStatus',
  async ({ id, status, admin_note }, { rejectWithValue }) => {
    try {
      const payload = { status };
      if (admin_note !== undefined) payload.admin_note = admin_note;
      const { data } = await axiosInstance.patch(`/admin/requests/financial/${id}/`, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت درخواست مالی'
      );
    }
  }
);

export const updateEquipmentStatus = createAsyncThunk(
  'adminRequests/updateEquipmentStatus',
  async ({ id, status, rejection_reason }, { rejectWithValue }) => {
    try {
      const payload = { status };
      if (rejection_reason !== undefined) payload.rejection_reason = rejection_reason;
      const { data } = await axiosInstance.patch(`/admin/requests/equipment/${id}/`, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت درخواست تجهیزات'
      );
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'adminRequests/updateLeaveStatus',
  async ({ id, status, rejection_reason }, { rejectWithValue }) => {
    try {
      const payload = { status };
      if (rejection_reason !== undefined) payload.rejection_reason = rejection_reason;
      const { data } = await axiosInstance.patch(`/admin/requests/leave/${id}/`, payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در بروزرسانی وضعیت درخواست مرخصی'
      );
    }
  }
);

export const refreshRequestSmsStatus = createAsyncThunk(
  'adminRequests/refreshSmsStatus',
  async ({ request_type, request_id }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/admin/requests/sms-status/refresh/', {
        request_type,
        request_id,
      });
      return {
        request_type,
        request_id,
        sms_logs: data.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در استعلام وضعیت پیامک‌ها'
      );
    }
  }
);

export const fetchRequestsStats = createAsyncThunk(
  'adminRequests/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/admin/requests/stats/');
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'خطا در دریافت آمار'
      );
    }
  }
);

const adminRequestSlice = createSlice({
  name: 'adminRequests',
  initialState: {
    financial: { loading: false, data: [], error: null },
    equipment: { loading: false, data: [], error: null },
    leave: { loading: false, data: [], error: null },
    leaveTypes: [],
    stats: { loading: false, data: null, error: null },
    updating: false,
    refreshingSms: false,
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

      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.leaveTypes = action.payload;
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
        const index = state.financial.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.financial.data[index] = action.payload;
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
        const index = state.equipment.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.equipment.data[index] = action.payload;
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
        const index = state.leave.data.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.leave.data[index] = action.payload;
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      })

      .addCase(refreshRequestSmsStatus.pending, (state) => {
        state.refreshingSms = true;
      })
      .addCase(refreshRequestSmsStatus.fulfilled, (state, action) => {
        state.refreshingSms = false;
        const { request_type, request_id, sms_logs } = action.payload;
        const keyMap = { FINANCIAL: 'financial', EQUIPMENT: 'equipment', LEAVE: 'leave' };
        const bucket = keyMap[request_type];
        if (bucket && state[bucket]?.data) {
          const idx = state[bucket].data.findIndex((item) => item.id === request_id);
          if (idx !== -1) {
            state[bucket].data[idx].sms_logs = sms_logs;
          }
        }
      })
      .addCase(refreshRequestSmsStatus.rejected, (state) => {
        state.refreshingSms = false;
      });
  },
});

export const { resetUpdateStatus, clearErrors } = adminRequestSlice.actions;
export default adminRequestSlice.reducer;