import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000/api/payroll/employment-types/'

// 🟢 دریافت همه
export const listEmploymentTypes = createAsyncThunk(
  'employmentTypes/list',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(API_URL, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// 🟢 ایجاد
export const createEmploymentType = createAsyncThunk(
  'employmentTypes/create',
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.post(API_URL, payload, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// 🟢 آپدیت
export const updateEmploymentType = createAsyncThunk(
  'employmentTypes/update',
  async ({ id, ...payload }, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.put(`${API_URL}${id}/`, payload, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

// 🟢 حذف
export const deleteEmploymentType = createAsyncThunk(
  'employmentTypes/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      await axios.delete(`${API_URL}${id}/`, config)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

const employmentTypeSlice = createSlice({
  name: 'employmentTypes',
  initialState: {
    list: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetEmploymentTypes: (state) => {
      state.list = []
      state.loading = false
      state.error = null
      state.success = false
    }
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(listEmploymentTypes.pending, (state) => { state.loading = true })
      .addCase(listEmploymentTypes.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(listEmploymentTypes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // create
      .addCase(createEmploymentType.fulfilled, (state, action) => {
        state.list.push(action.payload)
        state.success = true
      })
      // update
      .addCase(updateEmploymentType.fulfilled, (state, action) => {
        const idx = state.list.findIndex((e) => e.id === action.payload.id)
        if (idx !== -1) state.list[idx] = action.payload
        state.success = true
      })
      // delete
      .addCase(deleteEmploymentType.fulfilled, (state, action) => {
        state.list = state.list.filter((e) => e.id !== action.payload)
        state.success = true
      })
  },
})

export const { resetEmploymentTypes } = employmentTypeSlice.actions
export const employmentTypeReducer = employmentTypeSlice.reducer
