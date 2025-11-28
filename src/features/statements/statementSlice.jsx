// src/features/statements/statementSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchStatements = createAsyncThunk(
  'statements/fetchList',
  async ({ projectId, year } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (projectId) params.project_id = projectId;
      if (year) params.year = year;

      const { data } = await axiosInstance.get('/statements/', { params });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت صورت‌وضعیت‌ها');
    }
  }
);
export const fetchStatementDetails = createAsyncThunk(
  'statements/fetchDetails',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/statements/${id}/`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'خطا در دریافت جزئیات');
    }
  }
);
const statementSlice = createSlice({
  name: 'statements',
  initialState: {
    loading: false,
    list: [],
    error: null,
    currentStatement: { data: null, loading: false, error: null } // ✅ اضافه شد
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatements.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchStatements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStatementDetails.pending, (state) => {
        state.currentStatement.loading = true;
        state.currentStatement.error = null;
      })
      .addCase(fetchStatementDetails.fulfilled, (state, action) => {
        state.currentStatement.loading = false;
        state.currentStatement.data = action.payload;
      })
      .addCase(fetchStatementDetails.rejected, (state, action) => {
        state.currentStatement.loading = false;
        state.currentStatement.error = action.payload;
      });
  },
});

export default statementSlice.reducer;