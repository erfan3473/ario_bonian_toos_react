// src/features/projects/projectCreateSlice.jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const PROJECTS_API = 'http://127.0.0.1:8000/api/projects/'

// 🟢 Thunk: ایجاد پروژه
export const createProjectThunk = createAsyncThunk(
  'projects/create',
  async (projectData, { getState, rejectWithValue }) => {
    try {
      const { userLogin: { userInfo } } = getState()
      const config = { 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}` 
        }
      }
      const { data } = await axios.post(`${PROJECTS_API}create/`, projectData, config)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message)
    }
  }
)

const projectCreateSlice = createSlice({
  name: 'projectCreate',
  initialState: {
    loading: false,
    success: false,
    error: null,
    project: null,
  },
  reducers: {
    resetProjectCreate: (state) => {
      state.loading = false
      state.success = false
      state.error = null
      state.project = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createProjectThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(createProjectThunk.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        state.project = action.payload
      })
      .addCase(createProjectThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { resetProjectCreate } = projectCreateSlice.actions
export const projectCreateReducer = projectCreateSlice.reducer
