import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (role = '', { rejectWithValue }) => {
  try { return (await api.get(`/admin/users/${role ? `?role=${role}` : ''}`)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const fetchUserDetail = createAsyncThunk('admin/fetchUserDetail', async (userId, { rejectWithValue }) => {
  try { return (await api.get(`/admin/users/${userId}/`)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const fetchUserWorkerId = createAsyncThunk(
  'admin/fetchUserWorkerId',
  async (userId, { rejectWithValue }) => {
    try {
      return (await api.get(`/admin/users/${userId}/worker/`)).data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.detail || 'خطا در دریافت worker_id');
    }
  }
);

// ✅ جدید - دریافت مستقیم worker از user_id
export const fetchUserWorkerDirect = createAsyncThunk(
  'admin/fetchUserWorkerDirect',
  async (userId, { rejectWithValue }) => {
    try {
      return (await api.get(`/admin/users/${userId}/worker-direct/`)).data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.response?.data?.detail || 'خطا در دریافت worker');
    }
  }
);

export const fetchUserLocationHistory = createAsyncThunk(
  'admin/fetchUserLocationHistory',
  async ({ userId, startDate, endDate }, { rejectWithValue }) => {
    try {
      // مرحله 1: دریافت worker_id
      const workerResponse = await api.get(`/admin/users/${userId}/worker/`);
      const workerId = workerResponse.data.worker_id;


      if (!workerId) {
        return rejectWithValue('worker_id یافت نشد');
      }

      // مرحله 2: دریافت تاریخچه
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const historyResponse = await api.get(`/workers/${workerId}/history/`, { params });
      
      // ترکیب داده‌ها
      return {
        ...workerResponse.data,
        locations: historyResponse.data
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'خطا در دریافت تاریخچه موقعیت'
      );
    }
  }
);


export const updateUser = createAsyncThunk('admin/updateUser', async ({ userId, data }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/users/${userId}/update/`, data)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const deleteUser = createAsyncThunk('admin/deleteUser', async (userId, { rejectWithValue }) => {
  try { await api.delete(`/admin/users/${userId}/delete/`); return userId; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const updateEmployee = createAsyncThunk('admin/updateEmployee', async ({ employeeId, data }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/employees/${employeeId}/`, data)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const sendAdminFreeSms = createAsyncThunk('admin/sendFreeSms', async ({ phone_number, text }, { rejectWithValue }) => {
  try { return (await api.post('/admin/send-sms/', { phone_number, text })).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || error.message); }
});

const initialState = {
  list: [],
  selectedUser: null,
  workerInfo: null,
  loading: { list: false, userDetail: false, workerInfo: false },
  updateStatus: { loading: false, success: false, error: null },
};

const usersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    resetUpdateStatus: (state) => { state.updateStatus = { loading: false, success: false, error: null }; },
    clearSelectedUser: (state) => { state.selectedUser = null; },
    clearWorkerInfo: (state) => { state.workerInfo = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading.list = true; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading.list = false; state.list = action.payload; })
      .addCase(fetchUsers.rejected, (state) => { state.loading.list = false; })
      
      .addCase(fetchUserDetail.pending, (state) => { state.loading.userDetail = true; })
      .addCase(fetchUserDetail.fulfilled, (state, action) => { state.loading.userDetail = false; state.selectedUser = action.payload; })
      .addCase(fetchUserDetail.rejected, (state) => { state.loading.userDetail = false; })
      
      .addCase(updateUser.pending, (state) => { state.updateStatus.loading = true; })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        const index = state.list.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        if (state.selectedUser?.id === action.payload.id) state.selectedUser = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => { state.updateStatus = { loading: false, success: false, error: action.payload }; })
      
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      })

      .addCase(updateEmployee.pending, (state) => { state.updateStatus.loading = true; })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        if (state.selectedUser?.employee_details?.id === action.payload.id) {
            state.selectedUser.employee_details = { ...state.selectedUser.employee_details, ...action.payload };
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => { state.updateStatus = { loading: false, success: false, error: action.payload }; })

      .addCase(sendAdminFreeSms.pending, (state) => { state.updateStatus = { loading: true, success: false, error: null }; })
      .addCase(sendAdminFreeSms.fulfilled, (state) => { state.updateStatus = { loading: false, success: true, error: null }; })
      .addCase(sendAdminFreeSms.rejected, (state, action) => { state.updateStatus = { loading: false, success: false, error: action.payload }; })

      .addCase('admin/createContract/fulfilled', (state, action) => {
        if (state.selectedUser?.employee_details?.id === action.payload.employee) {
          if (!state.selectedUser.employee_details.contracts) state.selectedUser.employee_details.contracts = [];
          state.selectedUser.employee_details.contracts.unshift(action.payload);
        }
      })
      .addCase('admin/updateContract/fulfilled', (state, action) => {
        if (state.selectedUser?.employee_details?.contracts) {
          const index = state.selectedUser.employee_details.contracts.findIndex(c => c.id === action.payload.id);
          if (index !== -1) state.selectedUser.employee_details.contracts[index] = action.payload;
        }
      })
      .addCase('admin/deleteContract/fulfilled', (state, action) => {
        if (state.selectedUser?.employee_details?.contracts) {
          state.selectedUser.employee_details.contracts = state.selectedUser.employee_details.contracts.filter(c => c.id !== action.payload);
        }
      })

      .addCase(fetchUserWorkerId.pending, (state) => { state.loading.workerInfo = true; })
      .addCase(fetchUserWorkerId.fulfilled, (state, action) => { state.loading.workerInfo = false; state.workerInfo = action.payload; })
      .addCase(fetchUserWorkerId.rejected, (state) => { state.loading.workerInfo = false; state.workerInfo = null; })

      // ✅ جدید - worker مستقیم
      .addCase(fetchUserWorkerDirect.pending, (state) => { state.loading.workerInfo = true; })
      .addCase(fetchUserWorkerDirect.fulfilled, (state, action) => { state.loading.workerInfo = false; state.workerInfo = action.payload; })
      .addCase(fetchUserWorkerDirect.rejected, (state) => { state.loading.workerInfo = false; state.workerInfo = null; })
      .addCase(fetchUserLocationHistory.pending, (state) => { 
        state.loading.workerInfo = true; 
      })
      .addCase(fetchUserLocationHistory.fulfilled, (state, action) => { 
        state.loading.workerInfo = false; 
        state.workerInfo = action.payload; 
      })
      .addCase(fetchUserLocationHistory.rejected, (state) => { 
        state.loading.workerInfo = false; 
        state.workerInfo = null; 
      });
  },
});

export const { resetUpdateStatus, clearSelectedUser, clearWorkerInfo } = usersSlice.actions;

export default usersSlice.reducer;
