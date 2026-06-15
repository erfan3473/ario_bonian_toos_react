// src/features/admin/usersSlice.js
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
  loading: { list: false, userDetail: false },
  updateStatus: { loading: false, success: false, error: null },
};

const usersSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    resetUpdateStatus: (state) => { state.updateStatus = { loading: false, success: false, error: null }; },
    clearSelectedUser: (state) => { state.selectedUser = null; },
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

      // ✅ گوش دادن به اکشن‌های قراردادها بدون ایجاد حلقه (Circular Dependency)
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
      });
  },
});

export const { resetUpdateStatus, clearSelectedUser } = usersSlice.actions;
export default usersSlice.reducer;
