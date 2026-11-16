// src/components/Chat/ChatHistory.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveChat, fetchMyChats } from '../../features/chat/chatSlice';

const ChatHistory = ({ onOpenUsers }) => {
  const dispatch = useDispatch();
  const {
    chats,
    activeChatId,
    loadingChats,
    onlineUsers,
    typingByChat,
    inboxConnectionStatus,
  } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.userLogin);
  const myId = userInfo?.id ?? userInfo?.user?.id;

  const [searchQuery, setSearchQuery] = useState('');

  const getOtherMember = (chat) => {
    if (chat.chat_type !== 'PRIVATE' || !Array.isArray(chat.members)) return null;
    return chat.members.find((m) => m.id !== myId) || null;
  };

  const getChatTitle = (chat) => {
    if (chat.chat_type === 'SYSTEM') return 'اعلان‌های سیستم';
    if (chat.chat_type === 'GROUP') return chat.project_name?.trim() || 'گروه پروژه';
    if (chat.chat_type === 'PRIVATE') {
      const other = getOtherMember(chat);
      return other?.name || other?.username || 'چت خصوصی';
    }
    return `گفتگو #${chat.id}`;
  };

  const getSubtitlePreview = (chat) => {
    const typingMap = typingByChat[chat.id] || {};
    const typingNames = Object.entries(typingMap)
      .filter(([uid]) => Number(uid) !== Number(myId))
      .map(([, name]) => name);

    if (typingNames.length > 0) {
      if (chat.chat_type === 'GROUP') {
        return {
          isTyping: true,
          text: `${typingNames[0]} در حال نوشتن...`,
        };
      }
      return {
        isTyping: true,
        text: 'در حال نوشتن...',
      };
    }

    const lm = chat.last_message;
    if (!lm) {
      return {
        isTyping: false,
        text: chat.chat_type === 'GROUP' ? 'گروه پروژه (بدون پیام)' : 'بدون پیام',
      };
    }

    if (lm.message_type === 'SYSTEM') {
      return { isTyping: false, text: (lm.text || '').split('\n')[0] };
    }

    let preview = (lm.text || '').trim().replace(/\n/g, ' ');
    if (lm.message_type === 'IMAGE') {
      preview = preview ? `📷 ${preview}` : '📷 تصویر';
    } else if (lm.message_type === 'AUDIO') {
      preview = '🎤 پیام صوتی';
    } else if (lm.message_type === 'VIDEO') {
      preview = '🎬 ویدیو';
    } else if (lm.message_type === 'FILE') {
      preview = preview ? `📎 ${preview}` : '📎 فایل';
    } else if (lm.message_type === 'TASK') {
      preview = '📋 رویداد ماموریت';
    } else if (!preview) {
      preview = 'پیام';
    }

    if (
      chat.chat_type === 'GROUP' &&
      lm.sender_id !== myId &&
      lm.sender_name
    ) {
      preview = `${lm.sender_name}: ${preview}`;
    }

    return { isTyping: false, text: preview };
  };

  const formatChatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

      if (isToday) {
        return date.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return date.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // مطابق منطق جدید بک‌اند: گروه‌ها حتی بدون پیام هم نمایش داده می‌شوند
  const validChats = chats
    .filter((chat) => {
      if (chat.chat_type === 'TASK') return false;
      if (chat.chat_type === 'GROUP') return true;
      return Boolean(chat.last_message);
    })
    .filter((chat) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = getChatTitle(chat).toLowerCase();
      const lastText = (chat.last_message?.text || '').toLowerCase();
      return title.includes(q) || lastText.includes(q);
    });

  const renderConnectionBadge = () => {
    if (inboxConnectionStatus === 'offline') {
      return (
        <span
          onClick={() => dispatch(fetchMyChats())}
          title="کلیک برای تلاش مجدد"
          className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30"
        >
          <i className="fas fa-wifi-slash text-[10px]"></i>
          در انتظار اینترنت...
        </span>
      );
    }
    if (
      inboxConnectionStatus === 'connecting' ||
      inboxConnectionStatus === 'reconnecting'
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <i className="fas fa-circle-notch fa-spin text-[10px]"></i>
          {inboxConnectionStatus === 'reconnecting'
            ? 'در حال اتصال مجدد...'
            : 'در حال اتصال...'}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col relative bg-[#1e1f20]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-800 bg-[#1e1f20] space-y-2.5 shrink-0">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <i className="fas fa-inbox text-blue-500 text-lg"></i>
            <h2 className="text-white font-bold text-base truncate">
              پیام‌های شما
            </h2>
            {renderConnectionBadge()}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => dispatch(fetchMyChats())}
              title="به‌روزرسانی گفتگوها"
              className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition"
            >
              <i
                className={`fas fa-sync-alt text-xs ${
                  loadingChats ? 'fa-spin text-blue-400' : ''
                }`}
              ></i>
            </button>
            <button
              onClick={onOpenUsers}
              title="شروع چت جدید"
              className="xl:hidden w-9 h-9 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 flex items-center justify-center transition"
            >
              <i className="fas fa-edit text-sm"></i>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو در گفتگوها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131314] text-gray-200 text-xs rounded-xl pr-8 pl-7 py-2 border border-gray-800 focus:border-blue-500 focus:outline-none transition"
          />
          <i className="fas fa-search absolute right-3 top-2.5 text-gray-500 text-xs"></i>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2 text-gray-500 hover:text-gray-300 text-xs"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loadingChats && validChats.length === 0 ? (
          <div className="flex justify-center mt-10">
            <i className="fas fa-circle-notch fa-spin text-blue-500 text-2xl"></i>
          </div>
        ) : validChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
            <i className="fas fa-comment-slash text-4xl mb-3 opacity-50"></i>
            <p className="text-sm">هیچ گفتگویی یافت نشد.</p>
          </div>
        ) : (
          validChats.map((chat) => {
            const title = getChatTitle(chat);
            const otherUser = getOtherMember(chat);
            const isPrivateOnline = otherUser
              ? Boolean(onlineUsers[otherUser.id] ?? otherUser.is_online)
              : false;
            const groupOnlineCount =
              chat.chat_type === 'GROUP' && Array.isArray(chat.members)
                ? chat.members.filter(
                    (m) => onlineUsers[m.id] ?? m.is_online
                  ).length
                : 0;
            const subtitle = getSubtitlePreview(chat);
            const hasUnread = (chat.unread_count || 0) > 0;
            const isSystem = chat.chat_type === 'SYSTEM';
            const isActive = activeChatId === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => dispatch(setActiveChat(chat.id))}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-[#2a2b2f] border-gray-700'
                    : 'bg-transparent border-transparent hover:bg-[#2a2b2f]'
                }`}
              >
                {/* Avatar + Online Dot */}
                <div className="relative shrink-0">
                  {otherUser?.avatar ? (
                    <img
                      src={otherUser.avatar}
                      alt={title}
                      className="w-12 h-12 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                        isSystem
                          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                          : chat.chat_type === 'GROUP'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : isActive
                          ? 'bg-blue-900/40 text-blue-400 border border-blue-500/30'
                          : 'bg-gray-800 text-blue-400'
                      }`}
                    >
                      {isSystem ? (
                        <i className="fas fa-bullhorn"></i>
                      ) : chat.chat_type === 'GROUP' ? (
                        <i className="fas fa-users"></i>
                      ) : (
                        title.charAt(0)
                      )}
                    </div>
                  )}

                  {isPrivateOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#1e1f20]"></span>
                  )}
                </div>

                {/* Middle Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {chat.pinned_message_info && (
                        <i className="fas fa-thumbtack text-amber-400 text-[10px] shrink-0"></i>
                      )}
                      <span
                        className={`text-sm font-bold truncate ${
                          isSystem
                            ? 'text-yellow-400'
                            : isActive
                            ? 'text-blue-400'
                            : 'text-gray-100'
                        }`}
                      >
                        {title}
                      </span>
                      {isPrivateOnline && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          آنلاین
                        </span>
                      )}
                      {!isPrivateOnline && groupOnlineCount > 0 && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          {groupOnlineCount} آنلاین
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] shrink-0 ${
                        hasUnread ? 'text-blue-400 font-bold' : 'text-gray-500'
                      }`}
                    >
                      {formatChatTime(chat.last_message?.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        subtitle.isTyping
                          ? 'text-emerald-400 font-semibold'
                          : hasUnread
                          ? 'text-gray-100 font-semibold'
                          : 'text-gray-400'
                      }`}
                    >
                      {subtitle.text}
                    </p>

                    {hasUnread && (
                      <span
                        className={`shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white ${
                          isSystem ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                      >
                        {chat.unread_count > 99 ? '99+' : chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatHistory;