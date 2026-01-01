// src/features/admin/adminSchemeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// ================= Async Thunks =================

// --- Contracts ---
export const getSchemeContracts = createAsyncThunk(
  'adminScheme/getContracts',
  async ({ employeeId, projectId, contractId } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (employeeId) params.append('employee_id', employeeId);
      if (projectId) params.append('project_id', projectId);
      if (contractId) params.append('contract_id', contractId);
      
      const response = await api.get('/admin/scheme/contracts/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در بارگذاری قراردادها');
    }
  }
);

export const createSchemeContract = createAsyncThunk(
  'adminScheme/createContract',
  async (contractData, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/scheme/contracts/', contractData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در ایجاد قرارداد');
    }
  }
);

export const updateSchemeContract = createAsyncThunk(
  'adminScheme/updateContract',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/scheme/contracts/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در ویرایش');
    }
  }
);

export const recalculateSchemeContract = createAsyncThunk(
  'adminScheme/recalculate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/scheme/contracts/${id}/recalculate/`);
      return response.data; // انتظار داریم { detail: "...", data: updatedContract } برگردد
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در محاسبه');
    }
  }
);

// --- Job Classes ---
export const getJobClasses = createAsyncThunk(
  'adminScheme/jobClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/scheme/job-classes/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createJobClass = createAsyncThunk(
  'adminScheme/createJobClass',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/scheme/job-classes/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateJobClass = createAsyncThunk(
  'adminScheme/updateJobClass',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/scheme/job-classes/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// --- Job Groups ---
export const getJobGroups = createAsyncThunk(
  'adminScheme/jobGroups',
  async ({ year, group } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (group) params.append('group', group);
      const response = await api.get('/admin/scheme/job-groups/', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createJobGroup = createAsyncThunk(
  'adminScheme/createJobGroup',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/admin/scheme/job-groups/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateJobGroup = createAsyncThunk(
  'adminScheme/updateJobGroup',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/scheme/job-groups/${id}/`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// ================= Slice =================

const initialState = {
  contracts: [],
  jobClasses: [],
  jobGroups: [],
  loading: false, // لودینگ سراسری
  error: null,
};

const adminSchemeSlice = createSlice({
  name: 'adminScheme',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Contracts ---
      .addCase(getSchemeContracts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getSchemeContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = action.payload;
      })
      .addCase(getSchemeContracts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createSchemeContract.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createSchemeContract.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts.push(action.payload);
      })
      .addCase(createSchemeContract.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateSchemeContract.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateSchemeContract.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.contracts[index] = action.payload;
      })
      .addCase(updateSchemeContract.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Recalculate ---
      .addCase(recalculateSchemeContract.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(recalculateSchemeContract.fulfilled, (state, action) => {
        state.loading = false;
        // فرض بر این است که بک‌اند ساختار { detail: "...", data: object } برمی‌گرداند
        const updatedContract = action.payload.data || action.payload;
        const index = state.contracts.findIndex(c => c.id === updatedContract.id);
        if (index !== -1) state.contracts[index] = updatedContract;
      })
      .addCase(recalculateSchemeContract.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // --- Job Classes ---
      .addCase(getJobClasses.pending, (state) => { state.loading = true; })
      .addCase(getJobClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.jobClasses = action.payload;
      })
      .addCase(getJobClasses.rejected, (state) => { state.loading = false; })

      .addCase(createJobClass.pending, (state) => { state.loading = true; })
      .addCase(createJobClass.fulfilled, (state, action) => {
        state.loading = false;
        state.jobClasses.push(action.payload);
      })
      .addCase(createJobClass.rejected, (state) => { state.loading = false; })

      .addCase(updateJobClass.pending, (state) => { state.loading = true; })
      .addCase(updateJobClass.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.jobClasses.findIndex(j => j.id === action.payload.id);
        if(idx !== -1) state.jobClasses[idx] = action.payload;
      })
      .addCase(updateJobClass.rejected, (state) => { state.loading = false; })

      // --- Job Groups ---
      .addCase(getJobGroups.pending, (state) => { state.loading = true; })
      .addCase(getJobGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.jobGroups = action.payload;
      })
      .addCase(getJobGroups.rejected, (state) => { state.loading = false; })

      .addCase(createJobGroup.pending, (state) => { state.loading = true; })
      .addCase(createJobGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.jobGroups.push(action.payload);
      })
      .addCase(createJobGroup.rejected, (state) => { state.loading = false; })

      .addCase(updateJobGroup.pending, (state) => { state.loading = true; })
      .addCase(updateJobGroup.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.jobGroups.findIndex(g => g.id === action.payload.id);
        if(idx !== -1) state.jobGroups[idx] = action.payload;
      })
      .addCase(updateJobGroup.rejected, (state) => { state.loading = false; });
  },
});

export const { clearError } = adminSchemeSlice.actions;
export default adminSchemeSlice.reducer;