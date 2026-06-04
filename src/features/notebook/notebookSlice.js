import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; // مسیر را چک کنید

export const fetchNotebooks = createAsyncThunk('notebook/fetchNotebooks', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/notes/notebooks/');
        return data;
    } catch (error) { return rejectWithValue(error.response?.data || error.message); }
});

export const fetchNoteEntries = createAsyncThunk('notebook/fetchNoteEntries', async (notebookId, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get(`/notes/notebooks/${notebookId}/entries/`);
        return data;
    } catch (error) { return rejectWithValue(error.response?.data || error.message); }
});

// اکشن جدید برای ارسال یادداشت به بک‌اند
export const createNoteEntry = createAsyncThunk(
    'notebook/createNoteEntry', 
    async ({ notebookId, formData }, { rejectWithValue }) => {
        try {
            // حالا formData رو مستقیم به اکسیوس میدیم
            const { data } = await axiosInstance.post(`/notes/notebooks/${notebookId}/entries/`, formData);
            return data;
        } catch (error) { 
            return rejectWithValue(error.response?.data || error.message); 
        }
});
export const createNotebook = createAsyncThunk(
    'notebook/createNotebook', 
    async (title, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/notes/notebooks/', { title });
            return data;
        } catch (error) { 
            return rejectWithValue(error.response?.data || error.message); 
        }
});
const notebookSlice = createSlice({
    name: 'notebook',
    initialState: { notebooks: [], currentEntries: [], loading: false, error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotebooks.pending, (state) => { state.loading = true; })
            .addCase(fetchNotebooks.fulfilled, (state, action) => { 
                state.loading = false; 
                state.notebooks = action.payload; 
            })
            .addCase(fetchNotebooks.rejected, (state, action) => { 
                state.loading = false; 
                state.error = action.payload; 
            })
            .addCase(fetchNoteEntries.fulfilled, (state, action) => { 
                state.currentEntries = action.payload; 
            })
            .addCase(createNotebook.fulfilled, (state, action) => {
                // اضافه کردن به ابتدای لیست
                state.notebooks.unshift(action.payload);
            })
            // وقتی پیام با موفقیت در بک‌اند ثبت شد، به لیست فعلی اضافه‌اش می‌کنیم
            .addCase(createNoteEntry.fulfilled, (state, action) => {
                state.currentEntries.push(action.payload);
            });
    }
});
export default notebookSlice.reducer;
