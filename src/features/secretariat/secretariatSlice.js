import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchLetters = createAsyncThunk('secretariat/fetchLetters', async (params, { rejectWithValue, signal }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/', { params, signal });
        return data;
    } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
            throw err;
        }
        return rejectWithValue(err.response?.data?.detail || err.message);
    }
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

export const fetchLetterSmsLogs = createAsyncThunk('secretariat/fetchLetterSmsLogs', async (letterId, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get(`/secretariat/${letterId}/sms-logs/`);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.detail || err.message);
    }
});

export const refreshLetterSmsStatus = createAsyncThunk('secretariat/refreshLetterSmsStatus', async (logId, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/sms-logs/refresh/`, { log_id: logId });
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.detail || err.message);
    }
});

export const registerDestination = createAsyncThunk('secretariat/registerDestination', async ({ letterId, payload }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/register-destination/`, payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.detail || err.message);
    }
});

export const issueLetter = createAsyncThunk('secretariat/issueLetter', async ({ letterId, payload }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/issue/`, payload);
        return data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.detail || err.message);
    }
});

export const fetchLetterTypeSmsSettings = createAsyncThunk('secretariat/fetchLetterTypeSmsSettings', async (type, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/sms-type-settings/', { params: { type } });
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const updateLetterTypeSmsSettings = createAsyncThunk('secretariat/updateLetterTypeSmsSettings', async (payload, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post('/secretariat/sms-type-settings/', payload);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const deleteAttachment = createAsyncThunk('secretariat/deleteAttachment', async ({ letterId, attachmentId }, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.delete(`/secretariat/${letterId}/attachments/${attachmentId}/delete/`);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const replaceAttachment = createAsyncThunk('secretariat/replaceAttachment', async ({ letterId, attachmentId, file }, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axiosInstance.post(`/secretariat/${letterId}/attachments/${attachmentId}/replace/`, formData);
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

export const fetchReferenceOptions = createAsyncThunk('secretariat/fetchReferenceOptions', async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get('/secretariat/reference-options/');
        return data;
    } catch (err) { return rejectWithValue(err.response?.data?.detail || err.message); }
});

const secretariatSlice = createSlice({
    name: 'secretariat',
    initialState: {
        letters: [],
        loadingList: false,
        currentListRequestId: null,
        activeLetter: null,
        loadingDetail: false,
        cartableItems: [],
        loadingCartable: false,
        allPersonnel: [],
        loadingPersonnel: false,
        organizations: [],
        loadingOrganizations: false,
        referenceOptions: [],
        loadingReferenceOptions: false,
        creating: false,
        createSuccess: false,
        forwarding: false,
        error: null,
        smsLogs: [],
        loadingSmsLogs: false,
        refreshingSms: false,
    },
    reducers: {
        clearActiveLetter: (state) => { state.activeLetter = null; state.smsLogs = []; },
        clearCreateSuccess: (state) => { state.createSuccess = false; },
        clearSecretariatError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLetters.pending, (state, action) => {
                state.loadingList = true;
                state.error = null;
                state.currentListRequestId = action.meta.requestId;
            })
            .addCase(fetchLetters.fulfilled, (state, action) => {
                if (state.currentListRequestId !== action.meta.requestId) return;
                state.loadingList = false;
                state.letters = action.payload;
            })
            .addCase(fetchLetters.rejected, (state, action) => {
                if (action.meta.aborted || state.currentListRequestId !== action.meta.requestId) return;
                state.loadingList = false;
                state.error = action.payload;
            })

            .addCase(fetchLetterDetail.pending, (state) => { state.loadingDetail = true; state.error = null; })
            .addCase(fetchLetterDetail.fulfilled, (state, action) => { state.loadingDetail = false; state.activeLetter = action.payload; })
            .addCase(fetchLetterDetail.rejected, (state, action) => { state.loadingDetail = false; state.error = action.payload; })

            .addCase(createLetter.pending, (state) => { state.creating = true; state.createSuccess = false; state.error = null; })
            .addCase(createLetter.fulfilled, (state) => { state.creating = false; state.createSuccess = true; })
            .addCase(createLetter.rejected, (state, action) => { state.creating = false; state.error = action.payload; })

            .addCase(fetchAllPersonnel.fulfilled, (state, action) => { state.allPersonnel = action.payload; })

            .addCase(fetchOrganizations.pending, (state) => { state.loadingOrganizations = true; })
            .addCase(fetchOrganizations.fulfilled, (state, action) => { state.loadingOrganizations = false; state.organizations = action.payload; })
            .addCase(fetchOrganizations.rejected, (state) => { state.loadingOrganizations = false; })

            .addCase(uploadAttachment.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(deleteAttachment.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(replaceAttachment.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(signLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(approveLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; })

            .addCase(fetchLetterSmsLogs.pending, (state) => { state.loadingSmsLogs = true; })
            .addCase(fetchLetterSmsLogs.fulfilled, (state, action) => { state.loadingSmsLogs = false; state.smsLogs = action.payload; })
            .addCase(fetchLetterSmsLogs.rejected, (state) => { state.loadingSmsLogs = false; })

            .addCase(refreshLetterSmsStatus.pending, (state) => { state.refreshingSms = true; })
            .addCase(refreshLetterSmsStatus.fulfilled, (state, action) => {
                state.refreshingSms = false;
                const updatedLog = action.payload;
                const index = state.smsLogs.findIndex(log => log.id === updatedLog.id);
                if (index !== -1) {
                    state.smsLogs[index] = { ...state.smsLogs[index], ...updatedLog };
                }
            })
            .addCase(refreshLetterSmsStatus.rejected, (state) => { state.refreshingSms = false; })
            .addCase(registerDestination.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(issueLetter.fulfilled, (state, action) => { state.activeLetter = action.payload; })
            .addCase(fetchReferenceOptions.pending, (state) => { state.loadingReferenceOptions = true; })
            .addCase(fetchReferenceOptions.fulfilled, (state, action) => { state.loadingReferenceOptions = false; state.referenceOptions = action.payload; })
            .addCase(fetchReferenceOptions.rejected, (state) => { state.loadingReferenceOptions = false; });
    }
});

export const { clearActiveLetter, clearCreateSuccess, clearSecretariatError } = secretariatSlice.actions;
export default secretariatSlice.reducer;