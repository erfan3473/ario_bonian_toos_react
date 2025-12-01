// src/features/projects/projectSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 📋 Async Thunks
// ═══════════════════════════════════════════════════════════

// 1️⃣ دریافت لیست پروژه‌ها
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/projects/');
      return data;
    } catch (error) {
      if (error.response?.status === 404) return [];
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 2️⃣ دریافت جزئیات یک پروژه
export const fetchProjectDetail = createAsyncThunk(
  'projects/fetchProjectDetail',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/projects/${projectId}/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 3️⃣ دریافت اطلاعات فنس (Geofence)
export const fetchProjectGeofence = createAsyncThunk(
  'projects/fetchProjectGeofence',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/projects/${projectId}/geofence/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 4️⃣ آپدیت فنس
export const updateProjectGeofence = createAsyncThunk(
  'projects/updateProjectGeofence',
  async ({ projectId, coordinates }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/projects/${projectId}/geofence/`, {
        boundary_coordinates: coordinates,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 5️⃣ ساخت پروژه جدید (برای ادمین)
export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/projects/', projectData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 6️⃣ آپدیت پروژه
export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ projectId, projectData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/projects/${projectId}/`, projectData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 🗂️ Slice
// ═══════════════════════════════════════════════════════════

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    // لیست پروژه‌ها
    list: [],
    loading: false,
    error: null,

    // جزئیات پروژه انتخاب شده
    selectedProject: {
      data: null,
      loading: false,
      error: null,
    },

    // فنس پروژه
    geofence: {
      data: null,
      loading: false,
      error: null,
    },

    // پروژه انتخاب شده (برای فیلتر)
    selectedProjectId: null,
  },

  reducers: {
    // انتخاب پروژه
    setSelectedProject: (state, action) => {
      state.selectedProjectId = action.payload;
    },

    // پاک کردن پروژه انتخاب شده
    clearSelectedProject: (state) => {
      state.selectedProject.data = null;
      state.selectedProject.error = null;
    },

    // پاک کردن فنس
    clearGeofence: (state) => {
      state.geofence.data = null;
      state.geofence.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ═══════════════════════════════════════════════════════════
      // fetchProjects
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // fetchProjectDetail
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchProjectDetail.pending, (state) => {
        state.selectedProject.loading = true;
        state.selectedProject.error = null;
      })
      .addCase(fetchProjectDetail.fulfilled, (state, action) => {
        state.selectedProject.loading = false;
        state.selectedProject.data = action.payload;
      })
      .addCase(fetchProjectDetail.rejected, (state, action) => {
        state.selectedProject.loading = false;
        state.selectedProject.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // fetchProjectGeofence
      // ═══════════════════════════════════════════════════════════
      .addCase(fetchProjectGeofence.pending, (state) => {
        state.geofence.loading = true;
        state.geofence.error = null;
      })
      .addCase(fetchProjectGeofence.fulfilled, (state, action) => {
        state.geofence.loading = false;
        state.geofence.data = action.payload;
      })
      .addCase(fetchProjectGeofence.rejected, (state, action) => {
        state.geofence.loading = false;
        state.geofence.error = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // updateProjectGeofence
      // ═══════════════════════════════════════════════════════════
      .addCase(updateProjectGeofence.fulfilled, (state, action) => {
        state.geofence.data = action.payload;
      })

      // ═══════════════════════════════════════════════════════════
      // createProject
      // ═══════════════════════════════════════════════════════════
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      // ═══════════════════════════════════════════════════════════
      // updateProject
      // ═══════════════════════════════════════════════════════════
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.list.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        if (state.selectedProject.data?.id === action.payload.id) {
          state.selectedProject.data = action.payload;
        }
      });
  },
});

export const {
  setSelectedProject,
  clearSelectedProject,
  clearGeofence,
} = projectSlice.actions;

export default projectSlice.reducer;
