import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// دریافت لیست نوتیفیکیشن‌ها
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState }) => {
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token || userInfo.access}` } };
    // مسیر API را بر اساس urls.py خود تنظیم کنید
    const { data } = await axios.get('/api/notifications/?limit=20', config);
    return data; 
  }
);

// خوانده شده کردن یک یا چند نوتیف
export const markNotificationsRead = createAsyncThunk(
  'notifications/markRead',
  async (notifIds, { getState }) => {
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token || userInfo.access}` } };
    
    // تشخیص اینکه آیا می‌خواهیم همه را بخوانیم یا فقط چند آیدی خاص
    const payload = notifIds && notifIds.length > 0 
      ? { ids: notifIds } 
      : { all: true }; 

    const { data } = await axios.post('/api/notifications/mark_read/', payload, config);
    return { notifIds, unreadCount: data.unread_count };
  }
);

// این اکشن را به همراه سایر ثانک‌ها (مثلا زیر markNotificationsRead) اضافه کنید
export const markModelNotificationsRead = createAsyncThunk(
  'notifications/markModelRead',
  async ({ model, objectId }, { getState }) => {
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token || userInfo.access}` } };
    
    const payload = { model, object_id: objectId }; 

    // مسیر مربوط به mark_notifications_read بک‌اند شما (مطمئن شوید آدرس url جنگو دقیقاً همین است)
    const { data } = await axios.post('/api/notifications/mark-read/', payload, config);
    return { model, objectId, unreadCount: data.unread_count };
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    notifications: [],
    loading: false,
  },
  reducers: {
    // وقتی از وب‌سوکت پیام جدید می‌آید
    addNotificationFromWS: (state, action) => {
      const newNotif = action.payload;
      // جلوگیری از اضافه شدن تکراری
      if (!state.notifications.find(n => n.id === newNotif.id)) {
        state.notifications.unshift(newNotif); 
      }
      state.unreadCount = newNotif.unread_count !== undefined ? newNotif.unread_count : state.unreadCount + 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.results || [];
        state.unreadCount = action.payload.unread_count || 0;
      })
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
        const { notifIds } = action.payload;
        if (notifIds && notifIds.length > 0) {
          state.notifications.forEach(n => {
            if (notifIds.includes(n.id)) n.is_read = true;
          });
        } else {
          // اگر آرایه خالی بود یعنی همه را خوانده‌شده کن
          state.notifications.forEach(n => n.is_read = true);
        }
      })
         // این بخش را درون سازنده extraReducers قرار دهید
      .addCase(markModelNotificationsRead.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
        const { model, objectId } = action.payload;
        
        // نوتیف‌های مربوط به این چت/ماموریت در استیت فرانت هم خوانده شده علامت می‌خورند
        state.notifications.forEach(n => {
          if (n.model === model && String(n.object_id) === String(objectId)) {
            n.is_read = true;
          }
        });
      });
  },
});

export const { addNotificationFromWS, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
