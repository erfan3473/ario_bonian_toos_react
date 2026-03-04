// src/screens/admin/ChatScreen.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyChats } from '../../features/chat/chatSlice';
import ChatHistory from '../../components/Chat/ChatHistory';
import ChatWindow from '../../components/Chat/ChatWindow';
import UserList from '../../components/Chat/UserList';

const ChatScreen = () => {
  const dispatch = useDispatch();
  const { activeChatId } = useSelector((state) => state.chat);

  // وقتی صفحه باز میشه، لیست چت‌های من رو بگیر
  useEffect(() => {
    dispatch(fetchMyChats());
  }, [dispatch]);

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4 p-4 overflow-hidden">
      
      {/* ستون راست: تاریخچه چت‌ها (30%) */}
      <div className="w-1/4 hidden lg:block h-full">
        <ChatHistory />
      </div>

      {/* ستون وسط: پنجره چت (45%) */}
      <div className="flex-grow h-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 relative">
        {activeChatId ? (
          <ChatWindow chatId={activeChatId} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">یک گفت‌وگو را انتخاب کنید</p>
          </div>
        )}
      </div>

      {/* ستون چپ: لیست کاربران برای شروع (25%) */}
      <div className="w-1/4 hidden xl:block h-full">
        <UserList />
      </div>
      
    </div>
  );
};

export default ChatScreen;