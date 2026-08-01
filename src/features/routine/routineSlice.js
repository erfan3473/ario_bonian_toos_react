import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ─── دریافت کارتابل روزانه ───
export const fetchDailyRoutines = createAsyncThunk(
    'routine/fetchDailyRoutines',
    async (date, thunkAPI) => {
        try {
            const url = date ? `/routines/daily/?date=${date}` : `/routines/daily/`;
            const { data } = await axiosInstance.get(url);
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── دریافت کارتابل کل هفته ───
export const fetchWeeklyPlannerRoutines = createAsyncThunk(
    'routine/fetchWeeklyPlannerRoutines',
    async ({ startDate, endDate }, thunkAPI) => {
        try {
            const { data } = await axiosInstance.get(`/routines/inbox/weekly/?start_date=${startDate}&end_date=${endDate}`);
            return data; 
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── تیک زدن یا برداشتن تیک آیتم چک‌لیست ───
export const toggleRoutineItem = createAsyncThunk(
    'routine/toggleRoutineItem',
    async (itemId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/routines/items/${itemId}/toggle/`);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── جابجایی آیتم چک‌لیست در بورد هفتگی ───
export const moveRoutineItem = createAsyncThunk(
    'routine/moveRoutineItem',
    async ({ itemId, date, time_block }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.patch(
                `/routines/items/${itemId}/move/`,
                { date, time_block }
            );
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── دریافت لیست الگوهای گردش کار ───
export const fetchTemplates = createAsyncThunk(
    'routine/fetchTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/routines/templates/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── ایجاد الگوی گردش کار جدید ───
export const createTemplate = createAsyncThunk(
    'routine/createTemplate',
    async (templateData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/routines/templates/create/', templateData);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── ویرایش الگوی گردش کار ───
export const updateTemplate = createAsyncThunk(
    'routine/updateTemplate',
    async ({ id, templateData }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put(`/routines/templates/${id}/`, templateData);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── حذف الگوی گردش کار ───
export const deleteTemplate = createAsyncThunk(
    'routine/deleteTemplate',
    async (id, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/routines/templates/${id}/`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── دریافت لیست پوزیشن‌ها ───
export const fetchSelectorPositions = createAsyncThunk(
    'routine/fetchSelectorPositions',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/routines/selectors/positions/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── دریافت لیست کاربران ───
export const fetchSelectorUsers = createAsyncThunk(
    'routine/fetchSelectorUsers',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/routines/selectors/users/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

// ─── دریافت تایم‌باکس‌های شخصی کاربر ───
export const fetchUserTimeBlocks = createAsyncThunk(
    'routine/fetchUserTimeBlocks',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/routines/time-blocks/');
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── نصف کردن هوشمند تایم‌باکس ───
export const splitUserTimeBlock = createAsyncThunk(
    'routine/splitUserTimeBlock',
    async (blockId, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(`/routines/time-blocks/${blockId}/split/`);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── ویرایش تایم‌باکس (عنوان و زمان) ───
export const updateUserTimeBlock = createAsyncThunk(
    'routine/updateUserTimeBlock',
    async ({ id, ...data }, { rejectWithValue }) => {
        try {
            const { data: responseData } = await axiosInstance.patch(`/routines/time-blocks/${id}/`, data);
            return responseData;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── ویرایش همزمان خط مرزی دو تایم‌باکس متصل (Drag Resize) ───
export const updateTimeBlockBoundary = createAsyncThunk(
    'routine/updateTimeBlockBoundary',
    async ({ upperBlockId, lowerBlockId, newTime }, { rejectWithValue }) => {
        try {
            const [upperRes, lowerRes] = await Promise.all([
                axiosInstance.patch(`/routines/time-blocks/${upperBlockId}/`, { end_time: newTime }),
                axiosInstance.patch(`/routines/time-blocks/${lowerBlockId}/`, { start_time: newTime })
            ]);
            return { upperData: upperRes.data, lowerData: lowerRes.data };
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

// ─── حذف بازه زمانی (تایم‌باکس) ───
export const deleteUserTimeBlock = createAsyncThunk(
    'routine/deleteUserTimeBlock',
    async (blockId, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/routines/time-blocks/${blockId}/`);
            return blockId; 
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
        }
    }
);

export const fetchDifficultySettings = createAsyncThunk(
    'routine/fetchDifficultySettings',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.get('/routines/difficulty-settings/');
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const updateDifficultySettings = createAsyncThunk(
    'routine/updateDifficultySettings',
    async (settingsData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put('/routines/difficulty-settings/', settingsData);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || err.message);
        }
    }
);

export const quickAddRoutine = createAsyncThunk(
    'routine/quickAddRoutine',
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post('/routines/quick-add/', payload);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.detail || 'خطا در افزودن سریع روتین');
        }
    }
);

const routineSlice = createSlice({
    name: 'routine',
    initialState: {
        dailyRoutines: [],
        weeklyRoutines: {}, 
        templates: [], 
        selectorPositions: [], 
        selectorUsers: [],     
        loading: false, 
        weeklyLoading: false, 
        templateLoading: false, 
        selectorLoading: false, 
        toggleLoadingId: null, 
        error: null,
        timeBlocks: [],
        timeBlockLoading: false,
        difficultySettings: [],
        difficultyLoading: false,
    },
    reducers: {
        clearRoutineError: (state) => {
            state.error = null;
        },
        optimisticMoveItem: (state, action) => {
            const { itemId, sourceDate, destDate, destBlock } = action.payload;
            
            let sourceRoutine = null;
            let movedItem = null;

            if (state.weeklyRoutines[sourceDate]) {
                for (let routine of state.weeklyRoutines[sourceDate]) {
                    if (!routine.items) continue;
                    const itemIndex = routine.items.findIndex(i => i.id === itemId);
                    
                    if (itemIndex > -1) {
                        sourceRoutine = routine;
                        movedItem = { ...routine.items[itemIndex] };
                        movedItem.time_block = destBlock === 'UNASSIGNED' ? null : destBlock;
                        routine.items.splice(itemIndex, 1);
                        break;
                    }
                }
            }

            if (!movedItem || !sourceRoutine) return;

            if (!state.weeklyRoutines[destDate]) {
                state.weeklyRoutines[destDate] = [];
            }

            let destRoutine = state.weeklyRoutines[destDate].find(
                r => r.template_details?.id === sourceRoutine.template_details?.id
            );

            if (destRoutine) {
                if (!destRoutine.items) destRoutine.items = [];
                destRoutine.items.push(movedItem);
            } else {
                destRoutine = {
                    ...sourceRoutine,
                    id: `temp-${Date.now()}`,
                    date: destDate,
                    items: [movedItem]
                };
                state.weeklyRoutines[destDate].push(destRoutine);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // ------ Fetch Daily Routines ------
            .addCase(fetchDailyRoutines.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchDailyRoutines.fulfilled, (state, action) => { state.loading = false; state.dailyRoutines = action.payload; })
            .addCase(fetchDailyRoutines.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

            // ------ Fetch Weekly Planner Routines ------
            .addCase(fetchWeeklyPlannerRoutines.pending, (state) => { state.weeklyLoading = true; state.error = null; })
            .addCase(fetchWeeklyPlannerRoutines.fulfilled, (state, action) => { state.weeklyLoading = false; state.weeklyRoutines = action.payload; })
            .addCase(fetchWeeklyPlannerRoutines.rejected, (state, action) => { state.weeklyLoading = false; state.error = action.payload; })

            // ------ Move Routine Item ------
            .addCase(moveRoutineItem.rejected, (state, action) => { state.error = action.payload; })

            // ------ Toggle Routine Item ------
            .addCase(toggleRoutineItem.pending, (state, action) => {
                state.toggleLoadingId = action.meta.arg;
            })
            .addCase(toggleRoutineItem.fulfilled, (state, action) => {
                state.toggleLoadingId = null;
                const updatedItem = action.payload; 
                const itemId = action.meta.arg;

                const updateItemInList = (routine) => {
                    if (!routine.items) return;
                    const itemIndex = routine.items.findIndex(i => i.id === itemId);
                    
                    if (itemIndex > -1) {
                        if (updatedItem && updatedItem.id) {
                            routine.items[itemIndex] = { ...routine.items[itemIndex], ...updatedItem };
                        } else {
                            const isDone = !routine.items[itemIndex].is_done;
                            routine.items[itemIndex].is_done = isDone;
                            routine.items[itemIndex].completed_at = isDone ? new Date().toISOString() : null;
                        }
                    }
                };

                Object.values(state.weeklyRoutines).forEach(routinesArray => {
                    routinesArray.forEach(updateItemInList);
                });

                state.dailyRoutines.forEach(updateItemInList);
            })
            .addCase(toggleRoutineItem.rejected, (state, action) => {
                state.toggleLoadingId = null;
                state.error = action.payload;
            })

            // ------ Fetch Templates ------
            .addCase(fetchTemplates.pending, (state) => { state.templateLoading = true; state.error = null; })
            .addCase(fetchTemplates.fulfilled, (state, action) => { state.templateLoading = false; state.templates = action.payload; })
            .addCase(fetchTemplates.rejected, (state, action) => { state.templateLoading = false; state.error = action.payload; })

            // ------ Create Template ------
            .addCase(createTemplate.pending, (state) => { state.templateLoading = true; state.error = null; })
            .addCase(createTemplate.fulfilled, (state, action) => { state.templateLoading = false; state.templates.unshift(action.payload); })
            .addCase(createTemplate.rejected, (state, action) => { state.templateLoading = false; state.error = action.payload; })

            // ------ Update Template ------
            .addCase(updateTemplate.pending, (state) => { state.templateLoading = true; state.error = null; })
            .addCase(updateTemplate.fulfilled, (state, action) => {
                state.templateLoading = false;
                const index = state.templates.findIndex(t => t.id === action.payload.id);
                if (index !== -1) state.templates[index] = action.payload;
            })
            .addCase(updateTemplate.rejected, (state, action) => { state.templateLoading = false; state.error = action.payload; })

            // ------ Delete Template ------
            .addCase(deleteTemplate.fulfilled, (state, action) => {
                state.templates = state.templates.filter(t => t.id !== action.payload);
            })

            // ------ Fetch Selector Data ------
            .addCase(fetchSelectorPositions.fulfilled, (state, action) => { state.selectorPositions = action.payload; })
            .addCase(fetchSelectorUsers.fulfilled, (state, action) => { state.selectorUsers = action.payload; })

            // ------ Fetch User Time Blocks ------
            .addCase(fetchUserTimeBlocks.pending, (state) => { state.timeBlockLoading = true; })
            .addCase(fetchUserTimeBlocks.fulfilled, (state, action) => {
                state.timeBlockLoading = false;
                state.timeBlocks = action.payload;
            })
            .addCase(fetchUserTimeBlocks.rejected, (state, action) => { state.timeBlockLoading = false; state.error = action.payload; })

            // ------ Split Time Block ------
            .addCase(splitUserTimeBlock.fulfilled, (state, action) => { state.timeBlocks = action.payload; })

            // ------ Update Time Block ------
            .addCase(updateUserTimeBlock.fulfilled, (state, action) => {
                const index = state.timeBlocks.findIndex(block => block.id === action.payload.id);
                if (index !== -1) state.timeBlocks[index] = action.payload;
                
                state.timeBlocks.sort((a, b) => {
                    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                    return a.start_time.localeCompare(b.start_time);
                });
            })
            // ------ Delete Time Block ------
            .addCase(deleteUserTimeBlock.fulfilled, (state, action) => {
                state.timeBlocks = state.timeBlocks.filter(block => block.id !== action.payload);
            })

            // ------ Update Boundary (Drag Resize) ------
            .addCase(updateTimeBlockBoundary.fulfilled, (state, action) => {
                const { upperData, lowerData } = action.payload;
                
                const upperIndex = state.timeBlocks.findIndex(b => b.id === upperData.id);
                if (upperIndex !== -1) state.timeBlocks[upperIndex] = upperData;
                
                const lowerIndex = state.timeBlocks.findIndex(b => b.id === lowerData.id);
                if (lowerIndex !== -1) state.timeBlocks[lowerIndex] = lowerData;
                
                state.timeBlocks.sort((a, b) => {
                    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                    return a.start_time.localeCompare(b.start_time);
                });
            })
            // ------ Difficulty Settings ------
            .addCase(fetchDifficultySettings.pending, (state) => { state.difficultyLoading = true; })
            .addCase(fetchDifficultySettings.fulfilled, (state, action) => {
                state.difficultyLoading = false;
                state.difficultySettings = action.payload;
            })
            .addCase(fetchDifficultySettings.rejected, (state, action) => {
                state.difficultyLoading = false;
                state.error = action.payload;
            })
            .addCase(updateDifficultySettings.fulfilled, (state, action) => {
                state.difficultySettings = action.payload;
            });
    },
});

export const { clearRoutineError, optimisticMoveItem } = routineSlice.actions;
export default routineSlice.reducer;