import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance'; 

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

export const createNoteEntry = createAsyncThunk(
    'notebook/createNoteEntry', 
    async ({ notebookId, formData }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/notes/notebooks/${notebookId}/entries/`, formData);
            return data;
        } catch (error) { return rejectWithValue(error.response?.data || error.message); }
});

export const createNotebook = createAsyncThunk(
    'notebook/createNotebook', 
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/notes/notebooks/', payload);
            return data;
        } catch (error) { return rejectWithValue(error.response?.data || error.message); }
});

export const updateNotebook = createAsyncThunk(
    'notebook/updateNotebook',
    async ({ notebookId, data }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/notes/notebooks/${notebookId}/manage/`, data);
            return response.data;
        } catch (error) { return rejectWithValue(error.response?.data || error.message); }
    }
);

export const deleteNotebook = createAsyncThunk(
    'notebook/deleteNotebook',
    async (notebookId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/notes/notebooks/${notebookId}/manage/`);
            return notebookId; 
        } catch (error) { return rejectWithValue(error.response?.data || error.message); }
    }
);

export const editNoteEntry = createAsyncThunk(
    'notebook/editNoteEntry',
    async ({ entryId, content }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put(`/notes/entries/${entryId}/`, { content });
            return data;
        } catch (error) { return rejectWithValue(error.response?.data || error.message); }
    }
);

export const deleteNoteEntry = createAsyncThunk(
    'notebook/deleteNoteEntry',
    async (entryId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/notes/entries/${entryId}/`);
            return entryId; 
        } catch (error) { return rejectWithValue(error.response?.data || error.message); }
    }
);

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
                state.notebooks.unshift(action.payload);
            })
            .addCase(updateNotebook.fulfilled, (state, action) => {
                const index = state.notebooks.findIndex(nb => nb.id === action.payload.id);
                if (index !== -1) {
                    state.notebooks[index] = action.payload;
                }
            })
            .addCase(deleteNotebook.fulfilled, (state, action) => {
                state.notebooks = state.notebooks.filter(nb => nb.id !== action.payload);
            })
            .addCase(createNoteEntry.fulfilled, (state, action) => {
                state.currentEntries.push(action.payload);
            })
            .addCase(editNoteEntry.fulfilled, (state, action) => {
                const index = state.currentEntries.findIndex(e => e.id === action.payload.id);
                if (index !== -1) {
                    state.currentEntries[index] = action.payload;
                }
            })
            .addCase(deleteNoteEntry.fulfilled, (state, action) => {
                state.currentEntries = state.currentEntries.filter(e => e.id !== action.payload);
            });
    }
});
export default notebookSlice.reducer;