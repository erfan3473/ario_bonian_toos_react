// src/features/dailyReports/reportFormsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../actions/axios';

// 📌 Thunks
export const submitManagerReport = createAsyncThunk(
  'reportForms/submitManagerReport',
  async ({ reportId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`reports/${reportId}/manager/`, formData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const submitFacilitiesReport = createAsyncThunk(
  'reportForms/submitFacilitiesReport',
  async ({ reportId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`reports/${reportId}/facilities/`, formData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const submitSecurityReport = createAsyncThunk(
  'reportForms/submitSecurityReport',
  async ({ reportId, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`reports/${reportId}/security/`, formData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// 📌 Slice
const reportFormsSlice = createSlice({
  name: 'reportForms',
  initialState: {
    managerReport: null,
    facilitiesReport: null,
    securityReport: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetReportForm: (state) => {
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Manager
      .addCase(submitManagerReport.pending, (state) => { state.loading = true; })
      .addCase(submitManagerReport.fulfilled, (state, action) => {
        state.loading = false; state.success = true; state.managerReport = action.payload;
      })
      .addCase(submitManagerReport.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Facilities
      .addCase(submitFacilitiesReport.pending, (state) => { state.loading = true; })
      .addCase(submitFacilitiesReport.fulfilled, (state, action) => {
        state.loading = false; state.success = true; state.facilitiesReport = action.payload;
      })
      .addCase(submitFacilitiesReport.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Security
      .addCase(submitSecurityReport.pending, (state) => { state.loading = true; })
      .addCase(submitSecurityReport.fulfilled, (state, action) => {
        state.loading = false; state.success = true; state.securityReport = action.payload;
      })
      .addCase(submitSecurityReport.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { resetReportForm } = reportFormsSlice.actions;
export default reportFormsSlice.reducer;
