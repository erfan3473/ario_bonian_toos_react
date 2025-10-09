// src/features/hr/paygradeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const initialState = {
  paygrades: [],
  status: 'idle',
  error: null,
};

// Async Thunks for PayGrade operations
export const fetchPayGrades = createAsyncThunk('hr/fetchPayGrades', async () => {
  const response = await axiosInstance.get('paygrades/');
  return response.data;
});

export const createPayGrade = createAsyncThunk('hr/createPayGrade', async (paygradeData) => {
    const response = await axiosInstance.post('paygrades/', paygradeData);
    return response.data;
});

// PayGrade Slice
const paygradeSlice = createSlice({
  name: 'paygrades',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayGrades.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPayGrades.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.paygrades = action.payload;
      })
      .addCase(fetchPayGrades.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createPayGrade.fulfilled, (state, action) => {
          state.paygrades.push(action.payload);
      });
      // موارد update و delete را نیز میتوانید اضافه کنید
  },
});

export default paygradeSlice.reducer;