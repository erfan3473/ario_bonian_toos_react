// src/features/attendance/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

const API_URL = 'attendance/'

// 📌 شروع شیفت
export const startShift = createAsyncThunk(
  'attendance/startShift',
  async (locationData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}start-shift/`, locationData)
      console.log('✅ شیفت شروع شد:', data)
      return data
    } catch (error) {
      console.error('❌ خطا در شروع شیفت:', error)
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'خطا در شروع شیفت'
      )
    }
  }
)

// 📌 پایان شیفت
export const endShift = createAsyncThunk(
  'attendance/endShift',
  async (locationData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}end-shift/`, locationData)
      console.log('✅ شیفت پایان یافت:', data)
      return data
    } catch (error) {
      console.error('❌ خطا در پایان شیفت:', error)
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        'خطا در پایان شیفت'
      )
    }
  }
)

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    currentShift: null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearMessage: (state) => {
      state.message = null
    }
  },
  extraReducers: (builder) => {
    builder
      // شروع شیفت
      .addCase(startShift.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(startShift.fulfilled, (state, action) => {
        state.loading = false
        state.currentShift = action.payload
        state.message = 'شیفت با موفقیت شروع شد'
      })
      .addCase(startShift.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // پایان شیفت
      .addCase(endShift.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(endShift.fulfilled, (state, action) => {
        state.loading = false
        state.currentShift = null
        state.message = 'شیفت با موفقیت پایان یافت'
      })
      .addCase(endShift.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearMessage } = attendanceSlice.actions
export default attendanceSlice.reducer