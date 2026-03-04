// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 1️⃣ Async Thunks
// ═══════════════════════════════════════════════════════════

// دریافت لیست چت‌های من (تاریخچه)
export const fetchMyChats = createAsyncThunk(
  'chat/fetchMyChats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/chats/');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// دریافت لیست کاربران (برای شروع چت جدید) - منتقل شده به اینجا ✅
export const fetchChatUsers = createAsyncThunk(
  'chat/fetchChatUsers',
  async (roleFilter = '', { rejectWithValue }) => {
    try {
      const url = roleFilter ? `/admin/users/?role=${roleFilter}` : '/admin/users/';
      const { data } = await axiosInstance.get(url);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// دریافت پیام‌های یک چت
export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/chats/${chatId}/messages/?limit=50`);
      return { chatId, messages: data }; 
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ایجاد چت خصوصی (Direct)
export const createDirectChat = createAsyncThunk(
  'chat/createDirectChat',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/chats/direct/', { user_id: userId });
      return data; // { chat_id: 12, direct_key: "..." }
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 2️⃣ Slice
// ═══════════════════════════════════════════════════════════

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    // لیست چت‌ها (History)
    chats: [],
    loadingChats: false,

    // لیست کاربران (Directory)
    users: [],
    loadingUsers: false,

    // چت فعال
    activeChatId: null,
    
    // پیام‌ها (کش شده بر اساس ID چت)
    messages: {}, // { [chatId]: [msg1, msg2] }
    loadingMessages: false,
    
    // وضعیت سوکت
    socketConnected: false,
    error: null,
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
    },
    // اضافه شدن پیام جدید (از سوکت)
    addMessage: (state, action) => {
      const msg = action.payload; // { chat_id, text, ... }
      const chatId = msg.chat_id;
      
      // 1. اضافه به لیست پیام‌ها
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      // جلوگیری از تکراری
      const exists = state.messages[chatId].find((m) => m.id === msg.id);
      if (!exists) {
        state.messages[chatId].push(msg); // ته لیست اضافه میشه
      }
      
      // 2. آپدیت لیست چت‌ها (Last Message)
      const chatIndex = state.chats.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = msg;
        // چت رو بیار اول لیست
        const chatItem = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chatItem);
      }
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    clearChatError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // My Chats
      .addCase(fetchMyChats.pending, (state) => { state.loadingChats = true; })
      .addCase(fetchMyChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
      })
      
      // Users List (New ✅)
      .addCase(fetchChatUsers.pending, (state) => { state.loadingUsers = true; })
      .addCase(fetchChatUsers.fulfilled, (state, action) => {
        state.loadingUsers = false;
        state.users = action.payload;
      })

      // Messages
      .addCase(fetchChatMessages.pending, (state) => { state.loadingMessages = true; })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
      })

      // Create Direct
      .addCase(createDirectChat.fulfilled, (state, action) => {
        state.activeChatId = action.payload.chat_id;
      });
  },
});

export const { setActiveChat, addMessage, setSocketConnected, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;