// src/features/payroll/slices/payrollPeriodSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../api/axiosInstance'

const API_URL = 'payroll/payroll-periods/'

// 📌 دریافت لیست دوره‌ها (با پشتیبانی از paginate)
export const fetchPayrollPeriods = createAsyncThunk(
  'payroll/fetchPayrollPeriods',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(API_URL)
      console.log('📅 [fetchPayrollPeriods] response:', data)
      return data
    } catch (error) {
      console.error('❌ [fetchPayrollPeriods] error:', error)
      return rejectWithValue(error.response?.data || 'خطا در دریافت داده‌ها')
    }
  }
)

// 📌 دریافت دوره جاری
export const fetchCurrentPeriod = createAsyncThunk(
  'payroll/fetchCurrentPeriod',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`${API_URL}current_period/`)
      console.log('📅 [fetchCurrentPeriod] response:', data)
      return data
    } catch (error) {
      console.error('❌ [fetchCurrentPeriod] error:', error)
      return rejectWithValue(error.response?.data || 'دوره فعال یافت نشد')
    }
  }
)

// 📌 بستن دوره
export const closePayrollPeriod = createAsyncThunk(
  'payroll/closePayrollPeriod',
  async (periodId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}${periodId}/close_period/`)
      console.log('✅ [closePayrollPeriod] response:', data)
      return { id: periodId, message: data.message }
    } catch (error) {
      console.error('❌ [closePayrollPeriod] error:', error)
      return rejectWithValue(error.response?.data || 'خطا در بستن دوره')
    }
  }
)

// 📌 تولید حقوق برای دوره
export const generatePayroll = createAsyncThunk(
  'payroll/generatePayroll',
  async (periodId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}${periodId}/generate_payroll/`)
      console.log('✅ [generatePayroll] response:', data)
      return data
    } catch (error) {
      console.error('❌ [generatePayroll] error:', error)
      return rejectWithValue(error.response?.data || 'خطا در تولید حقوق')
    }
  }
)

const payrollPeriodSlice = createSlice({
  name: 'payrollPeriod',
  initialState: {
    periods: [],
    currentPeriod: null,
    loading: false,
    error: null,
    message: null,
    pagination: {
      count: 0,
      next: null,
      previous: null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollPeriods.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPayrollPeriods.fulfilled, (state, action) => {
        state.loading = false
        const data = action.payload

        if (Array.isArray(data)) {
          state.periods = data
          state.pagination = { count: data.length, next: null, previous: null }
        } else {
          state.periods = data.results || []
          state.pagination = {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          }
        }
      })
      .addCase(fetchPayrollPeriods.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchCurrentPeriod.fulfilled, (state, action) => {
        state.currentPeriod = action.payload
      })
      .addCase(closePayrollPeriod.fulfilled, (state, action) => {
        state.message = action.payload.message
      })
      .addCase(generatePayroll.fulfilled, (state, action) => {
        state.message = action.payload.message
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false
          state.error = action.payload || 'خطای ناشناخته'
        }
      )
  },
})

export default payrollPeriodSlice.reducer