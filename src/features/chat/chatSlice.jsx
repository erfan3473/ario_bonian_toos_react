// src/features/chat/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const STORAGE_KEYS = {
  CHATS: 'koohzad_chat_list_v2',
  MESSAGES_PREFIX: 'koohzad_chat_msgs_v2_',
  OUTBOX_PREFIX: 'koohzad_chat_outbox_v2_',
};

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
};

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
};

// نگهداری فایل‌های در انتظار آپلود در حافظه سشن برای ارسال خودکار پس از وصل شدن اینترنت
const pendingFileBlobs = new Map();
const inFlightHttpUploads = new Set();

export const registerPendingFileBlob = (localId, file) => {
  if (localId && file) {
    pendingFileBlobs.set(String(localId), file);
  }
};

export const getPendingFileBlob = (localId) => {
  return pendingFileBlobs.get(String(localId)) || null;
};

export const removePendingFileBlob = (localId) => {
  pendingFileBlobs.delete(String(localId));
};

const sortChatsByLatest = (chats) => {
  return [...chats].sort((a, b) => {
    const dateA = a.last_message?.created_at || a.created_at;
    const dateB = b.last_message?.created_at || b.created_at;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
};

// ═══════════════════════════════════════════════════════════
// 1️⃣ Async Thunks
// ═══════════════════════════════════════════════════════════

export const fetchMyChats = createAsyncThunk(
  'chat/fetchMyChats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/chats/');
      const filtered = (Array.isArray(data) ? data : []).filter(
        (c) => c.chat_type !== 'TASK'
      );
      const sorted = sortChatsByLatest(filtered);
      writeJsonStorage(STORAGE_KEYS.CHATS, sorted);
      return sorted;
    } catch (error) {
      const cached = readJsonStorage(STORAGE_KEYS.CHATS, null);
      if (cached) return cached;
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
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchChatMembers = createAsyncThunk(
  'chat/fetchChatMembers',
  async (chatId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/chats/${chatId}/members/`);
      return { chatId, members: Array.isArray(data) ? data : [] };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async ({ chatId, beforeId = null, limit = 50 }, { rejectWithValue }) => {
    try {
      const params = { limit };
      if (beforeId) params.before_id = beforeId;
      const { data } = await axiosInstance.get(`/chats/${chatId}/messages/`, {
        params,
      });
      const list = Array.isArray(data) ? data : [];
      if (!beforeId) {
        writeJsonStorage(`${STORAGE_KEYS.MESSAGES_PREFIX}${chatId}`, list);
      }
      return {
        chatId,
        messages: list,
        beforeId,
        hasMore: list.length >= limit,
      };
    } catch (error) {
      if (!beforeId) {
        const cached = readJsonStorage(
          `${STORAGE_KEYS.MESSAGES_PREFIX}${chatId}`,
          null
        );
        if (cached) {
          return {
            chatId,
            messages: cached,
            beforeId: null,
            hasMore: cached.length >= limit,
          };
        }
      }
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const createDirectChat = createAsyncThunk(
  'chat/createDirectChat',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/chats/direct/', {
        user_id: userId,
      });
      await dispatch(fetchMyChats());
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const uploadChatFileMessage = createAsyncThunk(
  'chat/uploadChatFileMessage',
  async (
    { chatId, file, localId, tempId, replyToId = null, text = '' },
    { dispatch, rejectWithValue }
  ) => {
    const key = String(localId);
    if (inFlightHttpUploads.has(key)) {
      return rejectWithValue('ALREADY_IN_FLIGHT');
    }
    inFlightHttpUploads.add(key);

    let lastReportedPercent = -1;
    let lastEmitTime = 0;

    try {
      const formData = new FormData();
      formData.append('file', file, file.name || `voice_${localId}.webm`);
      formData.append('local_id', key);
      if (text && text.trim()) {
        formData.append('text', text.trim());
      }
      if (replyToId && replyToId > 0) {
        formData.append('reply_to', replyToId);
      }

      const { data } = await axiosInstance.post(
        `/chats/${chatId}/messages/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size || 0;
            if (total <= 0) return;
            const ratio = Math.min(0.99, Math.max(0.01, progressEvent.loaded / total));
            const percent = Math.floor(ratio * 100);
            const now = Date.now();
            if (percent - lastReportedPercent >= 4 || now - lastEmitTime >= 200) {
              lastReportedPercent = percent;
              lastEmitTime = now;
              dispatch(
                updateMessageUploadProgress({
                  chatId,
                  tempId,
                  localId: key,
                  progress: ratio,
                })
              );
            }
          },
        }
      );

      removePendingFileBlob(key);
      return { chatId, tempId, localId: key, message: data };
    } catch (error) {
      dispatch(
        updateMessageUploadProgress({
          chatId,
          tempId,
          localId: key,
          progress: 0,
        })
      );
      return rejectWithValue(error.response?.data?.detail || error.message);
    } finally {
      inFlightHttpUploads.delete(key);
    }
  }
);

