// src/features/payroll/slices/payslipSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../api/axiosInstance'

const API_URL = 'payroll/payslips/'

// 📌 لیست فیش‌ها
export const fetchPayslips = createAsyncThunk(
  'payslip/fetchPayslips',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(API_URL)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در دریافت فیش‌ها')
    }
  }
)

// 📌 ایجاد فیش جدید
export const createPayslip = createAsyncThunk(
  'payslip/createPayslip',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(API_URL, payload)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در ایجاد فیش')
    }
  }
)

// 📌 محاسبه مجدد فیش
export const recalculatePayslip = createAsyncThunk(
  'payslip/recalculatePayslip',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}${id}/calculate_salary/`)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در محاسبه مجدد')
    }
  }
)

// 📌 پرداخت فیش
export const markPayslipPaid = createAsyncThunk(
  'payslip/markPayslipPaid',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`${API_URL}${id}/mark_paid/`)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در پرداخت فیش')
    }
  }
)

const payslipSlice = createSlice({
  name: 'payslip',
  initialState: {
    payslips: [],
    loading: false,
    error: null,
    message: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayslips.pending, (state) => { state.loading = true })
      .addCase(fetchPayslips.fulfilled, (state, action) => {
        state.loading = false
        state.payslips = action.payload
      })
      .addCase(createPayslip.fulfilled, (state, action) => {
        state.payslips.push(action.payload)
      })
      .addCase(markPayslipPaid.fulfilled, (state, action) => {
        state.message = action.payload.message
      })
      .addCase(recalculatePayslip.fulfilled, (state, action) => {
        const index = state.payslips.findIndex(p => p.id === action.payload.id)
        if (index !== -1) state.payslips[index] = action.payload
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

export default payslipSlice.reducer