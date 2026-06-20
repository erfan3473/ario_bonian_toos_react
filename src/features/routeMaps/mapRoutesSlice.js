// src/features/routeMaps/mapRoutesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// =======================================================
// Async Thunks (درخواست‌های API)
// =======================================================

// 1. دریافت آیکون‌ها
export const fetchFeatureIcons = createAsyncThunk(
  'mapRoutes/fetchFeatureIcons',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/routes/feature-icons/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 2. مسیرها (Route Templates)
export const fetchRouteTemplates = createAsyncThunk(
  'mapRoutes/fetchRouteTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/routes/route-templates/');
      console.log("🔥 دیتا مسیرها از API:", data); // این لاگ را حتما ببینید
      // اگر دیتا صفحه‌بندی شده باشد، آرایه اصلی داخل data.results است
      return data.results ? data.results : data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


export const createRouteTemplate = createAsyncThunk(
  'mapRoutes/createRouteTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/routes/route-templates/', templateData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
// 3. عارضه‌ها (Project Features)
export const fetchProjectFeatures = createAsyncThunk(
  'mapRoutes/fetchProjectFeatures',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/routes/project-features/');
      console.log("🔥 دیتا عارضه‌ها از API:", data); // این لاگ را حتما ببینید
      return data.results ? data.results : data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createProjectFeature = createAsyncThunk(
  'mapRoutes/createProjectFeature',
  async (featureData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/routes/project-features/', featureData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteProjectFeature = createAsyncThunk(
  'mapRoutes/deleteProjectFeature',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/routes/project-features/${id}/`);
      return id; // برگرداندن ID برای حذف از استیت
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 4. لیست کارگران زیرمجموعه
export const fetchSubordinateWorkers = createAsyncThunk(
  'mapRoutes/fetchSubordinateWorkers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/routes/subordinate-workers/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 5. تخصیص مسیرها (Route Assignments)
export const fetchRouteAssignments = createAsyncThunk(
  'mapRoutes/fetchRouteAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/routes/route-assignments/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createRouteAssignment = createAsyncThunk(
  'mapRoutes/createRouteAssignment',
  async (assignmentData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/routes/route-assignments/', assignmentData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// =======================================================
// Initial State
// =======================================================
const initialState = {
  featureIcons: [],
  routeTemplates: [],
  projectFeatures: [],
  subordinateWorkers: [],
  routeAssignments: [],
  
  loading: {
    fetch: false,
    action: false,
  },
  error: null,
};

// =======================================================
// Slice
// =======================================================
const mapRoutesSlice = createSlice({
  name: 'mapRoutes',
  initialState,
  reducers: {
    clearMapRoutesError: (state) => {
      state.error = null;
    },
    resetMapRoutesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Feature Icons ---
      .addCase(fetchFeatureIcons.pending, (state) => { state.loading.fetch = true; state.error = null; })
      .addCase(fetchFeatureIcons.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.featureIcons = action.payload;
      })
      .addCase(fetchFeatureIcons.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload;
      })

      // --- Fetch Route Templates ---
      .addCase(fetchRouteTemplates.pending, (state) => { state.loading.fetch = true; state.error = null; })
      .addCase(fetchRouteTemplates.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.routeTemplates = action.payload;
      })
      .addCase(fetchRouteTemplates.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload;
      })

      // --- Create Route Template ---
      .addCase(createRouteTemplate.pending, (state) => { state.loading.action = true; state.error = null; })
      .addCase(createRouteTemplate.fulfilled, (state, action) => {
        state.loading.action = false;
        state.routeTemplates.push(action.payload);
      })
      .addCase(createRouteTemplate.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      })

      // --- Fetch Project Features ---
      .addCase(fetchProjectFeatures.pending, (state) => { state.loading.fetch = true; state.error = null; })
      .addCase(fetchProjectFeatures.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.projectFeatures = action.payload;
      })
      .addCase(fetchProjectFeatures.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload;
      })

      // --- Create Project Feature ---
      .addCase(createProjectFeature.pending, (state) => { state.loading.action = true; state.error = null; })
      .addCase(createProjectFeature.fulfilled, (state, action) => {
        state.loading.action = false;
        state.projectFeatures.push(action.payload);
      })
      .addCase(createProjectFeature.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      })

      // --- Delete Project Feature ---
      .addCase(deleteProjectFeature.pending, (state) => { state.loading.action = true; state.error = null; })
      .addCase(deleteProjectFeature.fulfilled, (state, action) => {
        state.loading.action = false;
        state.projectFeatures = state.projectFeatures.filter(f => f.id !== action.payload);
      })
      .addCase(deleteProjectFeature.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload;
      })

      // --- Fetch Subordinate Workers ---
      .addCase(fetchSubordinateWorkers.fulfilled, (state, action) => {
        state.subordinateWorkers = action.payload;
      })

      // --- Fetch Route Assignments ---
      .addCase(fetchRouteAssignments.fulfilled, (state, action) => {
        state.routeAssignments = action.payload;
      });
  },
});

export const { clearMapRoutesError, resetMapRoutesState } = mapRoutesSlice.actions;
export default mapRoutesSlice.reducer;
