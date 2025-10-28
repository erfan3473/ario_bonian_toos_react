// src/features/payroll/slices/salaryComponentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../api/axiosInstance'

const API_URL = 'payroll/salary-components/'

export const fetchSalaryComponents = createAsyncThunk(
  'salaryComponent/fetchSalaryComponents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { type, page } = params
      let url = API_URL
      
      const queryParams = new URLSearchParams()
      if (type) queryParams.append('type', type)
      if (page) queryParams.append('page', page)
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }

      console.log('📦 Fetching from URL:', url)
      
      const { data } = await axiosInstance.get(url)
      console.log('📦 SalaryComponent API response:', data)
      
      return data
    } catch (error) {
      console.error('❌ API Error:', error)
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data || 
        'خطا در دریافت کامپوننت‌ها'
      )
    }
  }
)

const salaryComponentSlice = createSlice({
  name: 'salaryComponent',
  initialState: {
    components: [],
    count: 0,
    next: null,
    previous: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalaryComponents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSalaryComponents.fulfilled, (state, action) => {
        state.loading = false
        const data = action.payload

        if (Array.isArray(data)) {
          state.components = data
          state.count = data.length
          state.next = null
          state.previous = null
        } else {
          state.components = data.results || []
          state.count = data.count || 0
          state.next = data.next || null
          state.previous = data.previous || null
        }
      })
      .addCase(fetchSalaryComponents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export default salaryComponentSlice.reducer