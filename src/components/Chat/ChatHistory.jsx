// src/components/Chat/ChatHistory.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveChat } from '../../features/chat/chatSlice';
import { FaHashtag, FaUser } from 'react-icons/fa';

const ChatHistory = () => {
  const dispatch = useDispatch();
  const { chats, activeChatId, loadingChats } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.userLogin);

  const getChatTitle = (chat) => {
    if (chat.chat_type === 'GROUP') return chat.project_name || 'گروه پروژه';
    if (chat.chat_type === 'PRIVATE') {
      const other = chat.members.find(m => m.id !== userInfo?.id);
      return other?.name || 'چت خصوصی';
    }
    return `پرونده #${chat.id}`;
  };

  const getIcon = (type) => {
    if (type === 'GROUP') return <FaHashtag className="text-purple-400" />;
    return <FaUser className="text-blue-400" />;
  };

  if (loadingChats) return <div className="text-center text-gray-500 mt-4">در حال لود...</div>;

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 h-full flex flex-col shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <h2 className="text-white font-bold text-lg">پیام‌های شما</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {chats.length === 0 ? (
           <p className="text-center text-gray-500 mt-10 text-sm">هنوز پیامی ندارید.</p>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => dispatch(setActiveChat(chat.id))}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                activeChatId === chat.id
                  ? 'bg-blue-600/20 border-blue-500/50'
                  : 'bg-transparent border-transparent hover:bg-gray-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                 activeChatId === chat.id ? 'bg-blue-600/30' : 'bg-gray-700'
              }`}>
                {getIcon(chat.chat_type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-bold truncate ${
                    activeChatId === chat.id ? 'text-blue-100' : 'text-gray-200'
                  }`}>
                    {getChatTitle(chat)}
                  </span>
                  {/* اینجا میشه ساعت آخرین پیام رو گذاشت */}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {chat.last_message?.text || (chat.last_message?.message_type === 'TASK' ? '📎 رویداد ماموریت' : '...')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;