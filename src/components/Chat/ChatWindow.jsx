// src/components/Chat/ChatWindow.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatMessages, addMessage, setSocketConnected } from '../../features/chat/chatSlice';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

const ChatWindow = ({ chatId }) => {
  const dispatch = useDispatch();
  const { messages, loadingMessages } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.userLogin);
  
  const [inputText, setInputText] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  // پیام‌های این چت خاص
  const chatMessages = messages[chatId] || [];

  // 1. اسکرول به پایین
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // 2. لود اولیه پیام‌ها
  useEffect(() => {
    dispatch(fetchChatMessages(chatId));
  }, [dispatch, chatId]);

  // 3. اتصال وب‌سوکت (دقیقاً طبق بک‌اند جنگو)
  useEffect(() => {
    const token = userInfo?.access;
    if (!token) return;

    // بستن سوکت قبلی
    if (ws.current) ws.current.close();

    // URL: wss://ariobonyantoos.com/ws/chat/12/?token=...
    // نکته: در محیط لوکال ممکنه آدرس فرق کنه، اینجا آدرس پروداکشن رو فرض کردم یا از کانفیگ بخون
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // اگر بک‌اند روی پورت دیگه یا دامین دیگه‌ست باید دستی ست کنی. فعلا نسبی می‌زنیم:
    const wsUrl = `wss://ariobonyantoos.com/ws/chat/${chatId}/?token=${token}`; 

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected:', chatId);
      dispatch(setSocketConnected(true));
      
      // Ping Interval (مثل فلاتر)
      ws.current.pingInterval = setInterval(() => {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') return;

      if (data.type === 'new_message' || data.type === 'broadcast_message') {
        // اگر فرمت بک‌اند payload داشت
        const payload = data.payload || data;
        dispatch(addMessage(payload));
      }
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected');
      dispatch(setSocketConnected(false));
      clearInterval(ws.current?.pingInterval);
    };

    return () => {
      if (ws.current) ws.current.close();
      clearInterval(ws.current?.pingInterval);
    };
  }, [chatId, userInfo, dispatch]);

  // 4. ارسال پیام
  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !ws.current) return;

    const payload = {
      type: 'send_message',
      message_type: 'TEXT',
      text: inputText,
      local_id: Date.now().toString() // برای Optimistic UI که بعداً هندل می‌شه
    };

    ws.current.send(JSON.stringify(payload));
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <span className="font-bold text-white">چت #{chatId}</span>
        {loadingMessages && <FaSpinner className="animate-spin text-blue-500" />}
      </div>

      {/* Messages List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-opacity-50">
        {chatMessages.map((msg, index) => {
          const isMe = msg.sender_id === userInfo?.id;
          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                }`}
              >
                {!isMe && (
                   <div className="text-xs text-blue-300 font-bold mb-1">{msg.sender_name}</div>
                )}
                
                {msg.message_type === 'TASK' ? (
                  <div className="border-r-2 border-yellow-400 pr-2 bg-yellow-900/20 p-2 rounded">
                    <p className="font-bold text-yellow-400 text-xs mb-1">📋 ماموریت</p>
                    {msg.task_event?.note || 'رویداد سیستم'}
                  </div>
                ) : (
                  msg.text
                )}

                <div className={`text-[10px] mt-1 flex justify-end opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          className="flex-grow bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="پیامی بنویسید..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 rounded-xl transition shadow-lg"
        >
          <FaPaperPlane className={document.dir === 'rtl' ? 'rotate-180' : ''} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;