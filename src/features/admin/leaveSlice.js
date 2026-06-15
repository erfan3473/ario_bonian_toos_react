import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

export const fetchEmployeeLeaveSummary = createAsyncThunk('admin/fetchEmployeeLeaveSummary', async ({ employeeId, year }, { rejectWithValue }) => {
  try { return (await api.get(`/admin/employees/${employeeId}/leave-summary/?year=${year}`)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const fetchLeaveRequests = createAsyncThunk('admin/fetchLeaveRequests', async (status = '', { rejectWithValue }) => {
  try { return (await api.get(`/admin/leave-requests/${status ? `?status=${status}` : ''}`)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const approveLeaveRequest = createAsyncThunk('admin/approveLeaveRequest', async (requestId, { rejectWithValue }) => {
  try { await api.post(`/admin/leave-requests/${requestId}/approve/`); return requestId; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const rejectLeaveRequest = createAsyncThunk('admin/rejectLeaveRequest', async ({ requestId, reason }, { rejectWithValue }) => {
  try { await api.post(`/admin/leave-requests/${requestId}/reject/`, { reason }); return requestId; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

const leaveSlice = createSlice({
  name: 'adminLeave',
  initialState: {
    leaveRequests: [], leaveSummary: null,
    loading: { requests: false, summary: false },
    updateStatus: { loading: false, success: false, error: null }
  },
  reducers: { clearLeaveSummary: (state) => { state.leaveSummary = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeLeaveSummary.pending, (state) => { state.loading.summary = true; })
      .addCase(fetchEmployeeLeaveSummary.fulfilled, (state, action) => { state.loading.summary = false; state.leaveSummary = action.payload; })
      .addCase(fetchEmployeeLeaveSummary.rejected, (state) => { state.loading.summary = false; })

      .addCase(fetchLeaveRequests.pending, (state) => { state.loading.requests = true; })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => { state.loading.requests = false; state.leaveRequests = action.payload; })
      .addCase(fetchLeaveRequests.rejected, (state) => { state.loading.requests = false; })

      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        state.leaveRequests = state.leaveRequests.filter(r => r.id !== action.payload);
        if (state.leaveSummary) state.leaveSummary.pending_requests = state.leaveSummary.pending_requests.filter(r => r.id !== action.payload);
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        state.updateStatus = { loading: false, success: true, error: null };
        if (state.leaveSummary) state.leaveSummary.pending_requests = state.leaveSummary.pending_requests.filter(r => r.id !== action.payload);
      });
  },
});

export const { clearLeaveSummary } = leaveSlice.actions;
export default leaveSlice.reducer;
