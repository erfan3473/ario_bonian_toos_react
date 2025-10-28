// src/features/projects/projectListSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const PROJECTS_API = 'http://127.0.0.1:8000/api/projects/'

// 🟢 Thunk: گرفتن لیست پروژه‌ها (خصوصی)
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

// 🟢 Thunk: گرفتن لیست پروژه‌های عمومی
export const listPublicProjectsThunk = createAsyncThunk(
  'projects/listPublic', // یک نام منحصر به فرد
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${PROJECTS_API}public/`)
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
    selectedProject: null, // 🟡 پروژه انتخاب‌شده
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload
    },
  },
  // ✅ تمام extraReducers در یک بلاک ترکیب شدند
  extraReducers: (builder) => {
    builder
      // Reducers for listProjectsThunk (private)
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
      // Reducers for listPublicProjectsThunk (public)
      .addCase(listPublicProjectsThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(listPublicProjectsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
        state.error = null // ریست کردن خطا در صورت موفقیت
      })
      .addCase(listPublicProjectsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { setSelectedProject } = projectListSlice.actions
export const projectListReducer = projectListSlice.reducer