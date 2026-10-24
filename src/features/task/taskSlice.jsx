// src/features/task/taskSlice.js — کامل و بهینه‌سازی شده برای آپدیت آنی قالب‌ها

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// Thunks
// ═══════════════════════════════════════════════════════════

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

export const fetchTaskDetail = createAsyncThunk(
    'task/fetchTaskDetail',
    async (taskId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get(`/tasks/${taskId}/`);
            return data; 
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

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

export const createTask = createAsyncThunk(
    'task/createTask',
    async (payload, { rejectWithValue }) => {
        try {
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
                if (payload.project_id) form.append('project_id', payload.project_id);

                if (payload.assignee_ids) {
                    payload.assignee_ids.forEach(id => form.append('assignee_ids', id));
                }

                if (payload.workflow_stages && payload.workflow_stages.length > 0) {
                    form.append('workflow_stages', JSON.stringify(payload.workflow_stages));
                }

                payload.files.forEach(f => form.append('files', f));
                body = form;
            }

            const { data } = await axiosInstance.post('/tasks/create/', body, { headers });
            return data;
        } catch (err) {
            const detail = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
            return rejectWithValue(detail);
        }
    }
);

export const editTask = createAsyncThunk(
    'task/editTask',
    async ({ taskId, payload }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(`/tasks/${taskId}/edit/`, payload);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

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

export const refreshSmsStatus = createAsyncThunk(
    'task/refreshSmsStatus',
    async (logId, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(`/tasks/sms-logs/${logId}/refresh/`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || 'خطا در بروزرسانی وضعیت پیامک');
        }
    }
);

export const fetchReminderSettings = createAsyncThunk(
    'task/fetchReminderSettings',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/reminder-settings/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const updateReminderSettings = createAsyncThunk(
    'task/updateReminderSettings',
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put('/tasks/reminder-settings/', payload);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || err.response?.data?.detail || 'خطا در ذخیره تنظیمات');
        }
    }
);

export const addTaskComment = createAsyncThunk(
    'task/addTaskComment',
    async ({ taskId, note, files }, { rejectWithValue }) => {
        try {
            let body;
            let config = {}; 
            const hasFiles = files && files.length > 0;

            if (hasFiles) {
                body = new FormData();
                if (note) body.append('note', note);
                files.forEach(f => body.append('files', f));
                config = { headers: { 'Content-Type': 'multipart/form-data' } };
            } else {
                body = { note };
            }

            const { data } = await axiosInstance.post(`/tasks/${taskId}/comment/`, body, config);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || 'خطا در ثبت یادداشت');
        }
    }
);

