import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

export const fetchContracts = createAsyncThunk('admin/fetchContracts', async (_, { rejectWithValue }) => {
  try { return (await api.get('/admin/contracts/')).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const createContract = createAsyncThunk('admin/createContract', async (data, { rejectWithValue }) => {
  try { return (await api.post('/admin/contracts/', data)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const updateContract = createAsyncThunk('admin/updateContract', async ({ contractId, data }, { rejectWithValue }) => {
  try { return (await api.put(`/admin/contracts/${contractId}/`, data)).data; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

export const deleteContract = createAsyncThunk('admin/deleteContract', async (contractId, { rejectWithValue }) => {
  try { await api.delete(`/admin/contracts/${contractId}/`); return contractId; } 
  catch (error) { return rejectWithValue(error.response?.data?.detail || 'خطا'); }
});

const contractsSlice = createSlice({
  name: 'adminContracts',
  initialState: { list: [], loading: false, updateStatus: { loading: false, success: false, error: null } },
  reducers: {
    resetContractUpdateStatus: (state) => { state.updateStatus = { loading: false, success: false, error: null }; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContracts.pending, (state) => { state.loading = true; })
      .addCase(fetchContracts.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchContracts.rejected, (state) => { state.loading = false; })
      
      .addCase(createContract.fulfilled, (state, action) => { state.list.push(action.payload); state.updateStatus = { loading: false, success: true, error: null }; })
      .addCase(updateContract.fulfilled, (state, action) => {
        const index = state.list.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        state.updateStatus = { loading: false, success: true, error: null };
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload);
        state.updateStatus = { loading: false, success: true, error: null };
      });
  },
});

export const { resetContractUpdateStatus } = contractsSlice.actions;
export default contractsSlice.reducer;
