// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ═══════════════════════════════════════════════════════════
// 1️⃣ Async Thunks
// ═══════════════════════════════════════════════════════════

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

export const createDirectChat = createAsyncThunk(
  'chat/createDirectChat',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/chats/direct/', { user_id: userId });
      return data; 
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
    chats: [],
    loadingChats: false,
    users: [],
    loadingUsers: false,
    activeChatId: null,
    messages: {}, 
    loadingMessages: false,
    socketConnected: false,
    error: null,
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
    },
    addMessage: (state, action) => {
      const msg = action.payload; 
      const chatId = msg.chat_id;
      
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      
      const exists = state.messages[chatId].find((m) => m.id === msg.id);
      if (!exists) {
        state.messages[chatId].push(msg); 
      }
      
      const chatIndex = state.chats.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = msg;
        const chatItem = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chatItem);
      } else {
        // 🚀 ساخت هوشمندانه چت جدید در صورت دریافت از سوکت
        // این بخش مشکل قفل شدن و نساختن نام چت را حل می‌کند
        state.chats.unshift({
            id: chatId,
            chat_type: msg.chat_type || (msg.message_type === 'SYSTEM' ? 'SYSTEM' : 'PRIVATE'), 
            last_message: msg,
            members: [],
            unread_count: 1
        });
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
      .addCase(fetchMyChats.pending, (state) => { state.loadingChats = true; })
      .addCase(fetchMyChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
      })
      .addCase(fetchChatUsers.pending, (state) => { state.loadingUsers = true; })
      .addCase(fetchChatUsers.fulfilled, (state, action) => {
        state.loadingUsers = false;
        state.users = action.payload;
      })
      .addCase(fetchChatMessages.pending, (state) => { state.loadingMessages = true; })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
      })
      .addCase(createDirectChat.fulfilled, (state, action) => {
        state.activeChatId = action.payload.chat_id;
      });
  },
});

export const { setActiveChat, addMessage, setSocketConnected, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;