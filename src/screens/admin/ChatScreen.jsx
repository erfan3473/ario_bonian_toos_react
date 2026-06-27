import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyChats, setActiveChat } from '../../features/chat/chatSlice';
import ChatHistory from '../../components/Chat/ChatHistory';
import ChatWindow from '../../components/Chat/ChatWindow';
import UserList from '../../components/Chat/UserList';

const ChatScreen = () => {
  const dispatch = useDispatch();
  const { activeChatId } = useSelector((state) => state.chat);
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [mobileView, setMobileView] = useState('history');

  useEffect(() => {
    dispatch(fetchMyChats());
  }, [dispatch]);

  useEffect(() => {
    if (activeChatId) setMobileView('chat');
  }, [activeChatId]);

  const handleBackToHistory = () => {
    dispatch(setActiveChat(null));
    setMobileView('history');
  };

  return (
    <div
      className={`h-[calc(100vh-120px)] md:h-[calc(100vh-100px)] flex overflow-hidden md:rounded-2xl md:border -mx-4 md:mx-0 shadow-2xl
      ${isDark ? 'bg-blue-800 border-blue-700' : 'bg-white border-gray-200'}`}
    >
      <div
        className={`${mobileView === 'history' ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 flex-col border-l h-full transition-all shrink-0
        ${isDark ? 'bg-[#1e1f20] border-gray-800' : 'bg-white border-gray-200'}`}
      >
        <ChatHistory onOpenUsers={() => setMobileView('users')} />
      </div>

      <div
        className={`${mobileView === 'chat' ? 'flex' : 'hidden'} lg:flex flex-grow flex-col h-full relative min-w-0
        ${isDark ? 'bg-blue-800' : 'bg-white'}`}
      >
        {activeChatId ? (
          <ChatWindow chatId={activeChatId} onBack={handleBackToHistory} />
        ) : (
          <div className={`hidden lg:flex h-full flex-col items-center justify-center gap-4 ${isDark ? 'text-blue-100/70' : 'text-gray-400'}`}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-700' : 'bg-gray-200'}`}>
              <i className={`fas fa-comments text-4xl ${isDark ? 'text-blue-200/70' : 'text-gray-500'}`}></i>
            </div>
            <p className="text-lg font-medium">یک گفت‌وگو را برای شروع انتخاب کنید</p>
          </div>
        )}
      </div>

      <div
        className={`${mobileView === 'users' ? 'flex' : 'hidden'} xl:flex w-full lg:w-72 flex-col border-r h-full shrink-0 transition-all z-10 lg:z-auto
        ${isDark ? 'bg-[#1e1f20] border-gray-800' : 'bg-white border-gray-200'}`}
      >
        <UserList onBack={() => setMobileView('history')} />
      </div>
    </div>
  );
};

export default ChatScreen;