export const fetchTaskTypes = createAsyncThunk(
    'task/fetchTaskTypes',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/types/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const createTaskType = createAsyncThunk(
    'task/createTaskType',
    async (label, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/tasks/types/create/', { label });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const deleteTaskType = createAsyncThunk(
    'task/deleteTaskType',
    async (typeId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/tasks/types/${typeId}/delete/`);
            return typeId; 
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const returnTaskStep = createAsyncThunk(
    'task/returnTaskStep',
    async ({ taskId, target_user_ids, note }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/tasks/${taskId}/return/`, {
                target_ids: target_user_ids, 
                note
            });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const freezeTaskTemplate = createAsyncThunk(
    'task/freezeTaskTemplate',
    async ({ templateName, templateData, isGlobal }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/tasks/freeze-templates/', {
                template_name: templateName,
                template_data: templateData,
                is_global: isGlobal
            });
            return data; // فرض بر این است که دیتای قالب ایجاد شده (شامل id) را برمی‌گرداند
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const fetchTaskTemplates = createAsyncThunk(
    'task/fetchTaskTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/freeze-templates/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const deleteTaskTemplate = createAsyncThunk(
    'task/deleteTaskTemplate',
    async (templateId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/tasks/freeze-templates/${templateId}/delete/`);
            return templateId; 
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const fetchAllTasksAdmin = createAsyncThunk(
    'task/fetchAllTasksAdmin',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/tasks/all/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const deleteTask = createAsyncThunk(
    'task/deleteTask',
    async (taskId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/tasks/${taskId}/delete/`);
            return taskId;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);


export const updateTaskTemplate = createAsyncThunk(
    'task/updateTaskTemplate',
    async ({ templateId, payload }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put(`/tasks/freeze-templates/${templateId}/edit/`, payload);
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
        activeTask:          null,   
        loadingDetail:       false,
        returning:           false,
        subordinates:        [],
        loadingSubordinates: false,
        taskTypes:           [],     
        loadingTypes:        false,   
        creating:            false,
        createSuccess:       false,
        editingTask:         false, 
        uploadingFile:       false,
        error:               null,
        needsInboxRefresh:   false,
        forwarding:          false,
        refreshingSms:       false,
        reminderSettings:    [],
        loadingReminderSettings: false,
        updatingReminderSettings: false,
        addingComment:       false,
        freezingTemplate:    false,
        templates:           [],
        loadingTemplates:    false,
        allTasks:            [],
        loadingAllTasks:     false,
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
            .addCase(fetchAllTasksAdmin.pending, (state) => {
                state.loadingAllTasks = true;
                state.error = null;
            })
            .addCase(fetchAllTasksAdmin.fulfilled, (state, action) => {
                state.loadingAllTasks = false;
                state.allTasks = action.payload;
            })
            .addCase(fetchAllTasksAdmin.rejected, (state, action) => {
                state.loadingAllTasks = false;
                state.error = action.payload;
            })
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
            .addCase(editTask.pending, (state) => {
                state.editingTask = true;
                state.error = null;
            })
            .addCase(editTask.fulfilled, (state) => {
                state.editingTask = false;
            })
            .addCase(editTask.rejected, (state, action) => {
                state.editingTask = false;
                state.error = action.payload;
            })
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
                const updatedSms = action.payload; 
                if (state.activeTask) {
                    if (state.activeTask.assign_sms_logs) {
                        const idx = state.activeTask.assign_sms_logs.findIndex(sms => sms.id === updatedSms.id);
                        if (idx !== -1) state.activeTask.assign_sms_logs[idx] = updatedSms;
                    }
                    if (state.activeTask.reminder_sms_logs) {
                        const idx = state.activeTask.reminder_sms_logs.findIndex(sms => sms.id === updatedSms.id);
                        if (idx !== -1) state.activeTask.reminder_sms_logs[idx] = updatedSms;
                    }
                }
            })
            .addCase(refreshSmsStatus.rejected, (state) => {
                state.refreshingSms = false;
            })
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
            })
            .addCase(updateReminderSettings.rejected, (state, action) => {
                state.updatingReminderSettings = false;
                state.error = action.payload;
            })
            .addCase(addTaskComment.pending, (state) => {
                state.addingComment = true;
                state.error = null;
            })
            .addCase(addTaskComment.fulfilled, (state, action) => {
                state.addingComment = false;
                if (state.activeTask) {
                    const newLog = action.payload;
                    state.activeTask.logs = [
                        newLog,
                        ...(state.activeTask.logs || [])
                    ];
                }
            })
            .addCase(addTaskComment.rejected, (state, action) => {
                state.addingComment = false;
                state.error = action.payload;
            })
            .addCase(fetchTaskTypes.pending, (state) => {
                state.loadingTypes = true;
                state.error = null;
            })
            .addCase(fetchTaskTypes.fulfilled, (state, action) => {
                state.loadingTypes = false;
                state.taskTypes = action.payload;
            })
            .addCase(fetchTaskTypes.rejected, (state, action) => {
                state.loadingTypes = false;
                state.error = action.payload;
            })
            .addCase(createTaskType.fulfilled, (state, action) => {
                state.taskTypes.push(action.payload); 
            })
            .addCase(deleteTaskType.fulfilled, (state, action) => {
                state.taskTypes = state.taskTypes.filter(t => t.id !== action.payload);
            })
            .addCase(returnTaskStep.pending, (state) => {
                state.returning = true;
                state.error     = null;
            })
            .addCase(returnTaskStep.fulfilled, (state) => {
                state.returning = false;
            })
            .addCase(returnTaskStep.rejected, (state, action) => {
                state.returning = false;
                state.error     = action.payload;
            })
            // ── templates (تیره‌سازی آپدیت آنی) ──
            .addCase(freezeTaskTemplate.pending, (state) => {
                state.freezingTemplate = true;
                state.error = null;
            })
            .addCase(freezeTaskTemplate.fulfilled, (state, action) => {
                state.freezingTemplate = false;
                // اضافه کردن قالب جدید بلافاصله به لیست برای نمایش در دراپ‌دان بدون نیاز به رفرش
                if (action.payload) {
                    state.templates.unshift(action.payload);
                }
            })
            .addCase(freezeTaskTemplate.rejected, (state, action) => {
                state.freezingTemplate = false;
                state.error = action.payload;
            })
            .addCase(fetchTaskTemplates.pending, (state) => {
                state.loadingTemplates = true;
                state.error = null;
            })
            .addCase(fetchTaskTemplates.fulfilled, (state, action) => {
                state.loadingTemplates = false;
                state.templates = action.payload;
            })
            .addCase(fetchTaskTemplates.rejected, (state, action) => {
                state.loadingTemplates = false;
                state.error = action.payload;
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                const deletedId = action.payload;
                if (state.allTasks) {
                    state.allTasks = state.allTasks.filter(t => t.id !== deletedId);
                }
                if (state.inbox) {
                    state.inbox = state.inbox.filter(t => t.id !== deletedId);
                }
                if (state.sentTasks) {
                    state.sentTasks = state.sentTasks.filter(t => t.id !== deletedId);
                }
            })
            .addCase(updateTaskTemplate.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.templates.findIndex(t => t.id === updated.id);
                if (index !== -1) {
                    state.templates[index] = { ...state.templates[index], ...updated };
                }
            })
            .addCase(deleteTaskTemplate.fulfilled, (state, action) => {
                state.templates = state.templates.filter(t => t.id !== action.payload);
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