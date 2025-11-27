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

const statementSlice = createSlice({
  name: 'statements',
  initialState: {
    loading: false,
    list: [],
    error: null,
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
      });
  },
});

export default statementSlice.reducer;