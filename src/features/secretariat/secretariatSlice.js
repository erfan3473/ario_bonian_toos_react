import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchLetters = createAsyncThunk('secretariat/fetchLetters', async (params, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/', { params });
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const fetchLetterDetail = createAsyncThunk('secretariat/fetchLetterDetail', async (letterId, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get(`/secretariat/${letterId}/`);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const createLetter = createAsyncThunk('secretariat/createLetter', async (payload, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post('/secretariat/create/', payload);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const forwardLetter = createAsyncThunk('secretariat/forwardLetter', async ({ letterId, payload }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/forward/`, payload);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const fetchCartable = createAsyncThunk('secretariat/fetchCartable', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/cartable/');
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const fetchAllPersonnel = createAsyncThunk('secretariat/fetchAllPersonnel', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/personnel/');
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const fetchOrganizations = createAsyncThunk('secretariat/fetchOrganizations', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/organizations/');
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const uploadAttachment = createAsyncThunk('secretariat/uploadAttachment', async ({ letterId, file }, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/upload/`, formData);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const signLetter = createAsyncThunk('secretariat/signLetter', async ({ letterId, signature }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/sign/`, { signature });
        return data; 
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const updateLetter = createAsyncThunk('secretariat/updateLetter', async ({ id, payload }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.put(`/secretariat/${id}/update/`, payload);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const deleteLetter = createAsyncThunk('secretariat/deleteLetter', async (id, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.delete(`/secretariat/${id}/delete/`);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

// 🚀 اکشن جدید برای تایید یا رد نامه توسط مدیر
export const approveLetter = createAsyncThunk('secretariat/approveLetter', async ({ letterId, payload }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/approve/`, payload);
        return data;
    } catch (err) { 
        return rejectWithValue(err.response?.data?.detail || err.message); 
    }
});

const secretariatSlice = createSlice({
    name: 'secretariat',
    initialState: {
        letters: [], loadingList: false, activeLetter: null, loadingDetail: false,
        cartableItems: [], loadingCartable: false, 
        allPersonnel: [], loadingPersonnel: false,
        organizations: [], loadingOrganizations: false, 
        creating: false, createSuccess: false, forwarding: false, error: null,
    },
    reducers: {
        clearActiveLetter: (state) => { state.activeLetter = null; },
        clearCreateSuccess: (state) => { state.createSuccess = false; },
        clearSecretariatError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLetters.pending, (state) => { state.loadingList = true; state.error = null; })
            .addCase(fetchLetters.fulfilled, (state, action) => { state.loadingList = false; state.letters = action.payload; })
            .addCase(fetchLetters.rejected, (state, action) => { state.loadingList = false; state.error = action.payload; })
            
            .addCase(fetchLetterDetail.pending, (state) => { state.loadingDetail = true; state.error = null; })
            .addCase(fetchLetterDetail.fulfilled, (state, action) => { state.loadingDetail = false; state.activeLetter = action.payload; })
            .addCase(fetchLetterDetail.rejected, (state, action) => { state.loadingDetail = false; state.error = action.payload; })
            
            .addCase(createLetter.pending, (state) => { state.creating = true; state.createSuccess = false; state.error = null; })
            .addCase(createLetter.fulfilled, (state) => { state.creating = false; state.createSuccess = true; })
            .addCase(createLetter.rejected, (state, action) => { state.creating = false; state.error = action.payload; })
            
            .addCase(fetchAllPersonnel.fulfilled, (state, action) => { state.allPersonnel = action.payload; })
            
            .addCase(fetchOrganizations.pending, (state) => { state.loadingOrganizations = true; })
            .addCase(fetchOrganizations.fulfilled, (state, action) => { state.loadingOrganizations = false; state.organizations = action.payload; })
            .addCase(fetchOrganizations.rejected, (state, action) => { state.loadingOrganizations = false; })
            
            // آپدیت نامه در لحظه در استیت
            .addCase(uploadAttachment.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(signLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            // 🚀 آپدیت وضعیت نامه بعد از تایید/رد
            .addCase(approveLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; });
    }
});

export const { clearActiveLetter, clearCreateSuccess, clearSecretariatError } = secretariatSlice.actions;
export default secretariatSlice.reducer;