// src/features/projects/projectListSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const PROJECTS_API = 'http://127.0.0.1:8000/api/projects/'

// 🟢 Thunk: گرفتن لیست پروژه‌ها
export const listProjectsThunk = createAsyncThunk(
  'projects/list',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      const { data } = await axios.get(PROJECTS_API, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

const projectListSlice = createSlice({
  name: 'projectList',
  initialState: {
    projects: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listProjectsThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(listProjectsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(listProjectsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const projectListReducer = projectListSlice.reducer
