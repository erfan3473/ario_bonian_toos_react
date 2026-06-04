import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveChat } from '../../features/chat/chatSlice';

const ChatHistory = ({ onOpenUsers }) => {
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
    if (type === 'GROUP') return <i className="fas fa-hashtag text-purple-400"></i>;
    return <i className="fas fa-user text-blue-400"></i>;
  };

  // فیلتر کردن پیام‌های کاملا خالی برای عدم نمایش در لیست
  const validChats = chats.filter(chat => {
    if (!chat.last_message) return false;
    const isTask = chat.last_message.message_type === 'TASK';
    const hasText = chat.last_message.text && chat.last_message.text.trim() !== '';
    return isTask || hasText;
  });

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1e1f20]">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <i className="fas fa-inbox text-blue-500"></i>
          پیام‌های شما
        </h2>
        {/* دکمه شروع چت جدید (فقط در موبایل و تبلت دیده می‌شود) */}
        <button 
          onClick={onOpenUsers}
          className="xl:hidden w-10 h-10 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 flex items-center justify-center transition"
        >
          <i className="fas fa-edit"></i>
        </button>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loadingChats ? (
           <div className="flex justify-center mt-10"><i className="fas fa-circle-notch fa-spin text-blue-500 text-2xl"></i></div>
        ) : validChats.length === 0 ? (
           <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
             <i className="fas fa-comment-slash text-4xl mb-3 opacity-50"></i>
             <p className="text-sm">هیچ گفتگویی ندارید.</p>
           </div>
        ) : (
          validChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => dispatch(setActiveChat(chat.id))}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                activeChatId === chat.id
                  ? 'bg-[#2a2b2f] border-gray-700'
                  : 'bg-transparent border-transparent hover:bg-[#2a2b2f]'
              }`}
            >
              <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl ${
                 activeChatId === chat.id ? 'bg-blue-900/40 border border-blue-500/30' : 'bg-gray-800'
              }`}>
                {getIcon(chat.chat_type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-sm font-semibold truncate ${
                    activeChatId === chat.id ? 'text-blue-400' : 'text-gray-200'
                  }`}>
                    {getChatTitle(chat)}
                  </span>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {chat.last_message?.created_at ? new Date(chat.last_message.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {chat.last_message?.message_type === 'TASK' 
                    ? <><i className="fas fa-paperclip text-yellow-500 ml-1"></i>رویداد ماموریت</> 
                    : chat.last_message?.text}
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
