import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// دریافت لیست روتین‌های من (وظایف ثابت)
export const fetchMyRoutines = createAsyncThunk(
    'routine/fetchMyRoutines',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/routines/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// (اختیاری برای آینده) تغییر وضعیت یک آیتم چک‌لیست
export const toggleRoutineChecklistItem = createAsyncThunk(
    'routine/toggleChecklistItem',
    async (itemId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/routines/checklists/${itemId}/toggle/`);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

const routineSlice = createSlice({
    name: 'routine',
    initialState: {
        routines: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearRoutineError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyRoutines.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyRoutines.fulfilled, (state, action) => {
                state.loading = false;
                state.routines = action.payload;
            })
            .addCase(fetchMyRoutines.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearRoutineError } = routineSlice.actions;
export default routineSlice.reducer;
