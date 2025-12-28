// src/features/admin/adminSchemeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'خطا در محاسبه');
    }
  }
);

export const getJobClasses = createAsyncThunk(
  'adminScheme/jobClasses',
  async () => {
    const response = await api.get('/admin/scheme/job-classes/');
    return response.data;
  }
);

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

const initialState = {
  contracts: [],
  jobClasses: [],
  jobGroups: [],
  loading: false,
  error: null,
  selectedContract: null,
};

const adminSchemeSlice = createSlice({
  name: 'adminScheme',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedContract: (state, action) => {
      state.selectedContract = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Contracts
      .addCase(getSchemeContracts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSchemeContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = action.payload;
      })
      .addCase(getSchemeContracts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSchemeContract.fulfilled, (state, action) => {
        state.contracts.push(action.payload);
        state.error = null;
      })
      .addCase(updateSchemeContract.fulfilled, (state, action) => {
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.contracts[index] = action.payload;
      })
      // Recalculate
      .addCase(recalculateSchemeContract.fulfilled, (state, action) => {
        const index = state.contracts.findIndex(c => c.id === action.payload.data.id);
        if (index !== -1) state.contracts[index] = action.payload.data;
      })
      // Job Classes
      .addCase(getJobClasses.fulfilled, (state, action) => {
        state.jobClasses = action.payload;
      })
      // Job Groups
      .addCase(getJobGroups.fulfilled, (state, action) => {
        state.jobGroups = action.payload;
      });
  },
});

export const { clearError, setSelectedContract } = adminSchemeSlice.actions;
export default adminSchemeSlice.reducer;
