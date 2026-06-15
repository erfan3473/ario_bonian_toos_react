import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axiosInstance';

// FETCH ALL
export const fetchPositions = createAsyncThunk('admin/fetchPositions', async () => (await api.get('/admin/dropdowns/positions/')).data);
export const fetchSkillLevels = createAsyncThunk('admin/fetchSkillLevels', async () => (await api.get('/admin/dropdowns/skill-levels/')).data);
export const fetchEmploymentTypes = createAsyncThunk('admin/fetchEmploymentTypes', async () => (await api.get('/admin/dropdowns/employment-types/')).data);
export const fetchLeaveTypes = createAsyncThunk('admin/fetchLeaveTypes', async () => (await api.get('/admin/dropdowns/leave-types/')).data);

export const fetchDropdowns = createAsyncThunk('admin/fetchDropdowns', async (_, { rejectWithValue, dispatch }) => {
  try {
    await Promise.all([dispatch(fetchPositions()), dispatch(fetchSkillLevels()), dispatch(fetchEmploymentTypes()), dispatch(fetchLeaveTypes())]);
    return { success: true };
  } catch (error) { return rejectWithValue('خطا در بارگذاری داده‌ها'); }
});

// Employment Types CRUD
export const createEmploymentType = createAsyncThunk('admin/createEmploymentType', async (data) => (await api.post('/admin/employment-types/', data)).data);
export const updateEmploymentType = createAsyncThunk('admin/updateEmploymentType', async ({ id, data }) => (await api.put(`/admin/employment-types/${id}/`, data)).data);
export const deleteEmploymentType = createAsyncThunk('admin/deleteEmploymentType', async (id) => { await api.delete(`/admin/employment-types/${id}/delete/`); return id; });

// Positions CRUD
export const createPosition = createAsyncThunk('admin/createPosition', async (data) => (await api.post('/admin/positions/', data)).data);
export const updatePosition = createAsyncThunk('admin/updatePosition', async ({ id, data }) => (await api.put(`/admin/positions/${id}/`, data)).data);
export const deletePosition = createAsyncThunk('admin/deletePosition', async (id) => { await api.delete(`/admin/positions/${id}/delete/`); return id; });

// Skill Levels CRUD
export const createSkillLevel = createAsyncThunk('admin/createSkillLevel', async (data) => (await api.post('/admin/skill-levels/', data)).data);
export const updateSkillLevel = createAsyncThunk('admin/updateSkillLevel', async ({ id, data }) => (await api.put(`/admin/skill-levels/${id}/`, data)).data);
export const deleteSkillLevel = createAsyncThunk('admin/deleteSkillLevel', async (id) => { await api.delete(`/admin/skill-levels/${id}/delete/`); return id; });

// Leave Types CRUD
export const createLeaveType = createAsyncThunk('admin/createLeaveType', async (data) => (await api.post('/admin/leave-types/', data)).data);
export const updateLeaveType = createAsyncThunk('admin/updateLeaveType', async ({ id, data }) => (await api.put(`/admin/leave-types/${id}/`, data)).data);
export const deleteLeaveType = createAsyncThunk('admin/deleteLeaveType', async (id) => { await api.delete(`/admin/leave-types/${id}/delete/`); return id; });

const dropdownsSlice = createSlice({
  name: 'adminDropdowns',
  initialState: {
    positions: [], skillLevels: [], employmentTypes: [], leaveTypes: [],
    loading: false, error: null, updateStatus: { loading: false, success: false, error: null }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDropdowns.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDropdowns.fulfilled, (state) => { state.loading = false; })
      .addCase(fetchDropdowns.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(fetchPositions.fulfilled, (state, action) => { state.positions = action.payload; })
      .addCase(fetchSkillLevels.fulfilled, (state, action) => { state.skillLevels = action.payload; })
      .addCase(fetchEmploymentTypes.fulfilled, (state, action) => { state.employmentTypes = action.payload; })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => { state.leaveTypes = action.payload; })

      // (برای کوتاه شدن کد، موارد CRUD را مثل قبل هندل کنید: اضافه کردن به آرایه در fulfilled و آپدیت/حذف)
      .addCase(createEmploymentType.fulfilled, (state, action) => { state.employmentTypes.push(action.payload); })
      .addCase(updateEmploymentType.fulfilled, (state, action) => { const i = state.employmentTypes.findIndex(e => e.id === action.payload.id); if (i !== -1) state.employmentTypes[i] = action.payload; })
      .addCase(deleteEmploymentType.fulfilled, (state, action) => { state.employmentTypes = state.employmentTypes.filter(e => e.id !== action.payload); })
      
      .addCase(createPosition.fulfilled, (state, action) => { state.positions.push(action.payload); })
      .addCase(updatePosition.fulfilled, (state, action) => { const i = state.positions.findIndex(p => p.id === action.payload.id); if (i !== -1) state.positions[i] = action.payload; })
      .addCase(deletePosition.fulfilled, (state, action) => { state.positions = state.positions.filter(p => p.id !== action.payload); })

      .addCase(createSkillLevel.fulfilled, (state, action) => { state.skillLevels.push(action.payload); })
      .addCase(updateSkillLevel.fulfilled, (state, action) => { const i = state.skillLevels.findIndex(s => s.id === action.payload.id); if (i !== -1) state.skillLevels[i] = action.payload; })
      .addCase(deleteSkillLevel.fulfilled, (state, action) => { state.skillLevels = state.skillLevels.filter(s => s.id !== action.payload); })

      .addCase(createLeaveType.fulfilled, (state, action) => { state.leaveTypes.push(action.payload); })
      .addCase(updateLeaveType.fulfilled, (state, action) => { const i = state.leaveTypes.findIndex(l => l.id === action.payload.id); if (i !== -1) state.leaveTypes[i] = action.payload; })
      .addCase(deleteLeaveType.fulfilled, (state, action) => { state.leaveTypes = state.leaveTypes.filter(l => l.id !== action.payload); });
  },
});

export default dropdownsSlice.reducer;
