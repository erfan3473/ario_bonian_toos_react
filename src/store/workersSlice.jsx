// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // Thunk برای دریافت لیست اولیه کارگران
// export const fetchWorkers = createAsyncThunk('workers/fetchWorkers', async () => {
//   const { data } = await axios.get('/api/workers/'); // URL API خود را جایگزین کنید
//   return data;
// });

// // Thunk برای دریافت تاریخچه یک کارگر
// export const fetchWorkerHistory = createAsyncThunk('workers/fetchWorkerHistory', async (workerId) => {
//   const { data } = await axios.get(`/api/workers/${workerId}/history/?days=1`);
//   return { workerId, history: data.map(loc => [loc.latitude, loc.longitude]) };
// });

// const workersSlice = createSlice({
//   name: 'workers',
//   initialState: {
//     // allWorkers را به صورت یک آبجکت نگه می‌داریم برای دسترسی سریع با ID
//     allWorkers: {},
//     onlineWorkerIds: new Set(),
//     // وضعیت بارگذاری و خطا برای درخواست‌های مختلف
//     loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
//     error: null,
//     history: {
//       loading: 'idle',
//       data: [],
//       error: null,
//     },
//   },
//   reducers: {
//     // اکشن برای به‌روزرسانی موقعیت از طریق WebSocket
//     updateWorkerLocation(state, action) {
//       const workerData = action.payload;
//       const workerId = workerData.id || workerData.worker_id;

//       if (workerId) {
//         state.onlineWorkerIds.add(workerId); // اضافه کردن به لیست آنلاین‌ها
//         if (state.allWorkers[workerId]) {
//           // اگر کارگر وجود داشت، فقط موقعیت و زمان را آپدیت کن
//           state.allWorkers[workerId].latitude = workerData.latitude;
//           state.allWorkers[workerId].longitude = workerData.longitude;
//           state.allWorkers[workerId].lastUpdate = Date.now();
//         } else {
//           // اگر کارگر جدید بود، آن را اضافه کن
//           state.allWorkers[workerId] = {
//             id: workerId,
//             ...workerData,
//             lastUpdate: Date.now(),
//           };
//         }
//       }
//     },
//     // اکشن برای پاک کردن تاریخچه مسیر وقتی کارگری انتخاب نشده
//     clearWorkerHistory(state) {
//       state.history.data = [];
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // مدیریت وضعیت برای دریافت لیست کارگران
//       .addCase(fetchWorkers.pending, (state) => {
//         state.loading = 'pending';
//       })
//       .addCase(fetchWorkers.fulfilled, (state, action) => {
//         state.loading = 'succeeded';
//         const workersById = {};
//         const onlineIds = new Set();
//         action.payload.forEach(worker => {
//           workersById[worker.id] = { ...worker, lastUpdate: worker.lastUpdate || Date.now() };
//           if(worker.is_online) { // فرض بر اینکه API وضعیت آنلاین بودن را برمی‌گرداند
//              onlineIds.add(worker.id);
//           }
//         });
//         state.allWorkers = workersById;
//         state.onlineWorkerIds = onlineIds;
//       })
//       .addCase(fetchWorkers.rejected, (state, action) => {
//         state.loading = 'failed';
//         state.error = action.error.message;
//       })
//       // مدیریت وضعیت برای دریافت تاریخچه مسیر
//       .addCase(fetchWorkerHistory.pending, (state) => {
//         state.history.loading = 'pending';
//       })
//       .addCase(fetchWorkerHistory.fulfilled, (state, action) => {
//         state.history.loading = 'succeeded';
//         state.history.data = action.payload.history;
//       })
//       .addCase(fetchWorkerHistory.rejected, (state, action) => {
//         state.history.loading = 'failed';
//         state.history.error = action.error.message;
//         state.history.data = [];
//       });
//   },
// });

// export const { updateWorkerLocation, clearWorkerHistory } = workersSlice.actions;
// export default workersSlice.reducer;