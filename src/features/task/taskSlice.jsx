// src/features/task/taskSlice.js — کامل نهایی

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// Thunks
// ═══════════════════════════════════════════════════════════
//  1  //
export const fetchMyTaskInbox = createAsyncThunk(
    'task/fetchMyTaskInbox',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/inbox/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);
// 2 //

export const fetchSentTasks = createAsyncThunk(
    'task/fetchSentTasks',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/sent/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);
// 3 //

export const fetchTaskDetail = createAsyncThunk(
    'task/fetchTaskDetail',
    async (taskId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get(`/tasks/${taskId}/`);
            return data; // { task, steps, logs, files }
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);
// 4 // 
export const fetchSubordinates = createAsyncThunk(
    'task/fetchSubordinates',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/subordinates/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);
// 5 //
export const createTask = createAsyncThunk(
    'task/createTask',
    async (payload, { rejectWithValue }) => {
        try {
            // ✅ اگه files داشت FormData بساز، وگرنه JSON معمولی
            let body = payload;
            let headers = {};

            if (payload.files && payload.files.length > 0) {
                const form = new FormData();
                form.append('title',     payload.title);
                form.append('task_type', payload.task_type);
                form.append('note',      payload.note || '');
                form.append('send_sms',  payload.send_sms ? 'true' : 'false');
                payload.assignee_ids.forEach(id => form.append('assignee_ids', id));
                payload.files.forEach(f => form.append('files', f));
                if (payload.project_id) form.append('project_id', payload.project_id);
                body = form;
                headers = {};

            }

            const { data } = await axiosInstance.post('/tasks/create/', body, { headers });
            return data;
        } catch (err) {
            const detail =
                err.response?.data?.detail ||
                JSON.stringify(err.response?.data) ||
                err.message;
            return rejectWithValue(detail);
        }
    }
);

// 6 //

export const uploadTaskFile = createAsyncThunk(
    'task/uploadTaskFile',
    async ({ taskId, file }, { rejectWithValue }) => {
        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await axiosInstance.post(
                `/tasks/${taskId}/upload/`,
                form,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return { taskId, file: data };
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// 7 //

export const forwardStep = createAsyncThunk(
    'task/forwardStep',
    async ({ taskId, to_user_id, note, send_sms }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/tasks/${taskId}/forward/`, {
                to_user_id,
                note,
                send_sms,
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ═══════════════════════════════════════════════════════════
// Slice
// ═══════════════════════════════════════════════════════════

const taskSlice = createSlice({
    name: 'task',
    initialState: {
        inbox:               [],
        loadingInbox:        false,

        sentTasks:           [],
        loadingSent:         false,

        activeTask:          null,   // { task, steps, logs, files }
        loadingDetail:       false,

        subordinates:        [],
        loadingSubordinates: false,

        creating:            false,
        createSuccess:       false,

        uploadingFile:       false,

        error:               null,
        needsInboxRefresh:   false,
        forwarding: false,
    },
    reducers: {
        clearActiveTask: (state) => {
            state.activeTask = null;
        },
        clearCreateSuccess: (state) => {
            state.createSuccess = false;
        },
        clearTaskError: (state) => {
            state.error = null;
        },
        handleTaskInboxEvent: (state, action) => {
            const { event, task_id } = action.payload;
            if (event === 'ASSIGNED') {
                state.needsInboxRefresh = true;
            }
            if (event === 'DONE' || event === 'CANCELLED') {
                state.inbox = state.inbox.filter(t => t.id !== task_id);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // ── inbox ──
            .addCase(fetchMyTaskInbox.pending, (state) => {
                state.loadingInbox      = true;
                state.error             = null;
                state.needsInboxRefresh = false;
            })
            .addCase(fetchMyTaskInbox.fulfilled, (state, action) => {
                state.loadingInbox = false;
                state.inbox        = action.payload;
            })
            .addCase(fetchMyTaskInbox.rejected, (state, action) => {
                state.loadingInbox = false;
                state.error        = action.payload;
            })

            // ── sent ──
            .addCase(fetchSentTasks.pending, (state) => {
                state.loadingSent = true;
                state.error       = null;
            })
            .addCase(fetchSentTasks.fulfilled, (state, action) => {
                state.loadingSent = false;
                state.sentTasks   = action.payload;
            })
            .addCase(fetchSentTasks.rejected, (state, action) => {
                state.loadingSent = false;
                state.error       = action.payload;
            })

            // ── detail ──
            .addCase(fetchTaskDetail.pending, (state) => {
                state.loadingDetail = true;
                state.error         = null;
            })
            .addCase(fetchTaskDetail.fulfilled, (state, action) => {
                state.loadingDetail = false;
                state.activeTask    = action.payload;
            })
            .addCase(fetchTaskDetail.rejected, (state, action) => {
                state.loadingDetail = false;
                state.error         = action.payload;
            })

            // ── subordinates ──
            .addCase(fetchSubordinates.pending, (state) => {
                state.loadingSubordinates = true;
            })
            .addCase(fetchSubordinates.fulfilled, (state, action) => {
                state.loadingSubordinates = false;
                state.subordinates        = action.payload;
            })
            .addCase(fetchSubordinates.rejected, (state, action) => {
                state.loadingSubordinates = false;
                state.error               = action.payload;
            })

            // ── create ──
            .addCase(createTask.pending, (state) => {
                state.creating       = true;
                state.createSuccess  = false;
                state.error          = null;
            })
            .addCase(createTask.fulfilled, (state) => {
                state.creating      = false;
                state.createSuccess = true;
            })
            .addCase(createTask.rejected, (state, action) => {
                state.creating = false;
                state.error    = action.payload;
            })

            // ── upload ──
            .addCase(uploadTaskFile.pending, (state) => {
                state.uploadingFile = true;
                state.error         = null;
            })
            .addCase(uploadTaskFile.fulfilled, (state, action) => {
                state.uploadingFile = false;
                if (state.activeTask) {
                    state.activeTask.files = [
                        action.payload.file,
                        ...(state.activeTask.files || []),
                    ];
                }
            })
            .addCase(uploadTaskFile.rejected, (state, action) => {
                state.uploadingFile = false;
                state.error         = action.payload;
            })
            // ── forward ──
            .addCase(forwardStep.pending, (state) => {
                state.forwarding = true;
                state.error      = null;
            })
            .addCase(forwardStep.fulfilled, (state) => {
                state.forwarding = false;
            })
            .addCase(forwardStep.rejected, (state, action) => {
                state.forwarding = false;
                state.error      = action.payload;
            });
    },
});

export const {
    clearActiveTask,
    clearCreateSuccess,
    clearTaskError,
    handleTaskInboxEvent,
} = taskSlice.actions;

export default taskSlice.reducer;
