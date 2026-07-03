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
                if (payload.deadline) form.append('deadline', payload.deadline);
                if (payload.urgency) form.append('urgency', payload.urgency);
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

// 8 //

export const refreshSmsStatus = createAsyncThunk(
    'task/refreshSmsStatus',
    async (logId, { rejectWithValue }) => {
        try {
            // آپدیت مسیر بر اساس بک‌اند جدید شما
            const response = await axiosInstance.post(`/tasks/sms-logs/${logId}/refresh/`);
            return response.data; // دیتای یک لاگ پیامک برمی‌گردد
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'خطا در بروزرسانی وضعیت پیامک');
        }
    }
);

// 9 // دریافت تنظیمات یادآوری
export const fetchReminderSettings = createAsyncThunk(
    'task/fetchReminderSettings',
    async (_, { rejectWithValue }) => {
        try {
            // ⚠️ مسیر زیر را با URL دقیق urls.py خود هماهنگ کنید
            const { data } = await axiosInstance.get('/tasks/reminder-settings/');
            return data; // آرایه‌ای از تنظیمات برمی‌گردد
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// 10 // به‌روزرسانی گروهی تنظیمات یادآوری
export const updateReminderSettings = createAsyncThunk(
    'task/updateReminderSettings',
    async (payload, { rejectWithValue }) => {
        try {
            // payload باید یک آرایه از آبجکت‌های تنظیمات باشد
            // ⚠️ مسیر زیر را با URL دقیق urls.py خود هماهنگ کنید
            const { data } = await axiosInstance.put('/tasks/reminder-settings/', payload);
            return data; // پیام موفقیت برمی‌گردد
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.error || 
                err.response?.data?.detail || 
                'خطا در ذخیره تنظیمات'
            );
        }
    }
);
//11//ثبت یادداشت / فایل روی task
//11//ثبت یادداشت / فایل روی task
export const addTaskComment = createAsyncThunk(
    'task/addTaskComment',
    async ({ taskId, note, files }, { rejectWithValue }) => {
        try {
            let body;
            let config = {}; // هدرها بر اساس وجود یا عدم وجود فایل تنظیم می‌شوند

            const hasFiles = files && files.length > 0;

            if (hasFiles) {
                body = new FormData();
                if (note) body.append('note', note);
                files.forEach(f => body.append('files', f));
                
                // تنظیم هدر مالتی‌پارت برای ارسال صحیح فایل‌ها به جنگو
                config = { headers: { 'Content-Type': 'multipart/form-data' } };
            } else {
                body = { note };
            }

            const { data } = await axiosInstance.post(
                `/tasks/${taskId}/comment/`,
                body,
                config // پاس دادن هدرها و تنظیمات به ریکوئست
            );
            return data; // { log, files }
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.detail || 'خطا در ثبت یادداشت'
            );
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
        refreshingSms: false,

        reminderSettings: [],
        loadingReminderSettings: false,
        updatingReminderSettings: false,
        addingComment: false,
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
            })
            .addCase(refreshSmsStatus.pending, (state) => {
                state.refreshingSms = true;
            })
            .addCase(refreshSmsStatus.fulfilled, (state, action) => {
                state.refreshingSms = false;
                
                // بک‌اند یک آبجکت تکی پیامک را برگردانده است
                const updatedSms = action.payload; 
                
                if (state.activeTask) {
                    // ۱. جستجو و آپدیت در پیامک‌های ارجاع/ایجاد
                    if (state.activeTask.assign_sms_logs) {
                        const idx = state.activeTask.assign_sms_logs.findIndex(sms => sms.id === updatedSms.id);
                        if (idx !== -1) state.activeTask.assign_sms_logs[idx] = updatedSms;
                    }
                    // ۲. جستجو و آپدیت در پیامک‌های یادآوری
                    if (state.activeTask.reminder_sms_logs) {
                        const idx = state.activeTask.reminder_sms_logs.findIndex(sms => sms.id === updatedSms.id);
                        if (idx !== -1) state.activeTask.reminder_sms_logs[idx] = updatedSms;
                    }
                }
            })
            .addCase(refreshSmsStatus.rejected, (state, action) => {
                state.refreshingSms = false;
                // در صورت نیاز نمایش ارور
            })
            // ── Reminder Settings ──
            .addCase(fetchReminderSettings.pending, (state) => {
                state.loadingReminderSettings = true;
                state.error = null;
            })
            .addCase(fetchReminderSettings.fulfilled, (state, action) => {
                state.loadingReminderSettings = false;
                state.reminderSettings = action.payload;
            })
            .addCase(fetchReminderSettings.rejected, (state, action) => {
                state.loadingReminderSettings = false;
                state.error = action.payload;
            })
            
            .addCase(updateReminderSettings.pending, (state) => {
                state.updatingReminderSettings = true;
                state.error = null;
            })
            .addCase(updateReminderSettings.fulfilled, (state) => {
                state.updatingReminderSettings = false;
                // ویوی بک‌اند شما بعد از آپدیت، یک آبجکت message برمی‌گرداند.
                // آپدیت شدن لیست معمولاً با فراخوانی مجدد fetchReminderSettings در خود کامپوننت انجام می‌شود.
            })
            .addCase(updateReminderSettings.rejected, (state, action) => {
                state.updatingReminderSettings = false;
                state.error = action.payload;
            })
            //── comment──
            .addCase(addTaskComment.pending, (state) => {
                state.addingComment = true;
                state.error = null;
            })
            .addCase(addTaskComment.fulfilled, (state, action) => {
                state.addingComment = false;
                if (state.activeTask) {
                    // ادغام فایل‌های جدید برگشتی از بک‌اند با آبجکت لاگِ سیستم
                    const newLogWithFiles = {
                        ...action.payload.log,
                        files: action.payload.files || []
                    };

                    // اضافه کردن لاگ جدیدِ حاوی فایل به آرایه تاریخچه‌ها
                    state.activeTask.logs = [
                        ...(state.activeTask.logs || []),
                        newLogWithFiles,
                    ];

                    // توجه: فایل‌ها رو به state.activeTask.files اضافه نمی‌کنیم، 
                    // چون این فایل‌ها متعلق به کامنت هستند و باید اختصاصی زیر خودِ یادداشت نمایش داده بشن.
                }
            })
            .addCase(addTaskComment.rejected, (state, action) => {
                state.addingComment = false;
                state.error = action.payload;
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
