import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../api/axiosInstance' // ✅ از axiosInstance استفاده کن

const API_URL = 'payroll/leave-requests/' // بدون /api چون baseURL قبلاً /api ست شده

// 📌 دریافت لیست مرخصی‌ها
export const fetchLeaveRequests = createAsyncThunk(
  'leave/fetchLeaveRequests',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(API_URL) // ✅
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در دریافت مرخصی‌ها')
    }
  }
)

// 📌 تأیید مرخصی
export const approveLeaveRequest = createAsyncThunk(
  'leave/approveLeaveRequest',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}${id}/approve/`) // ✅
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در تأیید مرخصی')
    }
  }
)

// 📌 رد مرخصی
export const rejectLeaveRequest = createAsyncThunk(
  'leave/rejectLeaveRequest',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}${id}/reject/`, { reason }) // ✅
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در رد مرخصی')
    }
  }
)

const leaveRequestSlice = createSlice({
  name: 'leaveRequest',
  initialState: {
    requests: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.loading = false
        state.requests = action.payload
      })
      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r.id === action.payload.id)
        if (index !== -1) state.requests[index] = action.payload
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r.id === action.payload.id)
        if (index !== -1) state.requests[index] = action.payload
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false
          state.error = action.payload
        }
      )
  },
})

export default leaveRequestSlice.reducer
