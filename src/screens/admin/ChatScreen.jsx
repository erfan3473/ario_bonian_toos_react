import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyChats, setActiveChat } from '../../features/chat/chatSlice';
import ChatHistory from '../../components/Chat/ChatHistory';
import ChatWindow from '../../components/Chat/ChatWindow';
import UserList from '../../components/Chat/UserList';

const ChatScreen = () => {
  const dispatch = useDispatch();
  const { activeChatId } = useSelector((state) => state.chat);
  
  // مدیریت ویو در موبایل: 'history' | 'chat' | 'users'
  const [mobileView, setMobileView] = useState('history');

  useEffect(() => {
    dispatch(fetchMyChats());
  }, [dispatch]);

  // وقتی چتی انتخاب می‌شود، در موبایل به صفحه چت برو
  useEffect(() => {
    if (activeChatId) {
      setMobileView('chat');
    }
  }, [activeChatId]);

  const handleBackToHistory = () => {
    dispatch(setActiveChat(null));
    setMobileView('history');
  };

  return (
    <div className="h-[calc(100vh-[120px])] md:h-[calc(100vh-100px)] flex bg-[#131314] overflow-hidden md:rounded-2xl md:border border-gray-800 -mx-4 md:mx-0 shadow-2xl">
      
      {/* ستون راست: تاریخچه چت‌ها */}
      <div className={`${mobileView === 'history' ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 flex-col border-l border-gray-800 bg-[#1e1f20] h-full transition-all shrink-0`}>
        <ChatHistory onOpenUsers={() => setMobileView('users')} />
      </div>

      {/* ستون وسط: پنجره چت */}
      <div className={`${mobileView === 'chat' ? 'flex' : 'hidden'} lg:flex flex-grow flex-col h-full bg-[#131314] relative min-w-0`}>
        {activeChatId ? (
          <ChatWindow chatId={activeChatId} onBack={handleBackToHistory} />
        ) : (
          <div className="hidden lg:flex h-full flex-col items-center justify-center text-gray-500 gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
              <i className="fas fa-comments text-4xl text-gray-600"></i>
            </div>
            <p className="text-lg font-medium">یک گفت‌وگو را برای شروع انتخاب کنید</p>
          </div>
        )}
      </div>

      {/* ستون چپ: مخاطبین / کاربران */}
      <div className={`${mobileView === 'users' ? 'flex' : 'hidden'} xl:flex w-full lg:w-72 flex-col border-r border-gray-800 bg-[#1e1f20] h-full shrink-0 transition-all z-10 lg:z-auto`}>
        <UserList onBack={() => setMobileView('history')} />
      </div>
      
    </div>
  );
};

export default ChatScreen;
