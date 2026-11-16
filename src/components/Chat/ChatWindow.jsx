// src/components/Chat/ChatWindow.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../api/axiosInstance';
import {
  fetchChatMessages,
  fetchChatMembers,
  fetchMyChats,
  createDirectChat,
  uploadChatFileMessage,
  registerPendingFileBlob,
  getPendingFileBlob,
  enqueueOutboxItem,
  removeOutboxItem,
  cancelPendingDeleteLocal,
  removeOptimisticMessage,
  addMessage,
  applyMessageEdited,
  applyMessageDeleted,
  applyMessagesRead,
  applyChatPinUpdated,
  updateUserPresence,
  setChatTyping,
  setChatConnectionStatus,
  setChatPingMs,
  setIsSyncing,
} from '../../features/chat/chatSlice';
import { markModelNotificationsRead } from '../../features/notifications/notificationSlice';

const getWsBaseUrl = () => {
  const apiBase = axiosInstance?.defaults?.baseURL || '';
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
  }
  return 'wss://www.ariobonyantoos.com';
};

const formatLastSeenFa = (isoDate) => {
  if (!isoDate) return 'مدتی پیش';
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return 'مدتی پیش';

  const now = new Date();
  const diffMins = Math.floor((now.getTime() - dt.getTime()) / 60000);
  if (diffMins < 2) return 'لحظاتی پیش';
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;

  const timeStr = dt.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isToday =
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate();

  if (isToday) return `امروز ساعت ${timeStr}`;
  const dateStr = dt.toLocaleDateString('fa-IR', {
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr} ساعت ${timeStr}`;
};

const formatSecondsTimer = (totalSecs) => {
  const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
  const secs = String(totalSecs % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const getSupportedAudioMime = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
};

const AudioBubblePlayer = ({ src, isMe }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-2.5 min-w-[210px] py-1">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
          isMe
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-emerald-500 text-gray-900 hover:bg-emerald-400'
        }`}
      >
        <i className={`fas ${playing ? 'fa-pause' : 'fa-play'} text-xs`}></i>
      </button>

      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          dir="ltr"
          className="h-1.5 bg-black/30 rounded-full overflow-hidden cursor-pointer mb-1"
        >
          <div
            className={`h-full transition-all ${
              isMe ? 'bg-white' : 'bg-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] opacity-80">
          <span>پیام صوتی</span>
          <span className="font-mono">
            {formatSecondsTimer(Math.floor(playing ? currentTime : duration || currentTime))}
          </span>
        </div>
      </div>

      <a
        href={src}
        download
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="دانلود ویس"
        className="text-xs opacity-75 hover:opacity-100 p-1"
      >
        <i className="fas fa-download"></i>
      </a>
    </div>
  );
};

const ChatWindow = ({ chatId, onBack }) => {
  const dispatch = useDispatch();
  const {
    chats,
    messages,
    hasMoreByChat,
    loadingMessages,
    loadingMoreMessages,
    membersByChat,
    onlineUsers,
    userLastSeen,
    typingByChat,
    chatConnectionStatus,
    chatPingMs,
    isSyncing,
    outboxByChat,
  } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.userLogin);

  const myId = userInfo?.id ?? userInfo?.user?.id;
  const myName =
    `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() ||
    userInfo?.username ||
    '';
  const token = userInfo?.access || userInfo?.token;

  const draftKey = `koohzad_chat_draft_${chatId}`;

  const [inputText, setInputText] = useState(() => localStorage.getItem(draftKey) || '');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [forwardSelectedIds, setForwardSelectedIds] = useState([]);
  const [forwardSearch, setForwardSearch] = useState('');
  const [seenByMsg, setSeenByMsg] = useState(null);

  // Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const cancelRecordFlagRef = useRef(false);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pingSentAtRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastTypingSentAtRef = useRef(0);
  const isMountedRef = useRef(true);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageDomRefs = useRef({});
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const isLoadingOlderRef = useRef(false);

  const activeChatObj = useMemo(
    () => chats.find((c) => c.id === chatId),
    [chats, chatId]
  );
  const isSystemChat = activeChatObj?.chat_type === 'SYSTEM';
  const isGroupChat = activeChatObj?.chat_type === 'GROUP';
  const chatMessages = messages[chatId] || [];
  const activeMembers = membersByChat[chatId] || activeChatObj?.members || [];
  const pinnedInfo = activeChatObj?.pinned_message_info || null;
  const currentOutbox = outboxByChat[chatId] || [];
  const pendingForwardsCount = currentOutbox.filter(
    (x) => x.kind === 'FORWARD'
  ).length;

  const isGroupAdminOrOwner = useMemo(() => {
    if (!isGroupChat || !myId) return false;
    return activeMembers.some(
      (m) => m.id === myId && (m.role === 'OWNER' || m.role === 'ADMIN')
    );
  }, [isGroupChat, myId, activeMembers]);

  // بازیابی پیش‌نویس هنگام تغییر چت
  useEffect(() => {
    const saved = localStorage.getItem(`koohzad_chat_draft_${chatId}`) || '';
    setInputText(saved);
    setReplyingTo(null);
    setEditingMsg(null);
    setActiveActionMenuId(null);
    prevMsgCountRef.current = 0;
  }, [chatId]);

  // ذخیره پیش‌نویس متن
  useEffect(() => {
    if (editingMsg) return;
    if (inputText.trim()) {
      localStorage.setItem(draftKey, inputText);
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [inputText, editingMsg, draftKey]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // اسکرول خودکار فقط هنگام اضافه شدن پیام جدید در انتها (نه هنگام لود پیام‌های قدیمی‌تر)
  useEffect(() => {
    if (isLoadingOlderRef.current) {
      isLoadingOlderRef.current = false;
      prevMsgCountRef.current = chatMessages.length;
      return;
    }
    if (chatMessages.length > prevMsgCountRef.current) {
      scrollToBottom(prevMsgCountRef.current > 0);
    }
    prevMsgCountRef.current = chatMessages.length;
  }, [chatMessages.length, scrollToBottom]);

  // دریافت اولیه پیام‌ها و اعضا
  useEffect(() => {
    dispatch(fetchChatMessages({ chatId, limit: 50 }));
    dispatch(fetchChatMembers(chatId));
    dispatch(markModelNotificationsRead({ model: 'chat', objectId: chatId }));
  }, [dispatch, chatId]);

  // ارسال تیک خوانده‌شدن برای پیام‌های خوانده‌نشده
  const sendReadReceiptsForUnread = useCallback(
    (ws, list) => {
      if (!ws || ws.readyState !== WebSocket.OPEN || !myId) return;
      const unreadIds = list
        .filter(
          (m) =>
            m.id > 0 &&
            m.sender_id &&
            m.sender_id !== myId &&
            !m.is_read
        )
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        ws.send(
          JSON.stringify({
            type: 'read_messages',
            message_ids: unreadIds,
          })
        );
      }
    },
    [myId]
  );

  // تخلیه صف آفلاین پس از برقراری اتصال سوکت
  const flushOutboxQueue = useCallback(
    (ws) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      const queue = JSON.parse(
        localStorage.getItem(`koohzad_chat_outbox_v2_${chatId}`) || '[]'
      );
      if (queue.length === 0) {
        dispatch(setIsSyncing(false));
        return;
      }

      dispatch(setIsSyncing(true));

      queue.forEach((item) => {
        if (item.kind === 'FILE') {
          const blob = getPendingFileBlob(item.localId);
          if (blob) {
            dispatch(
              uploadChatFileMessage({
                chatId,
                file: blob,
                localId: item.localId,
                tempId: item.tempId,
                replyToId: item.replyToId,
                text: item.text,
              })
            );
          } else {
            dispatch(
              removeOutboxItem({ chatId, localId: item.localId })
            );
          }
        } else if (item.kind === 'EDIT') {
          ws.send(
            JSON.stringify({
              type: 'edit_message',
              message_id: item.messageId,
              text: item.text,
            })
          );
        } else if (item.kind === 'DELETE') {
          ws.send(
            JSON.stringify({
              type: 'delete_message',
              message_id: item.messageId,
            })
          );
        } else if (item.kind === 'FORWARD') {
          ws.send(
            JSON.stringify({
              type: 'forward_messages',
              message_id: item.messageId,
              target_chat_ids: item.targetChatIds,
              local_id: item.localId,
            })
          );
        } else if (item.kind === 'PIN') {
          ws.send(
            JSON.stringify({
              type: 'pin_message',
              message_id: item.messageId,
            })
          );
        } else if (item.kind === 'TEXT') {
          ws.send(
            JSON.stringify({
              type: 'send_message',
              message_type: 'TEXT',
              text: item.text,
              local_id: item.localId,
              ...(item.replyToId ? { reply_to_id: item.replyToId } : {}),
            })
          );
        }
      });
    },
    [chatId, dispatch]
  );

  // مدیریت اتصال WebSocket اتاق چت (بدون مصرف اضافی باتری/منابع)
  const connectChatSocket = useCallback(
    (isReconnect = false, manual = false) => {
      if (!token || !isMountedRef.current) return;

      clearTimeout(reconnectTimerRef.current);
      clearInterval(pingIntervalRef.current);

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // Ignore
        }
      }

      if (!navigator.onLine) {
        dispatch(setChatConnectionStatus('offline'));
        return;
      }

      if (!isReconnect || manual) {
        dispatch(
          setChatConnectionStatus(manual ? 'reconnecting' : 'connecting')
        );
      }

      const wsUrl = `${getWsBaseUrl()}/ws/chat/${chatId}/?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        reconnectAttemptsRef.current = 0;
        dispatch(setChatConnectionStatus('connected'));

        pingSentAtRef.current = Date.now();
        ws.send(JSON.stringify({ type: 'ping' }));

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingSentAtRef.current = Date.now();
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        flushOutboxQueue(ws);
        dispatch(fetchChatMembers(chatId));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        const type = data.type;
        if (type === 'pong') {
          if (pingSentAtRef.current) {
            dispatch(setChatPingMs(Date.now() - pingSentAtRef.current));
          }
          return;
        }

        if (type === 'connection') {
          dispatch(setChatConnectionStatus('connected'));
          flushOutboxQueue(ws);
          return;
        }

        if (type === 'user_status') {
          dispatch(updateUserPresence(data));
          return;
        }

        if (type === 'user_typing') {
          if (data.user_id && data.user_id !== myId) {
            dispatch(
              setChatTyping({
                chat_id: chatId,
                user_id: data.user_id,
                user_name: data.user_name,
                is_typing: true,
              })
            );
            setTimeout(() => {
              if (isMountedRef.current) {
                dispatch(
                  setChatTyping({
                    chat_id: chatId,
                    user_id: data.user_id,
                    is_typing: false,
                  })
                );
              }
            }, 4000);
          }
          return;
        }

        if (type === 'new_message' || type === 'broadcast_message') {
          const payload = data.payload || data;
          dispatch(addMessage(payload));
          if (payload.sender_id && payload.sender_id !== myId && payload.id > 0) {
            ws.send(
              JSON.stringify({
                type: 'read_messages',
                message_ids: [payload.id],
              })
            );
          }
          return;
        }

        if (type === 'messages_forwarded') {
          if (data.local_id) {
            dispatch(
              removeOutboxItem({ chatId, localId: data.local_id })
            );
          }
          dispatch(fetchMyChats());
          return;
        }

        if (type === 'message_edited') {
          dispatch(applyMessageEdited(data));
          return;
        }

        if (type === 'message_deleted') {
          dispatch(applyMessageDeleted(data));
          return;
        }

        if (type === 'messages_read') {
          dispatch(applyMessagesRead(data));
          return;
        }

        if (type === 'chat_pin_updated') {
          dispatch(applyChatPinUpdated(data));
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        dispatch(setChatConnectionStatus('offline'));
      };

      ws.onclose = () => {
        clearInterval(pingIntervalRef.current);
        if (!isMountedRef.current) return;
        dispatch(setChatConnectionStatus('offline'));

        if (navigator.onLine) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            30000,
            reconnectAttemptsRef.current === 1
              ? 3000
              : reconnectAttemptsRef.current * 5000
          );
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connectChatSocket(true, false);
            }
          }, delay);
        }
      };
    },
    [chatId, token, myId, dispatch, flushOutboxQueue]
  );

  useEffect(() => {
    isMountedRef.current = true;
    connectChatSocket(false, false);

    const handleOnline = () => {
      reconnectAttemptsRef.current = 0;
      connectChatSocket(true, false);
    };
    const handleOffline = () => {
      clearTimeout(reconnectTimerRef.current);
      dispatch(setChatConnectionStatus('offline'));
    };
    const handleVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine &&
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        reconnectAttemptsRef.current = 0;
        connectChatSocket(true, false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMountedRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      clearInterval(pingIntervalRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectChatSocket, dispatch]);

  // ارسال تیک خوانده‌شدن پس از لود شدن پیام‌ها
  useEffect(() => {
    if (chatConnectionStatus === 'connected' && chatMessages.length > 0) {
      sendReadReceiptsForUnread(wsRef.current, chatMessages);
    }
  }, [chatConnectionStatus, chatMessages, sendReadReceiptsForUnread]);

  // لود پیام‌های قدیمی‌تر با اسکرول به بالا
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el || loadingMoreMessages || !hasMoreByChat[chatId]) return;
    if (el.scrollTop <= 60) {
      const oldestReal = chatMessages.find((m) => m.id > 0);
      if (oldestReal) {
        isLoadingOlderRef.current = true;
        const prevHeight = el.scrollHeight;
        dispatch(
          fetchChatMessages({
            chatId,
            beforeId: oldestReal.id,
            limit: 50,
          })
        ).then(() => {
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight - prevHeight;
            }
          });
        });
      }
    }
  };

  // پرش به پیام (ریپلای یا پین) + هایلایت
  const jumpToMessage = (targetId) => {
    const node = messageDomRefs.current[targetId];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMsgId(targetId);
    setTimeout(() => {
      setHighlightedMsgId((prev) => (prev === targetId ? null : prev));
    }, 1500);
  };

  // ارسال رویداد تایپ (حداکثر هر ۳ ثانیه یکبار)
  const notifyTyping = () => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const now = Date.now();
    if (now - lastTypingSentAtRef.current < 3000) return;
    lastTypingSentAtRef.current = now;
    wsRef.current.send(JSON.stringify({ type: 'typing' }));
  };

  // ارسال پیام متنی یا ثبت ویرایش
  const handleSendOrEdit = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSystemChat) return;

    const isWsOpen = wsRef.current?.readyState === WebSocket.OPEN;

    if (editingMsg) {
      const nowIso = new Date().toISOString();
      dispatch(
        enqueueOutboxItem({
          chatId,
          item: {
            kind: 'EDIT',
            messageId: editingMsg.id,
            text: trimmed,
            editedAt: nowIso,
          },
        })
      );
      if (isWsOpen) {
        wsRef.current.send(
          JSON.stringify({
            type: 'edit_message',
            message_id: editingMsg.id,
            text: trimmed,
          })
        );
      }
      setEditingMsg(null);
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    const nowMs = Date.now();
    const localId = String(nowMs);
    const tempId = -nowMs;
    const createdAt = new Date().toISOString();

    const replySnapshot = replyingTo
      ? {
          id: replyingTo.id,
          sender_name: replyingTo.sender_name,
          text: replyingTo.text,
          message_type: replyingTo.message_type,
        }
      : null;

    const optimisticMsg = {
      id: tempId,
      chat_id: chatId,
      sender_id: myId,
      sender_name: myName,
      message_type: 'TEXT',
      text: trimmed,
      created_at: createdAt,
      local_id: localId,
      reply_to: replyingTo?.id || null,
      reply_to_message: replySnapshot,
      is_pending_sync: true,
    };

    dispatch(
      enqueueOutboxItem({
        chatId,
        item: {
          kind: 'TEXT',
          localId,
          tempId,
          text: trimmed,
          replyToId: replyingTo?.id || null,
          optimisticMessage: optimisticMsg,
        },
        optimisticMessage: optimisticMsg,
      })
    );

    if (isWsOpen) {
      wsRef.current.send(
        JSON.stringify({
          type: 'send_message',
          message_type: 'TEXT',
          text: trimmed,
          local_id: localId,
          ...(replyingTo?.id ? { reply_to_id: replyingTo.id } : {}),
        })
      );
    }

    localStorage.removeItem(draftKey);
    setInputText('');
    setReplyingTo(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // ارسال فایل / تصویر / ویس
  const handleQueueAndUploadFile = (file, forcedType = null) => {
    if (!file || isSystemChat) return;

    const nowMs = Date.now();
    const localId = String(nowMs);
    const tempId = -nowMs;
    const createdAt = new Date().toISOString();

    let detectedType = forcedType || 'FILE';
    if (!forcedType) {
      const mime = file.type || '';
      const lower = (file.name || '').toLowerCase();
      if (mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/.test(lower)) {
        detectedType = 'IMAGE';
      } else if (
        mime.startsWith('audio/') ||
        /\.(mp3|m4a|ogg|wav|aac|webm)$/.test(lower)
      ) {
        detectedType = 'AUDIO';
      } else if (
        mime.startsWith('video/') ||
        /\.(mp4|mkv|mov|avi)$/.test(lower)
      ) {
        detectedType = 'VIDEO';
      }
    }

    const previewUrl =
      detectedType === 'IMAGE' || detectedType === 'AUDIO'
        ? URL.createObjectURL(file)
        : null;

    const replySnapshot = replyingTo
      ? {
          id: replyingTo.id,
          sender_name: replyingTo.sender_name,
          text: replyingTo.text,
          message_type: replyingTo.message_type,
        }
      : null;

    const optimisticMsg = {
      id: tempId,
      chat_id: chatId,
      sender_id: myId,
      sender_name: myName,
      message_type: detectedType,
      text: file.name || 'فایل پیوست',
      file_url: previewUrl,
      created_at: createdAt,
      local_id: localId,
      reply_to: replyingTo?.id || null,
      reply_to_message: replySnapshot,
      upload_progress: 0.01,
      is_pending_sync: true,
    };

    registerPendingFileBlob(localId, file);

    dispatch(
      enqueueOutboxItem({
        chatId,
        item: {
          kind: 'FILE',
          localId,
          tempId,
          text: file.name || 'فایل پیوست',
          replyToId: replyingTo?.id || null,
          optimisticMessage: {
            ...optimisticMsg,
            file_url: null,
          },
        },
        optimisticMessage: optimisticMsg,
      })
    );

    const currentReplyId = replyingTo?.id || null;
    setReplyingTo(null);

    if (navigator.onLine) {
      dispatch(
        uploadChatFileMessage({
          chatId,
          file,
          localId,
          tempId,
          replyToId: currentReplyId,
        })
      );
    }
  };

  // ضبط ویس با MediaRecorder
  const startVoiceRecording = async () => {
    setVoiceError(null);
    if (isRecording || isSystemChat) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError('مرورگر یا اتصال فعلی از ضبط صدا پشتیبانی نمی‌کند.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMime();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      cancelRecordFlagRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        setIsRecording(false);
        setRecordSeconds(0);

        if (cancelRecordFlagRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const finalMime = recorder.mimeType || 'audio/webm';
        const ext = finalMime.includes('mp4')
          ? 'm4a'
          : finalMime.includes('ogg')
          ? 'ogg'
          : 'webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        audioChunksRef.current = [];

        if (blob.size < 1000) {
          setVoiceError('مدت زمان پیام صوتی بسیار کوتاه بود.');
          return;
        }

        const voiceFile = new File([blob], `voice_${Date.now()}.${ext}`, {
          type: finalMime,
        });
        handleQueueAndUploadFile(voiceFile, 'AUDIO');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setVoiceError('دسترسی به میکروفون رد شد یا میکروفون در دسترس نیست.');
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    cancelRecordFlagRef.current = cancel;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    } else {
      clearInterval(recordTimerRef.current);
      setIsRecording(false);
      setRecordSeconds(0);
    }
  };

  // حذف پیام (آفلاین و آنلاین)
  const handleDeleteMessage = (msg) => {
    setActiveActionMenuId(null);
    if (msg.id < 0) {
      dispatch(
        removeOptimisticMessage({
          chatId,
          tempId: msg.id,
          localId: msg.local_id,
        })
      );
      return;
    }

    dispatch(
      enqueueOutboxItem({
        chatId,
        item: {
          kind: 'DELETE',
          messageId: msg.id,
        },
      })
    );

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'delete_message',
          message_id: msg.id,
        })
      );
    }
  };

  // پین / آنپین پیام
  const handleTogglePin = (messageId) => {
    setActiveActionMenuId(null);
    let optimisticPin = null;
    if (messageId) {
      const target = chatMessages.find((m) => m.id === messageId);
      if (target) {
        optimisticPin = {
          id: target.id,
          text: target.text || `فایل (${target.message_type})`,
          sender_name: target.sender_name || 'کاربر',
        };
      }
    }

    dispatch(
      enqueueOutboxItem({
        chatId,
        item: {
          kind: 'PIN',
          messageId,
        },
        optimisticPin,
      })
    );

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'pin_message',
          message_id: messageId,
        })
      );
    }
  };

  // تایید فروارد پیام به گفتگوهای انتخاب‌شده
  const handleConfirmForward = () => {
    if (!forwardingMsg || forwardSelectedIds.length === 0) return;

    const nowMs = Date.now();
    const localId = `fwd_${nowMs}`;
    const createdAt = new Date().toISOString();

    let optimisticForward = null;
    if (forwardSelectedIds.includes(chatId)) {
      const fromName =
        forwardingMsg.forward_from_name || forwardingMsg.sender_name || '';
      optimisticForward = {
        id: -nowMs,
        chat_id: chatId,
        sender_id: myId,
        sender_name: myName,
        message_type: forwardingMsg.message_type,
        text: forwardingMsg.text,
        file_url: forwardingMsg.file_url,
        created_at: createdAt,
        local_id: localId,
        is_forwarded: true,
        forward_from_name: fromName,
        is_pending_sync: true,
      };
    }

    dispatch(
      enqueueOutboxItem({
        chatId,
        item: {
          kind: 'FORWARD',
          localId,
          messageId: forwardingMsg.id,
          targetChatIds: forwardSelectedIds,
          optimisticMessage: optimisticForward,
        },
        optimisticMessage: optimisticForward,
      })
    );

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'forward_messages',
          message_id: forwardingMsg.id,
          target_chat_ids: forwardSelectedIds,
          local_id: localId,
        })
      );
    }

    setForwardingMsg(null);
    setForwardSelectedIds([]);
    setForwardSearch('');
  };

  const getHeaderTitle = () => {
    if (isSystemChat) return 'اعلان‌های سیستم';
    if (activeChatObj?.chat_type === 'GROUP') {
      return activeChatObj.project_name?.trim() || 'گروه پروژه';
    }
    if (activeChatObj?.chat_type === 'PRIVATE') {
      const other = activeMembers.find((m) => m.id !== myId);
      return other?.name || other?.username || 'چت خصوصی';
    }
    return `گفتگو #${chatId}`;
  };

  const renderHeaderSubtitle = () => {
    if (chatConnectionStatus === 'offline') {
      return (
        <button
          type="button"
          onClick={() => connectChatSocket(true, true)}
          className="text-[11px] font-bold text-red-400 flex items-center gap-1 hover:underline"
        >
          <i className="fas fa-wifi-slash text-[10px]"></i>
          در انتظار اینترنت... (تلاش مجدد)
        </button>
      );
    }
    if (chatConnectionStatus === 'connecting') {
      return (
        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
          <i className="fas fa-circle-notch fa-spin text-[10px]"></i>
          در حال اتصال...
        </span>
      );
    }
    if (chatConnectionStatus === 'reconnecting') {
      return (
        <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1.5">
          <i className="fas fa-circle-notch fa-spin text-[10px]"></i>
          در حال اتصال مجدد...
        </span>
      );
    }
    if (isSyncing) {
      return (
        <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
          <i className="fas fa-sync fa-spin text-[10px]"></i>
          در حال همگام‌سازی...
        </span>
      );
    }

    const typingMap = typingByChat[chatId] || {};
    const typingNames = Object.entries(typingMap)
      .filter(([uid]) => Number(uid) !== Number(myId))
      .map(([, name]) => name);

    if (typingNames.length > 0) {
      return (
        <span className="text-[11px] font-bold text-emerald-400">
          {isGroupChat
            ? typingNames.length === 1
              ? `${typingNames[0]} در حال نوشتن...`
              : `${typingNames.length} نفر در حال نوشتن...`
            : 'در حال نوشتن...'}
        </span>
      );
    }

    if (activeChatObj?.chat_type === 'PRIVATE') {
      const other = activeMembers.find((m) => m.id !== myId);
      const isOnline = other
        ? Boolean(onlineUsers[other.id] ?? other.is_online)
        : false;
      const lastSeen = other
        ? userLastSeen[other.id] || other.last_seen
        : null;

      if (isOnline) {
        return (
          <span className="text-[11px] font-bold text-emerald-400">آنلاین</span>
        );
      }
      return (
        <span className="text-[11px] text-gray-400">
          آخرین بازدید {formatLastSeenFa(lastSeen)}
        </span>
      );
    }

    if (isGroupChat) {
      const total = activeMembers.length;
      const onlineCount = activeMembers.filter(
        (m) => onlineUsers[m.id] ?? m.is_online
      ).length;
      return (
        <span className="text-[11px] text-gray-400">
          {onlineCount > 0 ? `${total} عضو، ${onlineCount} آنلاین` : `${total} عضو`}
        </span>
      );
    }

    return null;
  };

  const renderPingBadge = () => {
    if (chatConnectionStatus !== 'connected' || chatPingMs == null) return null;
    const colorClass =
      chatPingMs > 350
        ? 'text-red-400 bg-red-500/15 border-red-500/30'
        : chatPingMs > 150
        ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
        : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';

    return (
      <span
        dir="ltr"
        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${colorClass}`}
      >
        {chatPingMs}ms
      </span>
    );
  };

  const otherPrivateUser =
    activeChatObj?.chat_type === 'PRIVATE'
      ? activeMembers.find((m) => m.id !== myId)
      : null;

  return (
    <div
      className="flex flex-col h-full bg-[#131314] relative"
      onClick={() => setActiveActionMenuId(null)}
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#1e1f20] border-b border-gray-800 flex items-center gap-3 shrink-0 min-h-[62px] shadow-sm">
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg text-blue-400 hover:bg-gray-700 transition-colors border border-gray-700 shrink-0"
        >
          <i className="fas fa-chevron-right text-sm"></i>
          <span className="text-sm font-medium">بازگشت</span>
        </button>

        {/* Avatar in Private Chat */}
        {otherPrivateUser && (
          <div
            onClick={() =>
              otherPrivateUser.avatar &&
              setLightboxImageUrl(otherPrivateUser.avatar)
            }
            className={`relative shrink-0 ${
              otherPrivateUser.avatar ? 'cursor-pointer' : ''
            }`}
          >
            {otherPrivateUser.avatar ? (
              <img
                src={otherPrivateUser.avatar}
                alt={getHeaderTitle()}
                className="w-10 h-10 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-blue-400 font-bold">
                {getHeaderTitle().charAt(0)}
              </div>
            )}
            {(onlineUsers[otherPrivateUser.id] ?? otherPrivateUser.is_online) &&
              chatConnectionStatus === 'connected' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1e1f20]"></span>
              )}
          </div>
        )}

        {/* Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-bold text-base truncate ${
                isSystemChat ? 'text-yellow-400' : 'text-gray-100'
              }`}
            >
              {isSystemChat && <i className="fas fa-bullhorn ml-1.5"></i>}
              {getHeaderTitle()}
            </span>
          </div>
          <div className="mt-0.5">{renderHeaderSubtitle()}</div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {renderPingBadge()}
          {isGroupChat && (
            <button
              type="button"
              onClick={() => setShowMembersModal(true)}
              title="اعضای گروه"
              className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-blue-400 flex items-center justify-center transition"
            >
              <i className="fas fa-users text-sm"></i>
            </button>
          )}
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedInfo && (
        <div
          onClick={() => jumpToMessage(pinnedInfo.id)}
          className="px-4 py-2 bg-[#25262b] border-b border-gray-800 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#2c2d33] transition shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <i className="fas fa-thumbtack text-amber-400 text-sm shrink-0"></i>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-amber-400">
                پیام پین شده • {pinnedInfo.sender_name}
              </p>
              <p className="text-xs text-gray-200 truncate">{pinnedInfo.text}</p>
            </div>
          </div>
          {!isSystemChat && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(null);
              }}
              title="حذف پین"
              className="text-gray-400 hover:text-red-400 p-1 shrink-0"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
      )}

      {/* Pending Offline Forwards Banner */}
      {pendingForwardsCount > 0 && (
        <div
          className={`px-4 py-1.5 text-xs font-bold flex items-center gap-2 border-b shrink-0 ${
            chatConnectionStatus === 'connected'
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
        >
          <i className="fas fa-circle-notch fa-spin"></i>
          <span>
            {chatConnectionStatus === 'connected'
              ? `در حال همگام‌سازی ${pendingForwardsCount} پیام هدایت‌شده...`
              : `در انتظار اینترنت برای هدایت ${pendingForwardsCount} پیام...`}
          </span>
        </div>
      )}

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {loadingMoreMessages && (
          <div className="flex justify-center py-2">
            <i className="fas fa-circle-notch fa-spin text-blue-400 text-lg"></i>
          </div>
        )}

        {loadingMessages && chatMessages.length === 0 ? (
          <div className="flex justify-center mt-16">
            <i className="fas fa-circle-notch fa-spin text-blue-500 text-2xl"></i>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <i className="fas fa-comments text-4xl mb-2 opacity-40"></i>
            <p className="text-sm">هنوز پیامی ثبت نشده است.</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            if (msg.message_type === 'TASK') return null;

            const prevMsg = index > 0 ? chatMessages[index - 1] : null;
            const curDate = msg.created_at ? new Date(msg.created_at) : null;
            const prevDate = prevMsg?.created_at
              ? new Date(prevMsg.created_at)
              : null;
            const showDateSeparator =
              curDate &&
              (!prevDate ||
                curDate.getFullYear() !== prevDate.getFullYear() ||
                curDate.getMonth() !== prevDate.getMonth() ||
                curDate.getDate() !== prevDate.getDate());

            const dateBanner = showDateSeparator ? (
              <div className="flex justify-center my-4">
                <span className="px-3.5 py-1 rounded-full bg-[#25262b] border border-gray-800 text-gray-300 text-[11px] font-bold">
                  {curDate.toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ) : null;

            if (msg.message_type === 'SYSTEM' || isSystemChat) {
              return (
                <React.Fragment key={msg.id || index}>
                  {dateBanner}
                  <div className="flex justify-center my-4">
                    <div className="bg-amber-500/10 border border-amber-500/30 text-gray-200 px-5 py-4 rounded-2xl text-[13.5px] leading-relaxed max-w-[85%] shadow-lg text-center">
                      <div className="font-black text-amber-400 mb-2 flex justify-center items-center gap-2 text-xs border-b border-amber-500/20 pb-2">
                        <i className="fas fa-bell"></i> پیام سیستم
                      </div>
                      <span className="whitespace-pre-wrap font-medium">
                        {msg.text}
                      </span>
                      <div className="text-[10px] text-gray-400 font-mono mt-2">
                        {curDate
                          ? curDate.toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            const isMe = Number(msg.sender_id) === Number(myId);
            const canDelete = isMe || isGroupAdminOrOwner;
            const isUploading =
              typeof msg.upload_progress === 'number' && msg.id < 0;
            const uploadPct = isUploading
              ? Math.round(msg.upload_progress * 100)
              : 0;
            const isHighlighted = highlightedMsgId === msg.id;

            return (
              <React.Fragment key={msg.local_id || msg.id || index}>
                {dateBanner}
                <div
                  ref={(el) => {
                    if (el && msg.id) messageDomRefs.current[msg.id] = el;
                  }}
                  className={`flex items-end gap-2 group ${
                    isMe ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Group Sender Avatar (Incoming) */}
                  {isGroupChat && !isMe && (
                    <div
                      onClick={() =>
                        msg.sender_avatar && setLightboxImageUrl(msg.sender_avatar)
                      }
                      className={`shrink-0 mb-1 ${
                        msg.sender_avatar ? 'cursor-pointer' : ''
                      }`}
                    >
                      {msg.sender_avatar ? (
                        <img
                          src={msg.sender_avatar}
                          alt={msg.sender_name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                          {(msg.sender_name || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`relative max-w-[78%] md:max-w-[65%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm transition-all ${
                      msg.is_pending_delete
                        ? 'bg-red-950/50 border border-red-500/50 opacity-75'
                        : isHighlighted
                        ? 'bg-purple-600/50 border-2 border-cyan-400'
                        : isMe
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-[#2a2b2f] border border-gray-800 text-gray-100 rounded-bl-sm'
                    } ${
                      msg.is_pending_sync && !msg.is_pending_delete
                        ? 'ring-1 ring-amber-400/60'
                        : ''
                    }`}
                  >
                    {/* Action Menu Trigger Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionMenuId(
                          activeActionMenuId === msg.id ? null : msg.id
                        );
                      }}
                      className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute top-1.5 ${
                        isMe ? 'left-1.5' : 'right-1.5'
                      } w-6 h-6 rounded-full bg-black/30 hover:bg-black/50 text-white/80 flex items-center justify-center text-xs`}
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>

                    {/* Sender Name in Incoming Messages */}
                    {!isMe && msg.sender_name && (
                      <div className="text-xs text-blue-400 font-bold mb-1">
                        {msg.sender_name}
                      </div>
                    )}

                    {/* Forwarded Badge */}
                    {msg.is_forwarded && (
                      <div className="text-[11px] italic font-semibold text-cyan-200 flex items-center gap-1 mb-1">
                        <i className="fas fa-share"></i>
                        <span>
                          {msg.forward_from_name
                            ? `هدایت‌شده از ${msg.forward_from_name}`
                            : 'پیام هدایت‌شده'}
                        </span>
                      </div>
                    )}

                    {/* Reply Snippet */}
                    {msg.reply_to_message && (
                      <div
                        onClick={() => jumpToMessage(msg.reply_to_message.id)}
                        className="mb-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 border-r-2 border-cyan-400 cursor-pointer hover:bg-black/35 transition"
                      >
                        <div className="text-[11px] font-bold text-cyan-300">
                          {msg.reply_to_message.sender_name}
                        </div>
                        <div className="text-xs text-gray-200/80 truncate">
                          {msg.reply_to_message.text || 'فایل پیوست'}
                        </div>
                      </div>
                    )}

                    {/* Body by Message Type */}
                    {isUploading ? (
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-black/25 min-w-[200px]">
                        <div className="w-9 h-9 rounded-full border-2 border-cyan-400 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0">
                          {uploadPct > 0 ? `${uploadPct}%` : '...'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {msg.text || 'در حال ارسال فایل...'}
                          </p>
                          <p className="text-[11px] text-amber-300">
                            {uploadPct > 0
                              ? `در حال آپلود... ${uploadPct}%`
                              : 'در انتظار اینترنت برای ارسال...'}
                          </p>
                        </div>
                      </div>
                    ) : msg.message_type === 'IMAGE' && msg.file_url ? (
                      <div className="space-y-1.5">
                        <div className="relative group/img">
                          <img
                            src={msg.file_url}
                            alt={msg.text || 'تصویر'}
                            onClick={() => setLightboxImageUrl(msg.file_url)}
                            className="max-w-[260px] max-h-[240px] rounded-xl object-cover cursor-pointer border border-white/10"
                          />
                          <a
                            href={msg.file_url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xs"
                          >
                            <i className="fas fa-download"></i>
                          </a>
                        </div>
                        {msg.text && !msg.file_url.endsWith(msg.text) && (
                          <p className="whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        )}
                      </div>
                    ) : msg.message_type === 'AUDIO' && msg.file_url ? (
                      <AudioBubblePlayer src={msg.file_url} isMe={isMe} />
                    ) : msg.message_type === 'VIDEO' && msg.file_url ? (
                      <div className="space-y-1">
                        <video
                          src={msg.file_url}
                          controls
                          className="max-w-[260px] max-h-[220px] rounded-xl bg-black"
                        />
                      </div>
                    ) : msg.message_type === 'FILE' && msg.file_url ? (
                      <a
                        href={msg.file_url}
                        download={msg.text || true}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-black/25 hover:bg-black/35 transition min-w-[200px]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                          <i className="fas fa-file-alt text-lg"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">
                            {msg.text || 'فایل پیوست'}
                          </p>
                          <p className="text-[10px] text-cyan-300 mt-0.5">
                            دانلود فایل
                          </p>
                        </div>
                        <i className="fas fa-download text-cyan-300 text-sm"></i>
                      </a>
                    ) : (
                      <span
                        className={`whitespace-pre-wrap break-words ${
                          msg.is_pending_delete ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {msg.text}
                      </span>
                    )}

                    {/* Pending Offline Delete Undo Banner */}
                    {msg.is_pending_delete && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-red-300 font-semibold">
                        <i className="fas fa-sync fa-spin"></i>
                        <span>در انتظار حذف (آفلاین)...</span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(
                              cancelPendingDeleteLocal({
                                chatId,
                                messageId: msg.id,
                              })
                            )
                          }
                          className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-amber-300 font-bold"
                        >
                          لغو حذف
                        </button>
                      </div>
                    )}

                    {/* Footer: Edited + Time + Read/Sync Ticks */}
                    <div
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1.5 ${
                        isMe ? 'text-blue-100/80' : 'text-gray-400'
                      }`}
                    >
                      {msg.is_edited && (
                        <span
                          className={`italic ${
                            msg.is_pending_sync && !msg.is_pending_delete
                              ? 'text-amber-300'
                              : ''
                          }`}
                        >
                          {msg.is_pending_sync && !msg.is_pending_delete
                            ? 'ویرایش شده (در انتظار همگام‌سازی) •'
                            : 'ویرایش شده •'}
                        </span>
                      )}
                      <span>
                        {curDate
                          ? curDate.toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                      {isMe && (
                        <i
                          className={`fas ${
                            msg.id < 0 || msg.is_pending_sync
                              ? 'fa-clock text-amber-300'
                              : msg.is_read
                              ? 'fa-check-double text-cyan-300'
                              : 'fa-check text-blue-100/70'
                          }`}
                        ></i>
                      )}
                    </div>

                    {/* Message Context Action Dropdown */}
                    {activeActionMenuId === msg.id && !msg.is_pending_delete && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-30 bottom-full mb-1.5 ${
                          isMe ? 'left-0' : 'right-0'
                        } w-48 rounded-xl bg-[#1e1f20] border border-gray-700 shadow-2xl py-1 text-xs text-gray-200`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMsg(null);
                            setReplyingTo(msg);
                            setActiveActionMenuId(null);
                            textareaRef.current?.focus();
                          }}
                          className="w-full px-3.5 py-2 text-right hover:bg-gray-800 flex items-center gap-2.5"
                        >
                          <i className="fas fa-reply text-cyan-400 w-4"></i>
                          <span>پاسخ دادن (Reply)</span>
                        </button>

                        {msg.id > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setForwardingMsg(msg);
                              setForwardSelectedIds([]);
                              setForwardSearch('');
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-right hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            <i className="fas fa-share text-blue-400 w-4"></i>
                            <span>هدایت پیام (Forward)</span>
                          </button>
                        )}

                        {isMe && msg.message_type === 'TEXT' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setEditingMsg(msg);
                              setInputText(msg.text);
                              setActiveActionMenuId(null);
                              textareaRef.current?.focus();
                            }}
                            className="w-full px-3.5 py-2 text-right hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            <i className="fas fa-edit text-amber-400 w-4"></i>
                            <span>ویرایش پیام</span>
                          </button>
                        )}

                        {msg.id > 0 && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(msg.id)}
                            className="w-full px-3.5 py-2 text-right hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            <i className="fas fa-thumbtack text-purple-400 w-4"></i>
                            <span>پین کردن پیام</span>
                          </button>
                        )}

                        {msg.text && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(msg.text);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-right hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            <i className="fas fa-copy text-gray-400 w-4"></i>
                            <span>کپی متن</span>
                          </button>
                        )}

                        {Array.isArray(msg.read_by) && msg.read_by.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSeenByMsg(msg);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-right hover:bg-gray-800 flex items-center gap-2.5"
                          >
                            <i className="fas fa-check-double text-emerald-400 w-4"></i>
                            <span>خوانده شده توسط ({msg.read_by.length})</span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg)}
                            className="w-full px-3.5 py-2 text-right hover:bg-red-950/50 text-red-400 flex items-center gap-2.5 border-t border-gray-800 mt-1"
                          >
                            <i className="fas fa-trash-alt w-4"></i>
                            <span>حذف پیام</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply / Edit Bar */}
      {(editingMsg || replyingTo) && !isSystemChat && (
        <div className="px-4 py-2 bg-[#25262b] border-t border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <i
              className={`fas ${
                editingMsg ? 'fa-edit text-amber-400' : 'fa-reply text-cyan-400'
              } text-sm`}
            ></i>
            <div className="min-w-0">
              <p
                className={`text-xs font-bold ${
                  editingMsg ? 'text-amber-400' : 'text-cyan-400'
                }`}
              >
                {editingMsg
                  ? 'در حال ویرایش پیام'
                  : `پاسخ به ${replyingTo.sender_name}`}
              </p>
              <p className="text-xs text-gray-300 truncate">
                {editingMsg
                  ? editingMsg.text
                  : replyingTo.text || 'فایل پیوست'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (editingMsg) {
                setEditingMsg(null);
                setInputText('');
              }
              setReplyingTo(null);
            }}
            className="text-gray-400 hover:text-white p-1"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Voice Error Banner */}
      {voiceError && (
        <div className="px-4 py-1.5 bg-red-950/70 border-t border-red-500/40 text-red-300 text-xs flex items-center justify-between shrink-0">
          <span>{voiceError}</span>
          <button
            type="button"
            onClick={() => setVoiceError(null)}
            className="text-red-200 hover:text-white"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Input Area */}
      {isSystemChat ? (
        <div className="p-4 bg-[#1e1f20] shrink-0 border-t border-gray-800 flex justify-center items-center">
          <p className="text-xs md:text-sm text-gray-500 font-bold flex items-center gap-2">
            <i className="fas fa-lock"></i>
            این یک گفتگوی یک‌طرفه سیستمی است و امکان ارسال پیام وجود ندارد.
          </p>
        </div>
      ) : (
        <div className="p-3 bg-[#1e1f20] shrink-0 border-t border-gray-800">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/40 rounded-2xl px-4 py-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0"></span>
              <span className="text-red-400 font-mono font-bold text-sm shrink-0">
                {formatSecondsTimer(recordSeconds)}
              </span>
              <span className="text-gray-300 text-xs flex-1 truncate">
                در حال ضبط پیام صوتی...
              </span>
              <button
                type="button"
                onClick={() => stopVoiceRecording(true)}
                className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs font-bold transition"
              >
                لغو
              </button>
              <button
                type="button"
                onClick={() => stopVoiceRecording(false)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-900 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <i className="fas fa-paper-plane"></i>
                <span>ارسال</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSendOrEdit}
              className="flex items-end gap-2 bg-[#131314] border border-gray-700 rounded-2xl px-2 py-1.5 focus-within:border-blue-500 transition-colors"
            >
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleQueueAndUploadFile(file);
                  }
                  e.target.value = '';
                }}
              />

              {/* Attach File Button */}
              {!editingMsg && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="ارسال فایل یا تصویر"
                  className="p-2.5 text-gray-400 hover:text-blue-400 transition shrink-0"
                >
                  <i className="fas fa-paperclip text-lg"></i>
                </button>
              )}

              <textarea
                ref={textareaRef}
                dir="auto"
                rows="1"
                className="flex-grow bg-transparent text-gray-100 px-2 py-2.5 focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed text-sm [&::-webkit-scrollbar]:hidden"
                placeholder="پیام خود را بنویسید..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  notifyTyping();
                  e.target.style.height = 'auto';
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendOrEdit(e);
                  }
                }}
              />

              {inputText.trim() ? (
                <button
                  type="submit"
                  className={`p-2.5 rounded-xl transition shrink-0 ${
                    editingMsg
                      ? 'bg-amber-500 text-gray-900 hover:bg-amber-400'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  <i
                    className={`fas ${
                      editingMsg ? 'fa-check' : 'fa-paper-plane'
                    } text-base`}
                  ></i>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  title="ضبط پیام صوتی"
                  className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800 transition shrink-0"
                >
                  <i className="fas fa-microphone text-lg"></i>
                </button>
              )}
            </form>
          )}
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-lg"
          >
            <i className="fas fa-times"></i>
          </button>
          <a
            href={lightboxImageUrl}
            download
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-5 left-5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2"
          >
            <i className="fas fa-download"></i>
            <span>دانلود تصویر</span>
          </a>
          <img
            src={lightboxImageUrl}
            alt="پیش‌نمایش"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Group Members Modal */}
      {showMembersModal && (
        <div
          onClick={() => setShowMembersModal(false)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#1e1f20] border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="px-4 py-3.5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <i className="fas fa-users text-blue-400"></i>
                اعضای گروه ({activeMembers.length} نفر)
              </h3>
              <button
                type="button"
                onClick={() => setShowMembersModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-800/70">
              {activeMembers.map((member) => {
                const isSelf = member.id === myId;
                const isMemOnline = Boolean(
                  onlineUsers[member.id] ?? member.is_online
                );
                const roleLabel =
                  member.role === 'OWNER'
                    ? 'مالک'
                    : member.role === 'ADMIN'
                    ? 'مدیر'
                    : null;

                return (
                  <div
                    key={member.id}
                    onClick={() => {
                      if (!isSelf) {
                        setShowMembersModal(false);
                        dispatch(createDirectChat(member.id));
                      }
                    }}
                    className={`px-4 py-3 flex items-center gap-3 ${
                      isSelf
                        ? 'opacity-80'
                        : 'hover:bg-[#2a2b2f] cursor-pointer transition'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-800 text-blue-400 font-bold flex items-center justify-center">
                          {(member.name || '?').charAt(0)}
                        </div>
                      )}
                      {isMemOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1e1f20]"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-100 truncate">
                          {isSelf ? `${member.name} (شما)` : member.name}
                        </span>
                        {roleLabel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            {roleLabel}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] ${
                          isMemOnline ? 'text-emerald-400' : 'text-gray-500'
                        }`}
                      >
                        {isMemOnline
                          ? 'آنلاین'
                          : `آخرین بازدید ${formatLastSeenFa(
                              userLastSeen[member.id] || member.last_seen
                            )}`}
                      </p>
                    </div>
                    {!isSelf && (
                      <i className="fas fa-comment-dots text-cyan-400 text-sm"></i>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMsg && (
        <div
          onClick={() => setForwardingMsg(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#1e1f20] border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="px-4 py-3.5 border-b border-gray-800 flex items-center justify-between gap-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <i className="fas fa-share text-blue-400"></i>
                هدایت پیام به...
              </h3>
              <div className="flex items-center gap-2">
                {forwardSelectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmForward}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    ارسال ({forwardSelectedIds.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setForwardingMsg(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="p-3 border-b border-gray-800">
              <input
                type="text"
                placeholder="جستجوی شخص یا پروژه..."
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
                className="w-full bg-[#131314] text-white text-xs rounded-xl px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto divide-y divide-gray-800/70">
              {chats
                .filter((c) => c.chat_type !== 'SYSTEM' && c.chat_type !== 'TASK')
                .filter((c) => {
                  const title =
                    c.chat_type === 'GROUP'
                      ? c.project_name || 'گروه پروژه'
                      : c.members?.find((m) => m.id !== myId)?.name ||
                        'چت خصوصی';
                  return title
                    .toLowerCase()
                    .includes(forwardSearch.toLowerCase());
                })
                .map((c) => {
                  const title =
                    c.chat_type === 'GROUP'
                      ? c.project_name || 'گروه پروژه'
                      : c.members?.find((m) => m.id !== myId)?.name ||
                        'چت خصوصی';
                  const checked = forwardSelectedIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() =>
                        setForwardSelectedIds((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((id) => id !== c.id)
                            : [...prev, c.id]
                        )
                      }
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#2a2b2f] cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gray-800 text-blue-400 font-bold flex items-center justify-center shrink-0">
                          {title.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-100 truncate">
                            {title}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {c.chat_type === 'GROUP'
                              ? 'گروه پروژه'
                              : 'گفتگوی شخصی'}
                          </p>
                        </div>
                      </div>
                      <i
                        className={`fas ${
                          checked
                            ? 'fa-check-circle text-blue-500'
                            : 'fa-circle text-gray-600'
                        } text-lg`}
                      ></i>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Seen By Modal */}
      {seenByMsg && (
        <div
          onClick={() => setSeenByMsg(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#1e1f20] border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="px-4 py-3.5 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <i className="fas fa-eye text-emerald-400"></i>
                خوانده شده توسط ({seenByMsg.read_by?.length || 0} نفر)
              </h3>
              <button
                type="button"
                onClick={() => setSeenByMsg(null)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-gray-800/70">
              {(seenByMsg.read_by || []).map((r, idx) => (
                <div
                  key={r.user_id || idx}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-100">
                    {r.name}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatLastSeenFa(r.read_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;