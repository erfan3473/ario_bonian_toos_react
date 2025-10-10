// src/features/attendance/adminAttendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

// 📌 گزارش روزانه
export const fetchDailyAttendance = createAsyncThunk(
  'attendance/fetchDailyAttendance',
  async (params = {}, { rejectWithValue }) => {
    try {
      // این آدرس صحیح است چون baseURL در axiosInstance وجود دارد
      const { data } = await axiosInstance.get('/attendance/admin/daily-report/', { params })
      return data
    } catch (error) {
      console.error('❌ Daily report error:', error.response?.data)
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'خطا در دریافت گزارش روزانه'
      )
    }
  }
)

// 📌 گزارش ماهانه
export const fetchMonthlyAttendance = createAsyncThunk(
  'attendance/fetchMonthlyAttendance',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('attendance/admin/monthly-report/', { params })
      console.log('📊 Monthly report response:', data)
      return data
    } catch (error) {
      console.error('❌ Monthly report error:', error.response?.data)
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'خطا در دریافت گزارش ماهانه'
      )
    }
  }
)

const adminAttendanceSlice = createSlice({
  name: 'adminAttendance',
  initialState: {
    dailyReport: [],
    monthlyReport: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyAttendance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDailyAttendance.fulfilled, (state, action) => {
        state.loading = false
        state.dailyReport = action.payload
      })
      .addCase(fetchMonthlyAttendance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.loading = false
        state.monthlyReport = action.payload
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

export const { clearError } = adminAttendanceSlice.actions
export default adminAttendanceSlice.reducer