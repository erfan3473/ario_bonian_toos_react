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

export const approveLetter = createAsyncThunk('secretariat/approveLetter', async ({ letterId, payload }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/approve/`, payload);
        return data;
    } catch (err) { 
        return rejectWithValue(err.response?.data?.detail || err.message); 
    }
});

// 🚀 اکشن واکشی لیست پیامک‌های نامه
export const fetchLetterSmsLogs = createAsyncThunk('secretariat/fetchLetterSmsLogs', async (letterId, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get(`/secretariat/${letterId}/sms-logs/`);
        return data;
    } catch (err) { 
        return rejectWithValue(err.response?.data?.detail || err.message); 
    }
});

// 🚀 اکشن استعلام وضعیت یک پیامک
export const refreshLetterSmsStatus = createAsyncThunk('secretariat/refreshLetterSmsStatus', async (logId, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/sms-logs/refresh/`, { log_id: logId });
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
        
        // 🚀 استیت‌های مربوط به لاگ پیامک‌ها
        smsLogs: [], loadingSmsLogs: false, refreshingSms: false,
    },
    reducers: {
        clearActiveLetter: (state) => { state.activeLetter = null; state.smsLogs = []; },
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
            
            .addCase(uploadAttachment.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(signLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(approveLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; })

            // 🚀 مدیریت استیت‌های مربوط به پیامک
            .addCase(fetchLetterSmsLogs.pending, (state) => { state.loadingSmsLogs = true; })
            .addCase(fetchLetterSmsLogs.fulfilled, (state, action) => { state.loadingSmsLogs = false; state.smsLogs = action.payload; })
            .addCase(fetchLetterSmsLogs.rejected, (state) => { state.loadingSmsLogs = false; })
            
            // 🚀 جایگزینی لاگِ آپدیت شده در لیست پیامک‌ها بعد از رفرش
            .addCase(refreshLetterSmsStatus.pending, (state) => { state.refreshingSms = true; })
            .addCase(refreshLetterSmsStatus.fulfilled, (state, action) => {
                state.refreshingSms = false;
                const updatedLog = action.payload;
                const index = state.smsLogs.findIndex(log => log.id === updatedLog.id);
                if (index !== -1) {
                    state.smsLogs[index] = { ...state.smsLogs[index], ...updatedLog };
                }
            })
            .addCase(refreshLetterSmsStatus.rejected, (state) => { state.refreshingSms = false; });
    }
});

export const { clearActiveLetter, clearCreateSuccess, clearSecretariatError } = secretariatSlice.actions;
export default secretariatSlice.reducer;