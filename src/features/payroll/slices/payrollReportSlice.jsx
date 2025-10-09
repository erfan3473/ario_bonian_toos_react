// src/features/payroll/slices/payrollReportSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../api/axiosInstance'

const API_URL = 'payroll/payroll-reports/'

// 📌 خلاصه دوره
export const fetchPeriodSummary = createAsyncThunk(
  'report/fetchPeriodSummary',
  async (periodId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`${API_URL}period_summary/?period_id=${periodId}`)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در گزارش دوره')
    }
  }
)

// 📌 تاریخچه پرسنل
export const fetchEmployeeHistory = createAsyncThunk(
  'report/fetchEmployeeHistory',
  async ({ employee_id, year }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `${API_URL}employee_history/?employee_id=${employee_id}&year=${year}`
      )
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در دریافت تاریخچه')
    }
  }
)

const payrollReportSlice = createSlice({
  name: 'payrollReport',
  initialState: {
    periodSummary: null,
    employeeHistory: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPeriodSummary.pending, (state) => { state.loading = true })
      .addCase(fetchPeriodSummary.fulfilled, (state, action) => {
        state.loading = false
        state.periodSummary = action.payload
      })
      .addCase(fetchEmployeeHistory.fulfilled, (state, action) => {
        state.loading = false
        state.employeeHistory = action.payload
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

export default payrollReportSlice.reducer