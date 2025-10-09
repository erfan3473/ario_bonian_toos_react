// src/features/hr/positionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const initialState = {
  positions: [],
  status: 'idle',
  error: null,
};

// Async Thunks for Position operations
export const fetchPositions = createAsyncThunk('hr/fetchPositions', async () => {
  const response = await axiosInstance.get('positions/');
  return response.data;
});

export const createPosition = createAsyncThunk('hr/createPosition', async (positionData) => {
  const response = await axiosInstance.post('positions/', positionData);
  return response.data;
});

// Position Slice
const positionSlice = createSlice({
  name: 'positions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPositions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.positions = action.payload;
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createPosition.fulfilled, (state, action) => {
        state.positions.push(action.payload);
      });
      // میتوانید موارد update و delete را مشابه employeeSlice اضافه کنید
  },
});

export default positionSlice.reducer;