// ═══════════════════════════════════════════════════════════
// 2️⃣ Slice
// ═══════════════════════════════════════════════════════════

const initialChats = readJsonStorage(STORAGE_KEYS.CHATS, []);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: initialChats,
    loadingChats: false,
    users: [],
    loadingUsers: false,
    activeChatId: null,
    messages: {},
    hasMoreByChat: {},
    loadingMessages: false,
    loadingMoreMessages: false,
    membersByChat: {},
    onlineUsers: {},
    userLastSeen: {},
    typingByChat: {},
    inboxConnectionStatus: navigator.onLine ? 'connecting' : 'offline',
    chatConnectionStatus: navigator.onLine ? 'connecting' : 'offline',
    chatPingMs: null,
    isSyncing: false,
    outboxByChat: {},
    error: null,
  },
  reducers: {
    setActiveChat: (state, action) => {
      const chatId = action.payload;
      state.activeChatId = chatId;
      if (chatId) {
        const idx = state.chats.findIndex((c) => c.id === chatId);
        if (idx !== -1) {
          state.chats[idx].unread_count = 0;
          writeJsonStorage(STORAGE_KEYS.CHATS, state.chats);
        }
        if (!state.outboxByChat[chatId]) {
          state.outboxByChat[chatId] = readJsonStorage(
            `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
            []
          );
        }
      }
    },
    setInboxConnectionStatus: (state, action) => {
      state.inboxConnectionStatus = action.payload;
    },
    setChatConnectionStatus: (state, action) => {
      state.chatConnectionStatus = action.payload;
      if (action.payload === 'offline') {
        state.isSyncing = false;
      }
    },
    setChatPingMs: (state, action) => {
      state.chatPingMs = action.payload;
    },
    setIsSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
    updateUserPresence: (state, action) => {
      const { user_id, is_online, last_seen } = action.payload || {};
      if (!user_id) return;
      state.onlineUsers[user_id] = Boolean(is_online);
      if (last_seen) {
        state.userLastSeen[user_id] = last_seen;
      }
      // به‌روزرسانی لیست اعضا در چت‌ها و اتاق چت
      state.chats.forEach((chat) => {
        if (Array.isArray(chat.members)) {
          const m = chat.members.find((mem) => mem.id === user_id);
          if (m) {
            m.is_online = Boolean(is_online);
            if (last_seen) m.last_seen = last_seen;
          }
        }
      });
      Object.keys(state.membersByChat).forEach((cid) => {
        const list = state.membersByChat[cid];
        if (Array.isArray(list)) {
          const m = list.find((mem) => mem.id === user_id);
          if (m) {
            m.is_online = Boolean(is_online);
            if (last_seen) m.last_seen = last_seen;
          }
        }
      });
    },
    setChatTyping: (state, action) => {
      const { chat_id, user_id, user_name, is_typing = true } = action.payload || {};
      if (!chat_id || !user_id) return;
      if (!state.typingByChat[chat_id]) {
        state.typingByChat[chat_id] = {};
      }
      if (is_typing) {
        state.typingByChat[chat_id][user_id] = user_name || 'کاربر';
      } else {
        delete state.typingByChat[chat_id][user_id];
      }
    },
    enqueueOutboxItem: (state, action) => {
      const { chatId, item, optimisticMessage, optimisticPin } = action.payload;
      if (!state.outboxByChat[chatId]) {
        state.outboxByChat[chatId] = readJsonStorage(
          `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
          []
        );
      }

      if (item.kind === 'PIN') {
        state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
          (x) => x.kind !== 'PIN'
        );
      } else if (item.kind === 'EDIT') {
        state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
          (x) => !(x.kind === 'EDIT' && x.messageId === item.messageId)
        );
      } else if (item.kind === 'DELETE') {
        state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
          (x) =>
            !(
              (x.kind === 'EDIT' || x.kind === 'DELETE') &&
              x.messageId === item.messageId
            )
        );
      }

      state.outboxByChat[chatId].push(item);
      writeJsonStorage(
        `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
        state.outboxByChat[chatId]
      );

      if (optimisticMessage) {
        if (!state.messages[chatId]) state.messages[chatId] = [];
        state.messages[chatId].push(optimisticMessage);
      }

      if (item.kind === 'EDIT') {
        const list = state.messages[chatId] || [];
        const target = list.find((m) => m.id === item.messageId);
        if (target) {
          target.text = item.text;
          target.is_edited = true;
          target.edited_at = item.editedAt;
          target.is_pending_sync = true;
        }
      } else if (item.kind === 'DELETE') {
        const list = state.messages[chatId] || [];
        const target = list.find((m) => m.id === item.messageId);
        if (target) {
          target.is_pending_delete = true;
          target.is_pending_sync = true;
        }
      } else if (item.kind === 'PIN') {
        const chatObj = state.chats.find((c) => c.id === chatId);
        if (chatObj) {
          chatObj.pinned_message_info = optimisticPin || null;
        }
      }

      if (state.chatConnectionStatus === 'connected') {
        state.isSyncing = true;
      }
    },
    removeOutboxItem: (state, action) => {
      const { chatId, predicateType, localId, messageId } = action.payload;
      if (!state.outboxByChat[chatId]) return;

      state.outboxByChat[chatId] = state.outboxByChat[chatId].filter((item) => {
        if (localId && item.localId === localId) return false;
        if (predicateType && item.kind === predicateType) {
          if (messageId !== undefined) return item.messageId !== messageId;
          return false;
        }
        return true;
      });

      if (state.outboxByChat[chatId].length === 0) {
        removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`);
        state.isSyncing = false;
      } else {
        writeJsonStorage(
          `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
          state.outboxByChat[chatId]
        );
      }
    },
    cancelPendingDeleteLocal: (state, action) => {
      const { chatId, messageId } = action.payload;
      if (state.outboxByChat[chatId]) {
        state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
          (item) => !(item.kind === 'DELETE' && item.messageId === messageId)
        );
        if (state.outboxByChat[chatId].length === 0) {
          removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`);
        } else {
          writeJsonStorage(
            `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
            state.outboxByChat[chatId]
          );
        }
      }

      const hasPendingEdit = (state.outboxByChat[chatId] || []).some(
        (item) => item.kind === 'EDIT' && item.messageId === messageId
      );
      const list = state.messages[chatId] || [];
      const msg = list.find((m) => m.id === messageId);
      if (msg) {
        msg.is_pending_delete = false;
        msg.is_pending_sync = hasPendingEdit;
      }
    },
    removeOptimisticMessage: (state, action) => {
      const { chatId, tempId, localId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter(
          (m) => m.id !== tempId && (!localId || m.local_id !== localId)
        );
      }
      if (state.outboxByChat[chatId]) {
        state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
          (item) =>
            item.tempId !== tempId && (!localId || item.localId !== localId)
        );
        if (state.outboxByChat[chatId].length === 0) {
          removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`);
        } else {
          writeJsonStorage(
            `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
            state.outboxByChat[chatId]
          );
        }
      }
      if (localId) removePendingFileBlob(localId);
    },
    updateMessageUploadProgress: (state, action) => {
      const { chatId, tempId, localId, progress } = action.payload;
      const list = state.messages[chatId];
      if (!list) return;
      const msg = list.find(
        (m) => m.id === tempId || (localId && m.local_id === localId)
      );
      if (msg) {
        msg.upload_progress = progress;
      }
    },
    addMessage: (state, action) => {
      const msg = action.payload;
      const chatId = msg.chat_id;
      if (!chatId) return;

      if (msg.sender_id && state.typingByChat[chatId]) {
        delete state.typingByChat[chatId][msg.sender_id];
      }

      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }

      // حذف از صف آفلاین در صورت تطابق local_id
      if (msg.local_id) {
        removePendingFileBlob(msg.local_id);
        if (state.outboxByChat[chatId]) {
          state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
            (item) => item.localId !== msg.local_id
          );
          if (state.outboxByChat[chatId].length === 0) {
            removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`);
            state.isSyncing = false;
          } else {
            writeJsonStorage(
              `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
              state.outboxByChat[chatId]
            );
          }
        }
      }

      const alreadyRealIdx = state.messages[chatId].findIndex(
        (m) => m.id === msg.id
      );
      if (alreadyRealIdx !== -1) {
        state.messages[chatId][alreadyRealIdx] = {
          ...state.messages[chatId][alreadyRealIdx],
          ...msg,
          is_pending_sync: false,
          upload_progress: undefined,
        };
      } else if (msg.local_id) {
        const tempIdx = state.messages[chatId].findIndex(
          (m) => m.local_id === msg.local_id
        );
        if (tempIdx !== -1) {
          state.messages[chatId][tempIdx] = {
            ...msg,
            is_pending_sync: false,
            upload_progress: undefined,
          };
        } else {
          state.messages[chatId].push(msg);
        }
      } else {
        state.messages[chatId].push(msg);
      }

      // ذخیره آخرین پیام‌های واقعی در کش localStorage
      const realMsgs = state.messages[chatId]
        .filter((m) => m.id > 0 && !m.is_deleted)
        .slice(-50);
      writeJsonStorage(`${STORAGE_KEYS.MESSAGES_PREFIX}${chatId}`, realMsgs);

      // به‌روزرسانی لیست چت‌ها
      const chatIndex = state.chats.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = {
          id: msg.id,
          message_type: msg.message_type,
          text: msg.text,
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          created_at: msg.created_at,
        };
        if (state.activeChatId !== chatId) {
          state.chats[chatIndex].unread_count =
            (state.chats[chatIndex].unread_count || 0) + 1;
        }
        const chatItem = state.chats.splice(chatIndex, 1)[0];
        state.chats.unshift(chatItem);
      } else {
        state.chats.unshift({
          id: chatId,
          chat_type:
            msg.chat_type ||
            (msg.message_type === 'SYSTEM' ? 'SYSTEM' : 'PRIVATE'),
          last_message: msg,
          members: [],
          unread_count: state.activeChatId === chatId ? 0 : 1,
        });
      }
      writeJsonStorage(STORAGE_KEYS.CHATS, state.chats);
    },
    handleInboxNewMessage: (state, action) => {
      const ev = action.payload;
      const chatId = ev.chat_id;
      if (!chatId) return;

      if (ev.sender_id && state.typingByChat[chatId]) {
        delete state.typingByChat[chatId][ev.sender_id];
      }

      const chatIndex = state.chats.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1) {
        const existingLastId = state.chats[chatIndex].last_message?.id;
        if (existingLastId !== ev.message_id) {
          state.chats[chatIndex].last_message = {
            id: ev.message_id,
            message_type: ev.message_type,
            text: ev.text_preview,
            sender_id: ev.sender_id,
            sender_name: ev.sender_name,
            created_at: ev.created_at,
          };
          if (state.activeChatId !== chatId) {
            state.chats[chatIndex].unread_count =
              (state.chats[chatIndex].unread_count || 0) + 1;
          }
          const chatItem = state.chats.splice(chatIndex, 1)[0];
          state.chats.unshift(chatItem);
          writeJsonStorage(STORAGE_KEYS.CHATS, state.chats);
        }
      }
    },
    applyMessageEdited: (state, action) => {
      const { chat_id, message_id, text, edited_at } = action.payload;
      if (state.outboxByChat[chat_id]) {
        state.outboxByChat[chat_id] = state.outboxByChat[chat_id].filter(
          (item) => !(item.kind === 'EDIT' && item.messageId === message_id)
        );
        if (state.outboxByChat[chat_id].length === 0) {
          removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chat_id}`);
          state.isSyncing = false;
        } else {
          writeJsonStorage(
            `${STORAGE_KEYS.OUTBOX_PREFIX}${chat_id}`,
            state.outboxByChat[chat_id]
          );
        }
      }

      const list = state.messages[chat_id];
      if (list) {
        const msg = list.find((m) => m.id === message_id);
        if (msg) {
          msg.text = text;
          msg.is_edited = true;
          msg.edited_at = edited_at;
          msg.is_pending_sync = false;
        }
        writeJsonStorage(
          `${STORAGE_KEYS.MESSAGES_PREFIX}${chat_id}`,
          list.filter((m) => m.id > 0 && !m.is_deleted).slice(-50)
        );
      }

      const chat = state.chats.find((c) => c.id === chat_id);
      if (chat?.last_message?.id === message_id) {
        chat.last_message.text = text;
        writeJsonStorage(STORAGE_KEYS.CHATS, state.chats);
      }
    },
    applyMessageDeleted: (state, action) => {
      const { chat_id, message_id } = action.payload;
      if (state.outboxByChat[chat_id]) {
        state.outboxByChat[chat_id] = state.outboxByChat[chat_id].filter(
          (item) => !(item.kind === 'DELETE' && item.messageId === message_id)
        );
        if (state.outboxByChat[chat_id].length === 0) {
          removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chat_id}`);
          state.isSyncing = false;
        } else {
          writeJsonStorage(
            `${STORAGE_KEYS.OUTBOX_PREFIX}${chat_id}`,
            state.outboxByChat[chat_id]
          );
        }
      }

      if (state.messages[chat_id]) {
        state.messages[chat_id] = state.messages[chat_id].filter(
          (m) => m.id !== message_id
        );
        writeJsonStorage(
          `${STORAGE_KEYS.MESSAGES_PREFIX}${chat_id}`,
          state.messages[chat_id].filter((m) => m.id > 0 && !m.is_deleted).slice(-50)
        );
      }
    },
    applyMessagesRead: (state, action) => {
      const { chat_id, reader_id, reader_name, message_ids, read_at } =
        action.payload;
      const list = state.messages[chat_id];
      if (!list || !Array.isArray(message_ids)) return;

      list.forEach((m) => {
        if (message_ids.includes(m.id)) {
          m.is_read = true;
          if (!Array.isArray(m.read_by)) m.read_by = [];
          if (reader_id && !m.read_by.some((r) => r.user_id === reader_id)) {
            m.read_by.push({
              user_id: reader_id,
              name: reader_name || 'کاربر',
              read_at: read_at || new Date().toISOString(),
            });
          }
        }
      });
    },
    applyChatPinUpdated: (state, action) => {
      const { chat_id, pinned_message } = action.payload;
      if (state.outboxByChat[chat_id]) {
        state.outboxByChat[chat_id] = state.outboxByChat[chat_id].filter(
          (item) => item.kind !== 'PIN'
        );
        if (state.outboxByChat[chat_id].length === 0) {
          removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chat_id}`);
          state.isSyncing = false;
        } else {
          writeJsonStorage(
            `${STORAGE_KEYS.OUTBOX_PREFIX}${chat_id}`,
            state.outboxByChat[chat_id]
          );
        }
      }

      const chat = state.chats.find((c) => c.id === chat_id);
      if (chat) {
        chat.pinned_message_info = pinned_message || null;
        writeJsonStorage(STORAGE_KEYS.CHATS, state.chats);
      }
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyChats.pending, (state) => {
        if (state.chats.length === 0) {
          state.loadingChats = true;
        }
      })
      .addCase(fetchMyChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
        action.payload.forEach((c) => {
          if (Array.isArray(c.members)) {
            c.members.forEach((m) => {
              state.onlineUsers[m.id] = Boolean(m.is_online);
              if (m.last_seen) state.userLastSeen[m.id] = m.last_seen;
            });
            if (!state.membersByChat[c.id]) {
              state.membersByChat[c.id] = c.members;
            }
          }
        });
      })
      .addCase(fetchMyChats.rejected, (state) => {
        state.loadingChats = false;
      })
      .addCase(fetchChatUsers.pending, (state) => {
        state.loadingUsers = true;
      })
      .addCase(fetchChatUsers.fulfilled, (state, action) => {
        state.loadingUsers = false;
        state.users = action.payload;
      })
      .addCase(fetchChatUsers.rejected, (state) => {
        state.loadingUsers = false;
      })
      .addCase(fetchChatMembers.fulfilled, (state, action) => {
        const { chatId, members } = action.payload;
        state.membersByChat[chatId] = members;
        members.forEach((m) => {
          state.onlineUsers[m.id] = Boolean(m.is_online);
          if (m.last_seen) state.userLastSeen[m.id] = m.last_seen;
        });
      })
      .addCase(fetchChatMessages.pending, (state, action) => {
        const { chatId, beforeId } = action.meta.arg;
        if (beforeId) {
          state.loadingMoreMessages = true;
        } else if (!state.messages[chatId] || state.messages[chatId].length === 0) {
          state.loadingMessages = true;
        }
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        const { chatId, messages, beforeId, hasMore } = action.payload;
        state.loadingMessages = false;
        state.loadingMoreMessages = false;
        state.hasMoreByChat[chatId] = hasMore;

        const outbox = readJsonStorage(
          `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
          []
        );
        state.outboxByChat[chatId] = outbox;

        const editMap = new Map();
        const deleteSet = new Set();
        const pendingOptimistics = [];

        outbox.forEach((item) => {
          if (item.kind === 'EDIT' && item.messageId > 0) {
            editMap.set(item.messageId, item);
          } else if (item.kind === 'DELETE' && item.messageId > 0) {
            deleteSet.add(item.messageId);
          } else if (
            (item.kind === 'TEXT' ||
              item.kind === 'FILE' ||
              item.kind === 'FORWARD') &&
            item.optimisticMessage
          ) {
            // اگر فایل بعد از رفرش صفحه دیگر در Blob حافظه نیست، آیتم را پاک می‌کنیم
            if (item.kind === 'FILE' && !getPendingFileBlob(item.localId)) {
              return;
            }
            pendingOptimistics.push(item.optimisticMessage);
          }
        });

        const transformedServer = messages
          .filter((m) => !m.is_deleted)
          .map((m) => {
            if (deleteSet.has(m.id)) {
              return { ...m, is_pending_delete: true, is_pending_sync: true };
            }
            if (editMap.has(m.id)) {
              const ed = editMap.get(m.id);
              return {
                ...m,
                text: ed.text,
                is_edited: true,
                edited_at: ed.editedAt,
                is_pending_sync: true,
              };
            }
            return m;
          });

        if (beforeId) {
          const existing = state.messages[chatId] || [];
          const existingIds = new Set(existing.map((m) => m.id));
          const olderUnique = transformedServer.filter(
            (m) => !existingIds.has(m.id)
          );
          state.messages[chatId] = [...olderUnique, ...existing];
        } else {
          const serverIds = new Set(transformedServer.map((m) => m.id));
          const filteredPending = pendingOptimistics.filter(
            (pm) => !serverIds.has(pm.id)
          );
          state.messages[chatId] = [...transformedServer, ...filteredPending];
        }
      })
      .addCase(fetchChatMessages.rejected, (state) => {
        state.loadingMessages = false;
        state.loadingMoreMessages = false;
      })
      .addCase(uploadChatFileMessage.fulfilled, (state, action) => {
        const { chatId, tempId, localId, message } = action.payload;
        if (!state.messages[chatId]) state.messages[chatId] = [];

        if (state.outboxByChat[chatId]) {
          state.outboxByChat[chatId] = state.outboxByChat[chatId].filter(
            (item) => item.localId !== localId && item.tempId !== tempId
          );
          if (state.outboxByChat[chatId].length === 0) {
            removeStorage(`${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`);
            state.isSyncing = false;
          } else {
            writeJsonStorage(
              `${STORAGE_KEYS.OUTBOX_PREFIX}${chatId}`,
              state.outboxByChat[chatId]
            );
          }
        }

        const list = state.messages[chatId];
        const realIdx = list.findIndex((m) => m.id === message.id);
        const tempIdx = list.findIndex(
          (m) => m.id === tempId || m.local_id === localId
        );

        if (realIdx !== -1) {
          if (tempIdx !== -1 && tempIdx !== realIdx) {
            list.splice(tempIdx, 1);
          }
        } else if (tempIdx !== -1) {
          list[tempIdx] = {
            ...message,
            is_pending_sync: false,
            upload_progress: undefined,
          };
        } else {
          list.push(message);
        }

        writeJsonStorage(
          `${STORAGE_KEYS.MESSAGES_PREFIX}${chatId}`,
          list.filter((m) => m.id > 0 && !m.is_deleted).slice(-50)
        );
      })
      .addCase(createDirectChat.fulfilled, (state, action) => {
        state.activeChatId = action.payload.chat_id;
      });
  },
});

export const {
  setActiveChat,
  setInboxConnectionStatus,
  setChatConnectionStatus,
  setChatPingMs,
  setIsSyncing,
  updateUserPresence,
  setChatTyping,
  enqueueOutboxItem,
  removeOutboxItem,
  cancelPendingDeleteLocal,
  removeOptimisticMessage,
  updateMessageUploadProgress,
  addMessage,
  handleInboxNewMessage,
  applyMessageEdited,
  applyMessageDeleted,
  applyMessagesRead,
  applyChatPinUpdated,
  clearChatError,
} = chatSlice.actions;

export default chatSlice.reducer;